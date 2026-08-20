# PYQ Backend — Detailed Analysis & Improvements

> Scope: `server/` (Express + MongoDB + Cloudinary) and `client/` (Next.js) PYQ + PDF watermark pipeline.
> Written for: exam-season planning (target **400–500 PYQ visits/day** on Render **free tier**, 512 MB RAM).
> Date: 2026-08-14 · Branch: `dev`

---

## 1. What "one PYQ visit" costs (request flow)

Every time a student opens the PYQ section, these requests hit the server:

| Step | Route | Auth | Weight |
|---|---|---|---|
| 1. Open `/pyq` (dept list) | `GET /api/departments` | public | light (cached 5 min) |
| 2. Open `/pyq/:deptId` | `GET /api/departments/:id` | public | light (cached 5 min) |
| 3. Same page | `GET /api/departments/:id/branches` | public | light (cached 5 min) |
| 4. Same page | `GET /api/sessions` | public | light (cached 5 min) |
| 5. Same page — paper list | `GET /api/pyq?departmentId=…` | public | medium (DB query + 4 `populate`) |
| 6. Tap "View paper" | `POST /api/pyq/:id/view` | public | light (1 DB write) |
| 7. Tap "View paper" | `GET /api/pdf/view/:id?type=pyq` | **JWT** | 🔴 **HEAVY** (watermark render) |
| 8. Tap download in viewer | `POST /api/pyq/:id/download` | public | light (1 DB write) |
| 9. Tap download in viewer | `GET /api/pdf/download/:id?type=pyq` | **JWT** | 🔴 **HEAVY** (watermark render) |

So a single "look at one paper" = **1 heavy PDF render**; a "view + download" = **2 heavy renders**.

The other ~7 requests are cheap and already cached/sharded by rate limiters. **The entire capacity question is: "how many watermark renders per second can a 512 MB Render free instance sustain?"**

---

## 2. The watermark pipeline (deep dive)

File: `server/src/controllers/pdfController.js`

### 2.1 What happens on every PDF request (cache MISS)

```
GET /api/pdf/view/:id  (JWT required)
  └─ authenticateJWT            → 1 Mongo read (User.findById)  ← every request
  └─ loadPaper(id, 'pyq')       → 1 Mongo read (PYQPaper + 3 populates)
  └─ buildWatermarkedPdf(paper, user)
       ├─ 1. cacheKey = watermarked:{paperId}:{userId}:{minuteBucket}
       ├─ 2. getCache(cacheKey)        → miss
       ├─ 3. cloudinaryAxios.get(url)  → downloads FULL PDF (2–10 MB) into RAM
       ├─ 4. PDFDocument.load(bytes)   → pdf-lib parses ENTIRE document (~3–10× file size RAM)
       ├─ 5. applyWatermark(pdfDoc, user)
       │     ├─ embeds HelveticaBold + Helvetica
       │     ├─ per page: big diagonal "INVERTISPREP" (per-char gradient, 68 pt, α=0.12)
       │     └─ per page: footer "PYQs available for free on www.invertisprep.in"
       │                  + "{user.email} • {timestamp}"   (7 pt, α=0.48)
       ├─ 6. pdfDoc.save()             → serializes whole doc again (another full copy)
       ├─ 7. setCache(cacheKey, bytes, 60_000)  ← ⚠️ unbounded map, see §2.3
       └─ 8. res.send(buffer)          → another Buffer.from() copy
```

### 2.2 What the watermark actually is

- **Per page**: one big diagonal **gradient** `INVERTISPREP` word (indigo → purple → pink, simulated per-character since pdf-lib has no gradients), rotated −35°, opacity 0.12.
- **Per page**: footer line 1 (branding), footer line 2 = **user email + exact timestamp** (opacity 0.48, 7 pt).
- It is baked into a **new PDF file** (pdf-lib re-serializes every page). This is the expensive part — not the watermark drawing itself, but parse + reserialize of the whole document on every miss.

### 2.3 ⚠️ Cache analysis — the single biggest problem

`server/src/utils/cache.js` exposes **two** caches:

| Cache | Kind | Cap | Actually used by PDF? |
|---|---|---|---|
| `ttlCache` (via `getCache`/`setCache`) | plain `Map` | **UNBOUNDED** | ✅ **yes** (pdfController.js:215,230) |
| `pdfCache` (LRU) | LRU, 40 entries / 80 MB | bounded | ❌ **no — dead code** (imported, never called) |

