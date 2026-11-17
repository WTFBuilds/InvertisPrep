# 🎓 InvertisPrep 

> Previous-Year-Question (PYQ) paper management platform for **Invertis University**.
> Students browse, view, and contribute verified question papers; staff/admins
> curate and verify content.


A monorepo with a **Next.js** client, **two Express microservices** (main API + PDF
service) sharing **MongoDB** and **Redis**, and a **Kotlin WebView** Android app that
wraps the webapp with a Google OAuth deep-link flow.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Features](#features)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Caching Strategy (Redis)](#caching-strategy-redis)
- [PDF Pipeline / Cloudinary Storage](#pdf-pipeline--cloudinary-storage)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Testing & Validation Scripts](#testing--validation-scripts)
- [npm Scripts](#npm-scripts)
- [Deployment](#deployment)
- [Android WebView App](#android-webview-app)
- [Roadmap](#roadmap)
- [Known Issues & Security Notes](#known-issues--security-notes)

---

## Overview

InvertisPrep lets students find previous-year question papers organized by
**department → branch → semester → session → exam type**. Students log in with
Google; papers uploaded by students must be **verified by staff** before they
appear publicly. The platform also includes a resume builder, QCoins wallet,
leaderboard, events, and a content-reporting/moderation workflow.

The backend is split into two independently scalable services:

- **Main Server (API Gateway, :5000)** — auth, users, departments, branches,
  sessions, syllabus, reports, resumes, wallet, bugs, leaderboard, events,
  sponsors, admin user management.
- **PDF Service (:5002)** — PYQ CRUD, PDF uploads, watermarking, view/download
  streaming, Redis-backed PDF cache.

Both services share **MongoDB** (data) and **Redis** (sessions, user cache, PDF
cache, BullMQ job queue) and validate the **same JWT** — the client talks to each
service directly.

---

## Architecture

```
                        ┌──────────────────────────────┐
                        │      CLIENT (Next.js)        │
                        │  invertisprepv2.vercel.app   │
                        └──────┬───────────────┬───────┘
               Bearer JWT      │               │      Bearer JWT
                              ▼               ▼
        ┌──────────────────────────┐   ┌──────────────────────────┐
        │   MAIN SERVER  (:5000)   │   │   PDF SERVICE  (:5002)   │
        │  Auth · Users · Depts    │   │  PYQ CRUD · Uploads      │
        │  Branches · Sessions     │   │  Watermark · View/DL     │
        │  Syllabus · Reports      │   │  Redis PDF cache         │
        │  Resumes · Wallet        │   │  BullMQ watermark jobs   │
        │  Bugs · Leaderboard      │   │  (/api/pyq, /api/pdf)    │
        │  Events · Sponsors       │   └─────┬──────────┬─────────┘
        │  Admin users             │         │          │
        └─────┬────────┬───────────┘         │          │
              │        │                     │          │
              │        │   /api/auth/internal/user/:id   │
              │        └─────────────────────►│ (fallback user lookup,   │
              │           X-Service-Token     │  X-Service-Token guarded) │
              ▼                              ▼          ▼
      ┌──────────────────────────────────────────┐  ┌──────────────┐
      │        MongoDB (shared database)         │  │   Cloudinary │
      │  users · pyqpapers · departments · …     │  │  (raw PDFs)  │
      └──────────────────────────────────────────┘  └──────────────┘
                              ▲
                              │
      ┌───────────────────────┴──────────────────┐
      │              Redis (shared)              │
      │  session:{userId}     refresh tokens     │
      │  user:{userId}        profile cache 5min │
      │  pdf:watermarked:{id} PDF cache 24h      │
      │  BullMQ queue         watermark jobs     │
      └──────────────────────────────────────────┘
```

### Service boundaries

| Service | Port | Responsibilities | Scales independently |
|---|---|---|---|
| **Main Server** | 5000 | Auth (login/refresh/logout), users, departments, branches, sessions, syllabus, reports, resumes, wallet, bugs, leaderboard, events, sponsors, admin | ✅ |
| **PDF Service** | 5002 | PYQ CRUD, PDF upload, generic watermarking, view/download, PDF cache | ✅ |
| **Redis** | 6379 | Session store, user profile cache, watermarked-PDF cache, BullMQ queue | ✅ |
| **MongoDB** | — | Shared database (both services connect to the same cluster) | ✅ |

### Why the split

| Before (monolith) | After |
|---|---|
| User-specific watermarks (email + timestamp) → re-render per user, high CPU | One generic watermark per paper → render once, cache in Redis |
| Client → main server → PDF proxy hop | Client calls the PDF service directly |
| DB lookup on every authenticated request | Redis-cached user profiles (5-min TTL) |
| PDF bytes cached in per-process LRU only | Shared Redis cache by `paperId` (24-h TTL) — survives restarts, shared across instances |

Measured locally: **cold PDF view ~860ms** (Cloudinary fetch + watermark + cache write),
**cached view ~47ms** (≈18× faster).

---

## Tech Stack

### Client (`/client`)
| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19**, **Tailwind CSS v4**, **shadcn/ui** (Radix primitives), `lucide-react` |
| PDF Viewer | **react-pdf v10** (`pdfjs-dist`) — canvas rendering, page nav, zoom |
| Auth | **next-auth v4** (Google OAuth handshake) + app JWT in `localStorage` + httpOnly refresh cookie |
| HTTP | **axios** — two instances (main + PDF service) with shared auth interceptor & auto token-refresh |
| State | React Context (`AuthContext`) |
| Language | **TypeScript** |

### Main Server (`/server`)
| Layer | Technology |
|---|---|
| Runtime | **Node.js** (ESM) |
| Framework | **Express 5** |
| Database | **MongoDB** via **Mongoose 8** |
| Auth | **jsonwebtoken** (15-min access / 7–30-day refresh), **bcryptjs**, **google-auth-library** |
| Cache/Sessions | **Redis** (vendored `src/shared/redisClient.js`) |
| File storage | **Cloudinary** (syllabus PDFs) + **multer** |
| Security | `helmet`, `cors` (prod-aware), tiered `express-rate-limit`, `cookie-parser` |

### PDF Service (`/pdf-service`)
| Layer | Technology |
|---|---|
| Runtime | **Node.js** (ESM) |
| Framework | **Express 5** |
| Database | **MongoDB** (shared cluster; `pyqpapers`, lookup models for populate) |
| PDF processing | **pdf-lib** (generic gradient watermark + branded footer) |
| Cache/Queue | **Redis** (PDF cache via vendored `src/shared/redisClient.js`) + **BullMQ** (watermark jobs) |
| File storage | **Cloudinary** (raw PDF uploads) + **multer** |
| Config | **zod** env schema validation |
| Security | `helmet`, `cors` (prod-aware), tiered `express-rate-limit` |

### Shared Redis client (vendored per service)
`src/shared/redisClient.js` — identical copies in both services (`server/src/shared/`
and `pdf-service/src/shared/`). A single Redis client (reconnect strategy, lazy
connect) with no cross-package dependency, so **each service deploys as a fully
self-contained unit** (Root Directory = `server` / `pdf-service` on Render — no
monorepo tooling needed). If you change one copy, change both.

---

## Monorepo Structure

```
InvertisPrep/
├── client/                      # Next.js frontend
│   ├── app/
│   │   ├── login/               # Google OAuth + admin password + WebView flow
│   │   ├── pyq/                 # /pyq (departments) → /pyq/[departmentId] (slug URLs)
│   │   │   └── upload/          # student uploads
│   │   ├── view/[id]/           # protected PDF viewer (watermarked)
│   │   ├── resources/syllabus/  # syllabus PDFs
│   │   ├── admin/               # dashboard, papers, syllabus, reports, users, …
│   │   ├── profile/[userId]/    # public profiles
│   │   └── wallet/ resumes/ leaderboard/ events/ sponsor/ …
│   ├── components/              # Navbar, PDFViewer, layout/*, ui/* (shadcn)
│   ├── contexts/AuthContext.tsx
│   ├── lib/api.ts               # dual axios clients + auto token refresh
│   └── types/index.ts
│
├── server/                      # Main API service (:5000)
│   └── src/
│       ├── server.js            # bootstrap, CORS, rate-limit tiers, route mounts
│       ├── config/              # database.js, cloudinary.js
│       ├── models/              # User, PYQPaper (→ pyqpapers), Department, Branch,
│       │                        # Session, Report, Syllabus, Resume, Transaction, …
│       ├── controllers/         # auth, users, departments, reports, wallet, …
│       ├── routes/              # auth, departments, pdf (syllabus view), pdfProxy, …
│       ├── services/            # authService (Redis sessions), googleAuthService
│       ├── middleware/          # auth (JWT + roles), upload, rateLimit, errorHandler
│       └── utils/               # cache, points, badges
│
├── pdf-service/                 # PDF/PYQ microservice (:5002)
│   └── src/
│       ├── server.js            # bootstrap + model registration for populate()
│       ├── config/              # database, cloudinary, env (zod-validated)
│       ├── models/              # PDFDocument (→ pyqpapers), User, Department,
│       │                        # Branch, Session (lookup mirrors), WatermarkJob
│       ├── controllers/         # pyqController, pdfController, upload, jobs
│       ├── routes/              # pyq, pdf, upload, jobs, health
│       ├── services/            # pdfProcessor (watermark), cloudinary, queue (BullMQ)
│       ├── middleware/          # auth (Redis cache + main-server fallback), upload, rateLimit
│       └── utils/               # redisCache (PDF cache), filename
│



│
├── start-all.sh                 # boots Redis + main + pdf-service + client together
├── IMPLEMENTATION_PLAN.md       # migration plan & status (all phases ✅)
├── IMPROVED_ARCHITECTURE.md     # architecture design document
└── README.md                    # this file
```

> The Kotlin Android app lives in a **separate repo**. See [Android WebView App](#android-webview-app).

---

## Features

### ✅ Implemented
- **Google OAuth login** for students (auto-creates account) + **email/password** for admins.
- **Short-lived access tokens (15 min) + refresh tokens (7 d / 30 d "remember me")** in an httpOnly cookie, with silent client-side refresh — users stay logged in seamlessly.
- **Role-based access**: `student` | `srt` | `admin` | `super-admin`.
- **PYQ browsing** by department → branch → semester → session → exam type, with search.
- **Slug URLs** — `/pyq/btech`, `/pyq/bca` (ObjectIds still resolve for old links).
- **Admin/staff upload** and **student upload** (verified before public, 10/day IST).
- **Verification workflow** — staff (admin/super-admin/srt) verify student uploads.
- **Generic watermarking** — one big diagonal `INVERTISPREP` gradient stamp + branded footer on every page; rendered once per paper and cached in Redis for 24 h.
- **Syllabus PDFs** browsable by department/year.
- **Protected in-app PDF viewer** (`react-pdf`, canvas rendering — works in Android WebView).
- **Social graph** — follow/unfollow, public profiles with last verified papers.
- **Reporting & moderation**, **view/download analytics**, **soft deletes**.
- **Resume builder** with QCoins wallet (free downloads + top-up packs, transaction log).
- **Leaderboard** (all-time + weekly, department filter), **events**, **sponsors**, **bug reporting**.
- **Admin user management** — role/status updates with Redis cache invalidation.

### 🚧 Coming Soon
- **Quizzo** — quiz platform (`/quizz0` placeholder).

---

## Data Models

Both services read/write the **same MongoDB collections**. The PYQ entity is
`pyqpapers` — the main server's `PYQPaper` model and the PDF service's
`PDFDocument` model both point at it explicitly.

### User (`users`)
`googleId` · `email` (unique) · `password` (select:false) · `name` · `picture` ·
`studentId` · `phoneNumber` · `course` · `followers[]` · `following[]` · `role`
(`student|srt|admin|super-admin`) · `lastLogin` · `isActive` · `qcoins` ·
`freeDownloadsLeft` · `points` · `weeklyPoints`

### PYQ paper (`pyqpapers`)
`title` (auto: `subjectName examType year`) · `subjectCode` · `subjectName` ·
`departmentId` · `branchId` · `semester` (1–10) · `sessionId` · `examType`
(`mid-term|end-term`) · `cloudinaryUrl` · `cloudinaryPublicId` · `fileName` ·
`fileSize` · `year` · `uploadedBy` · `views` · `downloads` · `verified` · `isActive`

> `cloudinaryUrl` is excluded from public listing responses. PDFs are served only
> through the authenticated, watermarked view/download endpoints.

### Department (`departments`)
`id` (unique slug, e.g. `btech`) · `name` · `displayName` · `icon` · `description` · `isActive`
— public endpoints resolve **ObjectId or slug**.

### Branch (`branches`) / Session (`sessions`)
Branch: `id` (slug) · `name` · `departmentId` · `semsters[]` · `isActive`.
Session (academic): `id` · `name` · `startYear` · `endYear` · `isActive`.

### Others
`reports` (paperId + reportedBy unique) · `syllabuses` · `resumes` ·
`transactions` · `pointslogs` · `bugs` · `events` · `sponsors` · `watermarkjobs`

---

## API Reference

Auth legend: 🔓 public · 🔑 JWT required · 🎫 staff (admin/super-admin/srt) · 👑 admin · 👑👑 super-admin.

### Main Server — `http://…:5000/api`

#### Auth — `/api/auth` (rate-limited, brute-force protected)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | 🔓 | Email/password → access token + user + sets refresh cookie |
| POST | `/auth/google-login` | 🔓 | Verify Google ID token, upsert student → tokens |
| POST | `/auth/refresh` | 🔓 (cookie) | Rotate access token via httpOnly refresh cookie |
| POST | `/auth/logout` | 🔓 | Revoke Redis session + clear cookie |
| GET | `/auth/me` | 🔑 | Current user |
| PUT | `/auth/profile` | 🔑 | Update profile |
| GET | `/auth/internal/user/:userId` | 🔧 | Service-to-service only — `X-Service-Token` (timing-safe compare) |

#### Other resources
| Resource | Notes |
|---|---|
| `/api/departments` | list 🔓 · `/:id` by **ObjectId or slug** 🔓 · CRUD 👑 |
| `/api/departments/:id/branches` | branches by ObjectId **or slug** 🔓 |
| `/api/branches`, `/api/sessions` | CRUD 👑 |
| `/api/syllabus` | list 🔓 · upload 🎫 · delete 👑 |
| `/api/pdf/view/:id?type=syllabus` | watermarked syllabus 🔑 (syllabus stays on main server) |
| `/api/users/:id`, follow/unfollow | 🔑 |
| `/api/reports` | create 🔑 · triage 👑 |
| `/api/resumes`, `/api/wallet` | 🔑 (QCoins, packs, transactions) |
| `/api/leaderboard` | 🔓 rankings + 🔑 my-stats |
| `/api/events`, `/api/sponsors`, `/api/bugs` | site content + bug reporting |
| `/api/admin/users` | list/stats/role/status 👑 (invalidates Redis user cache) |
| `/health` | 🔓 liveness |

### PDF Service — `http://…:5002/api`

#### PYQ — `/api/pyq`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/pyq` | 🔓 | Public list (`verified:true, isActive:true`) with filters (operator-injection-safe) |
| GET | `/pyq/upload-count` | 🔑 | Today's upload count vs 10/day IST |
| POST | `/pyq/upload` | 🎫 | Staff upload |
| POST | `/pyq/upload-public` | 🔑 | Student upload |
| GET | `/pyq/all` | 🎫 | Paginated staff list |
| POST | `/pyq/:id/view`, `/pyq/:id/download` | 🔑 | Counters |
| PATCH | `/pyq/:id/verify` | 🎫 | Verify paper |
| PUT / DELETE | `/pyq/:id` | 👑 | Update metadata / soft-delete + Cloudinary cleanup |

#### PDF — `/api/pdf` (pdfLimiter + JWT)
| Method | Path | Description |
|---|---|---|
| GET | `/pdf/view/:id?type=pyq` | Inline watermarked PDF (Redis-cached) |
| GET | `/pdf/download/:id?type=pyq` | Attachment with branded RFC-5987 filename |

Also: `/api/upload` (BullMQ job-based uploads), `/api/jobs/:id` (job status),
`/api/health` (DB + queue + memory status).

---

## Authentication

### Token model
| Token | Lifetime | Storage |
|---|---|---|
| Access token (JWT, `{id, email, role}`) | **15 minutes** | `localStorage` → `Authorization: Bearer` |
| Refresh token (JWT, `type:refresh`) | **7 days** (30 with "remember me") | httpOnly `refreshToken` cookie + Redis session hash |

### Flows
- **Login (Google or password)** → `authService.login()` signs both tokens, stores
  `session:{userId}` in Redis (refresh token + UA + IP), caches `user:{userId}` (5-min TTL).
- **Every authenticated request** → JWT verified → user loaded from the **Redis cache**
  (zero DB queries in steady state; DB fallback repopulates the cache).
- **Token expiry** → client interceptor catches the 401, calls `/auth/refresh` **once**
  (shared promise — concurrent 401s queue), stores the new access token, and retries
  the original request. Users never see a re-login until the refresh cookie itself expires.
- **Logout** → Redis session + user cache deleted; cookie cleared.
- **Role/status change (admin)** → `User` post-save hook invalidates `user:{id}` so
  revoked roles take effect within seconds.

### Cross-service validation
The PDF service verifies the **same JWT** (shared `JWT_SECRET`), checks the shared
Redis user cache first, and falls back to the main server's internal endpoint
(`/api/auth/internal/user/:id`) guarded by `INTERNAL_SERVICE_TOKEN`
(timing-safe comparison) — caching the result back into Redis.

### Role guards (both services)
`authenticateJWT` → `isStaff` (admin/super-admin/srt — upload & verify) →
`isAdmin` (admin/super-admin — edit & delete) → `isSuperAdmin`.

### Super-admin bootstrap
The super admin (`superadmin@invertis.edu.in`) is provisioned directly in the
database. There is no seeding script in the repo — create or update the account
itself (set the bcrypt hash on the `User` document, `role: 'super-admin'`).

---

## Caching Strategy (Redis)

| Key pattern | TTL | Purpose |
|---|---|---|
| `session:{userId}` | 7–30 d (matches refresh token) | Refresh-token validation, UA/IP metadata |
| `user:{userId}` | 5 min | Auth middleware user profile — zero DB auth queries |
| `pdf:watermarked:{paperId}` | 24 h | Rendered watermarked PDF (base64) — shared across users/instances |
| BullMQ streams | — | Async watermark job queue |

- Fail-open design: if Redis is unavailable, auth falls back to DB and PDFs
  regenerate — the site degrades gracefully instead of erroring.
- Vendored Redis client in each service's `src/shared/redisClient.js` (reconnect strategy, lazy connect).
- PDF cache is keyed by **paper id only** (watermarks are generic), which is what
  makes the 24-h shared cache possible.

---

## PDF Pipeline / Cloudinary Storage

Papers live in **Cloudinary** as `raw` resources and are never served directly.

```
Client ── GET /api/pdf/view/:id (Bearer JWT) ──► PDF Service
   1. authenticateJWT (Redis-cached user)
   2. lookup paper (pyqpapers) — invalid ids → clean 404
   3. Redis: pdf:watermarked:{id} ── hit ──► stream (≈47ms)
   4. miss ──► Cloudinary fetch ──► pdf-lib watermark ──► cache ──► stream (≈860ms)
```

### Watermark (generic, cache-friendly)
- **One big diagonal `INVERTISPREP`** per page — 68pt, −35°, 12% opacity,
  per-character indigo→purple→pink gradient.
- **Branded footer** — "PYQs available for free on www.invertisprep.in" (centered).
- **No user email/timestamp** — the output is identical for every viewer, so one
  render per paper serves everyone (that's what makes the shared cache valid).

### Upload flow
Multer (PDF-only, size-capped) → temp file → Cloudinary `resource_type: 'raw'` →
metadata stored in `pyqpapers` → temp file deleted. Staff uploads land directly;
student uploads require verification.

### Syllabus vs PYQ routing (client)
`pdfApi.view/download(id, type)` routes **`type=pyq` → PDF service (:5002)** and
**`type=syllabus` → main server (:5000)**, which owns the `syllabuses` collection.

### Key files
| File | Purpose |
|---|---|
| `pdf-service/src/services/pdfProcessor.js` | Generic watermark + footer + Redis cache integration |
| `pdf-service/src/utils/redisCache.js` | `pdf:watermarked:*` get/set/invalidate/clear |
| `pdf-service/src/controllers/pdfController.js` | view/download handlers (ObjectId-validated) |
| `pdf-service/src/controllers/pyqController.js` | Full PYQ CRUD + verification |
| `server/src/services/authService.js` | Tokens, Redis sessions, cache, refresh, revoke |
| `client/lib/api.ts` | Dual axios clients, auto-refresh interceptor, syllabus/pyq routing |
| `client/components/PDFViewer.tsx` | Canvas PDF viewer (react-pdf) |

---

## Security

| Control | Status |
|---|---|
| Helmet security headers (both services) | ✅ |
| Tiered rate limiting (API / auth brute-force / read / write / upload / PDF) | ✅ |
| NoSQL operator-injection guards (login + PYQ filters coerce params to strings) | ✅ |
| Timing-safe service-token comparison | ✅ |
| CORS: localhost origins dev-only; prod allow-list + `CORS_ORIGINS` | ✅ |
| httpOnly + SameSite=Lax + Secure-in-prod refresh cookie | ✅ |
| Redis-backed session revocation (logout/deactivation effective immediately) | ✅ |
| Zod env validation (pdf-service) | ✅ |
| Secrets gitignored; `.env` untracked; `.env.example` placeholders only | ✅ |
| Upload validation (PDF mime + size cap) | ✅ |

> ⚠️ **If this repo's history contains real secrets, rotate them** (MongoDB,
> Cloudinary, Google OAuth, `JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`). Removing a
> file from git does not purge history. Generate secrets with `openssl rand -hex 32`.

---

## Environment Variables

### Main Server (`server/.env`)
| Key | Purpose |
|---|---|
| `PORT` | 5000 |
| `NODE_ENV` | `production` disables dev error details, enables secure cookies + prod CORS |
| `MONGODB_URI` | Shared MongoDB connection string |
| `REDIS_URL` | e.g. `redis://localhost:6379` |
| `JWT_SECRET` | Shared with pdf-service (32+ random bytes) |
| `INTERNAL_SERVICE_TOKEN` | Shared with pdf-service — guards the internal user endpoint |
| `CLOUDINARY_*` | Syllabus uploads |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login verification |
| `CORS_ORIGINS` | Extra allowed origins (comma-separated) |
| `TRUST_PROXY`, `BODY_LIMIT`, `*_RATE_LIMIT_*`, `MAX_PDF_SIZE_MB` | Tuning knobs |

### PDF Service (`pdf-service/.env`)
Same shared keys (`MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`,
`INTERNAL_SERVICE_TOKEN`) plus `PORT=5002`, `CLOUDINARY_*`,
`MAIN_SERVER_URL` (internal fallback), `PDF_CACHE_MAX_MB`
and rate-limit knobs. Validated by zod at boot (`src/config/env.js`).
The BullMQ queue auto-disables (synchronous fallback) if `REDIS_URL` is unset.

### Client (`client/.env`)
| Key | Purpose |
|---|---|
| `API_URL` | Main server base — **server-only**, used by the Next.js rewrite (never in the browser bundle) |
| `PDF_API_URL` | PDF service base — server-only, same |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth (Google handshake only) |

> 🔒 **No `NEXT_PUBLIC_*` URL variables.** The browser calls same-origin
> `/backend/*` and `/pdfapi/*`; `next.config.ts` rewrites proxy them to the
> real backends using server-only env vars. Backend URLs never appear in the
> browser bundle, CORS becomes a non-issue, and the refresh cookie is
> first-party (no cross-site cookie problems).
>
> Never commit real secrets. `.env` files are gitignored; `.env.example`
> files carry placeholders only.

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (`brew install redis && redis-server --daemonize yes`)
- Google OAuth client ID/secret

### Option A — everything at once
```bash
./start-all.sh        # Redis + main server + pdf service + client
```

### Option B — individually
```bash
# shared package (its own node_modules — required for file: symlinks)
cd shared && npm install

# main server
cd ../server && cp .env.example .env   # fill values
npm install && npm run dev                      # :5000

# pdf service
cd ../pdf-service && cp .env.example .env       # fill values
npm install && npm run dev                      # :5002

# client
cd ../client && npm install && npm run dev      # :3000
```

> `pdf-service/.npmrc` sets `legacy-peer-deps=true` — BullMQ declares an optional
> `redis@>=5` peer while the shared cache pins `redis@4`.

---

## Testing & Validation Scripts

| Script | What it verifies |
|---|---|
| `server/test-auth-service.mjs` | login → Redis session → cache-validate → refresh → meta → revoke → revoked-token rejection → inactive-user rejection (8 checks) |
| `server/test-cross-service.mjs` | main-server JWT accepted by pdf-service, internal endpoint w/ service token, Redis user cache, invalid-token rejection (4 checks) |
| `server/test-google-flow.mjs` | googleLogin DB flow (find/create/save/login/formatUser) |
| `server/test-pdf-view.mjs` | cold vs cached PDF view timing, Redis cache write, download filename |

---

## npm Scripts

| Location | Script | Command |
|---|---|---|
| client | `dev` / `build` / `start` / `lint` | `next dev` / `next build` / `next start` / `eslint` |
| server | `dev` / `start` | `node --watch src/server.js` / `node src/server.js` |
| pdf-service | `dev` / `start` | `node --watch src/server.js` / `node src/server.js` |

---

## Deployment

- **Client** → **Vercel** (`invertisprepv2.vercel.app`). Set `API_URL` and
  `PDF_API_URL` (server-only, **without** `NEXT_PUBLIC_` prefix) plus the
  NextAuth vars — the rewrites are evaluated at build time, so a redeploy is
  required after changing them.
- **Main server** → long-running host (**Render/Railway/VPS**): `npm start`,
  with all env vars above; `NODE_ENV=production`, `TRUST_PROXY=1` behind a proxy.
- **PDF service** → separate Render service: `npm start`, shared
  `MONGODB_URI`/`REDIS_URL`/`JWT_SECRET`/`INTERNAL_SERVICE_TOKEN`, Cloudinary keys,
  `MAIN_SERVER_URL` pointing at the main server's public URL.
- **Redis** → Render Redis / Upstash; both services need the same `REDIS_URL`.
- Deployment order: Redis → main server → pdf-service → client → smoke tests
  (health endpoints, login, PYQ list, PDF view).

---

## Android WebView App

A separate **Kotlin** project wraps the webapp in a native `WebView`; Google login
is bridged via a Chrome Custom Tab and a deep link (`invertisprep://auth/callback`)
that injects the app JWT into the WebView's `localStorage`. On 401 the webapp's
auto-refresh flow keeps the session alive using the refresh cookie.

---

## Roadmap

- [x] Microservice split (main + pdf-service) with shared Redis/Mongo — ✅ done
- [x] Redis sessions + auto token refresh — ✅ done
- [x] Generic watermark + 24-h shared PDF cache — ✅ done (47ms cached views)
- [x] Slug-based department URLs — ✅ done
- [ ] Quizzo quiz engine
- [ ] Redis-backed distributed rate limiting (currently in-memory per instance)
- [ ] Load testing (300 users/hour) & auto-scaling
- [ ] Transactional email (verification, reports)

---

## Known Issues & Security Notes

- 🟠 **Rotate any secrets that ever touched git history** (see [Security](#security)).
- 🟡 Watermarked PDF bytes are still inspectable via DevTools — the watermark deters sharing, doesn't prevent it.
- 🟡 Rate limiting is in-memory (per instance); use a Redis store before horizontal scaling.
- 🟡 Points awarded on PYQ verification are logged in the pdf-service but not synced to the main server's points system yet (webhook TODO).
- 🟡 `server/node_modules` is partially tracked from an old commit — `git rm -r --cached server/node_modules` recommended.

---

*Made with ❤️ by Ahqaf and Team — Invertis University*