Consequences:

1. **Cache key includes the minute bucket**: `…:${Date.now()/(60_000)|0}` — so even the *same user* re-opening the *same paper* in the *next minute* pays a **full re-render**. The "1 minute TTL" means the cache is almost never useful.
2. **Cache key includes `user.id`** — so 5 different students viewing the same hot paper within one minute = **5 full renders** of the same PDF. The watermark's only user-specific bits are email + timestamp.
3. **Memory leak (critical)**: `setCache` never evicts; expired entries are only deleted by `getCache` **when that exact key is read again**. Keys like `watermarked:{paper}:{user}:{minute}` are set, then never looked up again (the user's next request creates a *new* key). Every PDF render permanently adds one entry holding a **full watermarked PDF (2–10 MB+)** to the Map until the process restarts.

    - 400–500 visits/day ≈ **500–1,000+ leaked entries/day** (worst case much more).
    - 1,000 × ~4 MB avg ≈ **4 GB of dead buffers** — the 512 MB instance will OOM and crash mid-exam-peak, and on restart the cache is empty → cold start → re-render everything → likely crash-loop during a rush.

   The `pdfCache` LRU class with `maxEntries: 40` / `maxBytes: 80 MB` was *written exactly for this* and is **never wired in**.

4. **Browser caching is disabled**: every response sends `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`. A student closing and reopening the same paper hits the server again instead of the browser cache.

---

## 3. Render free tier — what it can actually do

Render free instance (from Render's published specs, matching this codebase's tuning):

- **512 MB RAM**, shared CPU (≈0.5–1 effective vCPU), 1 process.
- **Sleeps after 15 min idle** → cold starts (first request after sleep pays Cloudinary fetch + full render: 3–10 s).
- 750 free instance-hours/month (one instance 24/7 ≈ 744 h — fine).

### 3.1 Cost of one watermark render

| PDF size (scanned papers) | pdf-lib parse+save RAM | Time (single-threaded Node) |
|---|---|---|
| 1 MB, 4 pages | ~10–30 MB transient | ~0.3–0.8 s |
| 5 MB, 12 pages | ~40–120 MB transient | ~1–3 s |
| 10 MB, 25 pages | ~80–250 MB transient | ~3–8 s |

`pdf-lib` is **synchronous CPU-bound** — while one render runs, the event loop is blocked (no other request is served). The Cloudinary download also blocks on network I/O for that request.

### 3.2 How many users can view concurrently?

**Safe concurrency today (before any fixes):** ~**3–6 simultaneous PDF views** without OOM risk, and only if papers are small. Two students opening two 10 MB scanned papers at the exact same moment can already exceed 512 MB transiently → OOM → instance restart → all concurrent users see errors.

**Effective throughput today:** Node's single event loop + 1–3 s per render means roughly **1 render per 1–3 seconds sustained**. In a burst (e.g., 10 students click "view" within the same 10 s), the last ones wait **10–30 s** behind a serial queue — and the in-memory cache leak makes it worse the longer the instance has been up.

### 3.3 Does 400–500 visits/day fit? (mathematically)

Assume exam season worst case:

- 500 visits/day, 80% in an 8-hour window (10:00–18:00), so ~50/h.
- Say **60%** open at least one paper → ~300 PDF renders/day.
- Bursts: 5-minute spikes (bell rings between classes, exam day before a paper) can be **3–4× average** → **3–6 renders/min** (0.05–0.1/s).

**Verdict: the *average* load is trivially fine; the *burst* load is exactly at the edge of what a 512 MB instance can do today, and the cache leak turns it into an outage.** The real risks in order:

1. **Unbounded cache leak → OOM mid-peak** (guaranteed over a multi-day exam window).
2. **Per-user + per-minute cache keys → every re-open re-renders** (wasted CPU/RAM).
3. **Cold start after 15 min idle** — first users after a gap pay 5–10 s renders; on Render free there's no scheduler, so it will sleep during lunch gaps exactly when exams let out.
4. **Shared-IP campus NAT**: if the whole college sits behind one public IP, `pdfLimiter` (120/min/IP) and `apiLimiter` (1000/15 min/IP) can throttle *everyone* during a rush. (PDF routes are JWT-protected, so those could key by user instead of IP; the public `POST /:id/view|download` can't.)

---

## 4. Suggested improvements (ranked by impact/effort)

### P0 — Do these before exam season

**1. Wire the existing LRU into the PDF path (10 min, huge win)**
`pdfController.js` already imports `pdfCache` (`new LRU(40, 80 MB)`). Use it as the primary cache in `buildWatermarkedPdf` instead of `setCache`:
```js
const cached = pdfCache.get(cacheKey);
if (cached) return cached;
// …render…
pdfCache.set(cacheKey, watermarkedBytes);
```
This bounds memory to 80 MB no matter what. Keep `getCache`/`setCache` for the tiny metadata caches (branches/departments/sessions) where it's safe.

**2. Stop leaking the plain Map, or cap it**
Either delete `setCache` usage from the PDF path entirely (point 1 does this) or add a size guard to `ttlCache` (evict oldest when `size > N`). Do not leave an unbounded store that holds multi-MB buffers.

**3. Make the cache actually reusable — drop the minute bucket; cache per (user, paper)**
```js
const cacheKey = `watermarked:${paper._id}:${user.id}`;
pdfCache.set(cacheKey, watermarkedBytes); // no TTL needed — LRU evicts
```
Trade-off: the footer timestamp freezes at first render. That's acceptable (and arguably better — a frozen watermark is easier to compare/verify). If you want freshness, bump it to a daily bucket `…:${Date.now()/(24h)}` — the email is what identifies the leaker anyway.

**4. Let the browser cache PDFs** — `Cache-Control: private, max-age=300` on `/pdf/view` (not on download, where you want a fresh file name; and keep `no-store` off). Re-opening the same paper in the same tab = zero server cost. Even with a private cache, a determined user can still screenshot — this is deterrence, not DRM.

**5. Add a concurrency guard on renders (simple semaphore)**
```js
let activeRenders = 0; const MAX_RENDERS = 2; // tune for 512 MB
// in buildWatermarkedPdf: if activeRenders >= MAX_RENDERS, await a small queue (or 429)
```
This converts OOM-crashes into graceful serialization. With point 1–3 in place, hit rate goes up so the guard almost never engages anyway.

**6. Keep the instance warm during exam season**
Add a ping (UptimeRobot / cron hitting `/health`) every 5–10 min. Free Render sleeps after 15 min idle; a warm instance avoids 5–10 s cold renders hitting the first student after lunch.

### P1 — Strong wins, small code

**7. Split static vs dynamic watermark — pre-bake the static part**
Currently every render draws the big gradient word + footer on **every page** and re-serializes the whole file. Instead:
- At **verify time**, generate `static_{paperId}` = PDF with the gradient watermark + footer line 1 **only** (no user data) and cache it in the LRU **indefinitely** (per-paper, shared by all users — the single most cacheable object in the app).
- At request time: fetch the cached static PDF, then overlay *only* footer line 2 (email + time) — ideally only on **page 1** — and cache the final bytes per (user, paper) as above.

This drops per-user render work by ~90% and makes the hot path "copy buffer + one small overlay" instead of "download + parse + full re-serialize".

**8. Cache the raw Cloudinary PDF too (or preload popular papers)**
On a cache miss you still download 2–10 MB from Cloudinary every time. Cache `raw:{paperId}` (the original bytes) in the LRU as well, or seed the cache on verify. Popular papers (e.g., all 2nd-sem B.Tech end-terms) then never touch Cloudinary during the rush.

**9. Merge tracking into the PDF endpoint**
`handleView`/`handleDownload` fire `POST /:id/view` + `GET /pdf/view` (2 round trips). Pass `?track=view|download` to the PDF route and do the `$inc` there — halves the request count and removes the window where a view is tracked but the PDF fails (or vice versa). (Also removes two unauthenticated endpoints that currently let anyone inflate counters.)

**10. Reduce render cost by shrinking the input**
Scanned papers are usually way oversized. Compress at upload (e.g., Ghostscript `-dPDFSETTINGS=/ebook` or `-dPDFSETTINGS=/printer`) or limit max pages. A 3 MB paper renders ~3× faster and uses ~3× less RAM than a 10 MB one — this is the cheapest "capacity upgrade" available.

**11. Key the PDF limiter by user, not IP**
`pdfLimiter` (120/min) runs on `/api/pdf` where JWT is required — use `req.user.id` in the key so a shared college NAT IP doesn't throttle the whole campus. Also raise `RATE_LIMIT_*` envs during exam week if you observe 429s.

**12. Authenticate once per request, not per PDF render**
`authenticateJWT` hits Mongo on every request. Add a short (1–5 min) TTL cache of `token → user` (or `user.id → role/isActive`) so the PDF hot path skips the DB. Invalidate on role/status change or accept ≤5 min staleness (same trade-off you already made with the 5-min metadata caches).

### P2 — Larger, only if you outgrow the fixes above

- **Pre-render on Cloudinary**: Cloudinary can overlay text onto PDFs at *delivery* time via URL transformations (`l_text:...`, `f_pdf`), pushing the render cost to their edge. Caveat: it rasterizes/transforms, complicates the per-user email (needs signed URLs), and changes "raw" semantics — evaluate carefully.
- **Serve static watermark from Cloudinary, dynamic footer from server** (equivalent to point 7 but with Cloudinary doing the static bake). You keep per-user footers without touching your CPU.
- **Move off free tier for peak week**: Render's smallest paid instance (1 GB) gives 2× memory and no sleep; the $/month cost is trivial next to a bad exam-week outage. Keep the P0 fixes regardless — they matter on any instance size.
- **Redis (Upstash) only if you ever run 2+ instances** — for a single free instance, in-process LRU is strictly better (no network hop). Do not add Redis for this scale.
- **Monitoring**: expose `renderCount`, `cacheHitRate`, `avgRenderMs`, `activeRenders` on `/health` (or a `/metrics` route) so you can watch peak behavior from Render logs before it bites.

---

## 5. Realistic capacity after P0 fixes (512 MB free tier)

| Scenario | Today | After P0 (1–6) |
|---|---|---|
| Safe concurrent PDF views | ~3–6 (small papers) | ~8–15 (guarded, 80 MB LRU cap) |
| Sustained renders/min | ~20–60 | ~20–60 (same CPU — cache hides repeats) |
| Re-open same paper (same user) | full re-render | **LRU hit — near zero cost** |
| 5 users open same hot paper | 5 renders | 1 render + 4 LRU hits |
| Memory over a 3-day exam window | **OOM crash, guaranteed** | flat, bounded at 80 MB |
| 400–500 visits/day | risky bursts + crash risk | **comfortable** |

The **CPU** is the fixed ceiling (~1 render/s sustained on this instance), so the whole game is **not wasting renders**. P0 items 1–4 directly attack that: they turn "every open = render" into "only genuinely new (user, paper) opens render".

---

## 6. Summary checklist

- [ ] **P0-1** Use `pdfCache` LRU in `buildWatermarkedPdf`
- [ ] **P0-2** Stop unbounded `setCache` growth in the PDF path (or cap the Map)
- [ ] **P0-3** Remove the minute bucket; cache per `(paper, user)` (no TTL, LRU evicts)
- [ ] **P0-4** `Cache-Control: private, max-age=300` on `/pdf/view`
- [ ] **P0-5** Concurrency semaphore (max ~2 renders)
- [ ] **P0-6** UptimeRobot ping `/health` every 5–10 min during exam season
- [ ] **P1-7** Pre-bake static watermark per paper at verify time
- [ ] **P1-8** Cache raw Cloudinary bytes (or preload hot papers)
- [ ] **P1-9** Fold view/download tracking into the PDF endpoint
- [ ] **P1-10** Compress/limit scanned PDFs at upload
- [ ] **P1-11** Key `pdfLimiter` by user id; raise limits during exam week
- [ ] **P1-12** Short-TTL token→user cache to skip Mongo on the PDF hot path
- [ ] **P2** Cloudinary delivery-time overlay / paid 1 GB instance for peak week / metrics endpoint (as needed)

---

*Key files referenced: `server/src/controllers/pdfController.js`, `server/src/controllers/pyqController.js`, `server/src/routes/pdf.js`, `server/src/routes/pyq.js`, `server/src/utils/cache.js`, `server/src/middleware/rateLimit.js`, `server/src/middleware/auth.js`, `server/src/server.js`, `server/src/models/PYQPaper.js`, `client/app/view/[id]/page.tsx`, `client/components/PDFViewer.tsx`.*
