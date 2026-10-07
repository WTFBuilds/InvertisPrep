# Fix Plan — Canonical-Domain Authentication & ATS Feature

> Status: **IMPLEMENTED** (this document reflects the changes that were made).
> Deployment: pushed to the production branch; Vercel deployment follows.

---

## 1. Problem Summary

A user who started on the SEO domain (`https://invertisprep.vercel.app`) and clicked
**"Continue with Google"** did not authenticate. The browser ended up on:

```
https://invertisprep.in/login?callbackUrl=https%3A%2F%2Finvertisprep.in&error=OAuthCallback
```

with the login page shown again and **no visible error message**. Clicking
**"Continue with Google"** a second time (now on `.in`) succeeded on the first
attempt. Users starting directly on `https://invertisprep.in/login` never saw the
problem.

---

## 2. Root Cause (confirmed at code level, next-auth 4.24.14)

The Google provider is configured with `checks: ["pkce", "state"]`
(`node_modules/next-auth/src/providers/google.ts`). During
`POST /api/auth/signin/google`, NextAuth:

1. Resolves the OAuth origin via `detectOrigin()`
   (`next-auth/utils/detect-origin.js`):
   ```js
   if (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST)
     return `${protocol}://${x-forwarded-host}`;
   return process.env.NEXTAUTH_URL;
   ```
2. Sets `next-auth.state`, `next-auth.pkce.code_verifier` and
   `next-auth.nonce` cookies — **host-scoped** (no `Domain` attribute) on
   whichever host served the POST.
3. Builds `redirect_uri = <resolved-origin>/api/auth/callback/google`
   (`core/lib/providers.js` → `provider.callbackUrl`).

A flow started on `.vercel.app` therefore set its state/PKCE cookies on
**invertisprep.vercel.app**, while the OAuth round-trip terminated on
**invertisprep.in** (the redirect_uri host). Google returned the browser to
`.in` **without** the state cookies, so `checks.state.use` threw
`"State cookie was missing."` → wrapped as `OAuthCallbackError`.

NextAuth then ran its built-in error-redirect chain, which produces **exactly**
the observed URL:

1. `/api/auth/callback/google` → `OAuthCallbackError` → `/api/auth/error?error=OAuthCallback`
2. `/api/auth/error` (known error) → `/api/auth/signin?error=OAuthCallback`
3. GET `/api/auth/signin` + custom `pages.signIn: '/login'`
   (`core/index.js` line 168) → `/login?callbackUrl=<origin>&error=OAuthCallback`,
   with `callbackUrl` falling back to the resolved origin
   (`core/lib/callback-url.js`) = `https://invertisprep.in` (from
   `NEXTAUTH_URL=https://invertisprep.in`).

The **second click succeeded** because the browser was already on `.in`, so the
state cookie host, the redirect_uri host and the callback host all matched.

Contributing factor: the login page never displayed NextAuth's `?error=` query
param, so users saw a silently re-rendered login form instead of an explanation.

---

## 3. Architecture Before / After

### Before
- `.vercel.app` and `.in` both hosted the login page and could both *start* an
  OAuth flow. The flow was only guaranteed to succeed when the starting host
  matched the origin NextAuth resolved server-side.
- The real application session (backend JWT in `localStorage` + httpOnly refresh
  cookie via the `/backend` rewrite proxy) ended up on whichever host completed
  the flow — there was no canonical authenticated origin.
- `returnUrl` deep-linking existed in only some entry points and was not
  preserved through the Google flow (`callbackUrl` was hardcoded to `/login`).

### After (implemented)
```
invertisprep.vercel.app / www.invertisprep.in      invertisprep.in
        │  public SEO pages stay here                     │
        │                                                 │
        │  /login or /auth/signin requested               │
        ▼                                                 │
   middleware 307 ───────────────────────────────────────▶│  (transition BEFORE OAuth)
                                                          ▼
                                              user clicks Continue with Google
                                                          │
                                              auto=google → signIn immediately
                                                          ▼
                                              Google consent (redirect_uri = .in)
                                                          ▼
                                              /api/auth/callback/google  ✓ same host
                                                          ▼
                                              idToken → /backend/auth/google-login
                                              → app JWT + refresh cookie ON .in
                                                          ▼
                                              router.push(returnUrl or /pyq)
```

Key principle: **stateful OAuth always starts and ends on the canonical domain.**
Public/SEO pages are never redirected, so the `.vercel.app` discovery traffic is
untouched.

---

## 4. What Was Changed

| # | File | Change |
|---|------|--------|
| 1 | `client/lib/canonical.ts` **(new)** | Canonical-domain helpers: host allow/transition sets (`invertisprep.in` canonical; `invertisprep.vercel.app` + `www.invertisprep.in` transition hosts), `x-forwarded-host` parsing, whitelisted login-param propagation (`returnUrl, webview, mobile, role, mode`), `isSafeReturnPath()` open-redirect guard, canonical URL builders, `buildLoginHref()` |
| 2 | `client/middleware.ts` **(new)** | Auth boundary: requests to `/login` and `/auth/signin` from transition hosts are 307-redirected to the same path on `https://invertisprep.in`, preserving whitelisted params. Public routes and `/api/auth/*` are not matched. Canonical/localhost/preview hosts pass through |
| 3 | `client/app/login/page.tsx` | Google click hands off to the canonical domain with `auto=google` when on a transition host (one-click total); auto-continue fires on `.in` after the session probe finds no session (guarded by `error` param → no loop); `callbackUrl` now carries `webview`/`mobile`/`returnUrl` context instead of a bare `/login`; NextAuth `?error=` codes are surfaced as friendly messages; `returnUrl` validated via `isSafeReturnPath()` (blocks `//evil.com`, absolute URLs); email sign-in and registration honor `returnUrl` |
| 4 | `client/contexts/AuthContext.tsx` | `login()` accepts optional `{ redirectTo }` (validated in-app relative path) so email/team logins preserve the deep-link destination; role-based defaults unchanged |
| 5 | `client/components/Navbar.tsx` | Desktop + mobile **Sign In** links carry the current location as `returnUrl` (skipped when already on a login route). Also removed the duplicate "ATS Score Checker (soon)" navbar entry |
| 6 | `client/components/resume-builder/SavePromptModal.tsx` | Google sign-in hands off to the canonical domain (preserving the `/resume-builder` destination + `auto=google`) before starting OAuth |
| 7 | `client/lib/api.ts` | `forceLogout()` preserves the current location as `returnUrl` (validated) so session-expiry re-auth returns the user to the page they were on |
| 8 | `client/app/ats-score/page.tsx` | Full rebuild of the ATS Score Checker page on the platform light slate/indigo theme using shadcn/ui (Card, Button, Badge, Tabs, Textarea, Progress, Alert, Collapsible, Separator); fully responsive; print/export-PDF support retained and adapted to light colors; all functionality preserved (domains, experience levels, custom JD, PDF/TXT upload, paste, samples, stepped loader, scorecard, bullet fixes, roadmap) |
| 9 | `client/app/api/ats/route.ts` | AI keys are now **server-only**: reads `GEMINI_API_KEY` / `OPENROUTER_API_KEY`, removed insecure `NEXT_PUBLIC_*` fallbacks; clearer configuration error; grade colors aligned to the light theme |
| 10 | `client/.env.example` | Documented `GEMINI_API_KEY` (required) and `OPENROUTER_API_KEY` (optional fallback) with "never NEXT_PUBLIC_" warning |

No changes to: NextAuth version, provider config, session/JWT config, backend
services, rewrites, SEO metadata/canonicals, sitemap, or any public page.

---

## 5. Why This Architecture

- **Fixes the confirmed root cause, not a symptom.** The bug is host-scoped
  OAuth state loss; moving the *start* of the flow onto the canonical host makes
  the state cookie host, the redirect_uri host and the callback host always
  identical — regardless of which `detectOrigin()` branch runs in production
  (this also makes the fix robust to the `VERCEL` env-var ambiguity).
- **Compatible with next-auth v4.24 as installed** — no upgrade, no provider
  changes, no disabled security checks (state + PKCE remain fully enforced).
- **Preserves SEO.** Only `/login` and `/auth/signin` are redirected; no global
  `.vercel.app → .in` redirect; canonicals/sitemap untouched. The SEO migration
  remains a separate future task.
- **Payments-ready.** The backend JWT, refresh cookie and `localStorage` state
  now land on `invertisprep.in`, so all future authenticated/payment surfaces
  have one coherent origin.
- **Loop-proof by construction.** The redirect target host is in the canonical
  set, which never transitions; `auto=google` is never re-emitted by error
  redirects and is guarded by the absence of an `error` param.

---

## 6. Authentication Flow Before / After

| Scenario | Before | After |
|---|---|---|
| `.in/login` → Google | ✓ works | ✓ works (unchanged) |
| `.vercel.app/login` → Google | ✗ `OAuthCallback` error, second click needed, lands on `.in/login` with no explanation | 307 → `.in/login`, Google runs once on `.in`, authenticated on `.in` |
| Deep link (`/pyq/...` → Sign In → login) | destination lost (default `/pyq`) | destination preserved via validated `returnUrl` |
| Email login / team login | worked, destination always `/` | works, honors `returnUrl` |
| Native WebView flow (`webview=1`, `/auth/signin`) | same first-attempt bug when webview opened `.vercel.app` | transition preserves `webview` param; deep link `invertisprep://auth/callback` still consumed on `.in` |
| Session expiry (`forceLogout`) | lost location | returns to the same page after re-login |
| Logout | unchanged (`signOut` + localStorage clear) | unchanged |

---

## 7. Security Considerations

- **No open redirects:** every `returnUrl` passes `isSafeReturnPath()` (must be
  relative, must not start with `//` or `/\`); canonical bounce targets are
  hardcoded to `https://invertisprep.in`; NextAuth's own same-origin
  `callbackUrl` validation still applies.
- **No security checks disabled:** OAuth `state` + PKCE + nonce verification
  remain enabled; CSRF token flow untouched.
- **No secrets exposed:** AI keys moved to server-only env vars;
  `NEXT_PUBLIC_*` key fallbacks removed; no key values committed.
- **Param injection:** only a fixed whitelist of login params is carried across
  the domain transition; everything else is dropped.
- **HTTPS preserved:** canonical transitions target `https://` explicitly.
- **Cookie hygiene:** nothing changed about cookie flags; the fix removes the
  cross-host situation that made the state cookie unusable.

---

## 8. Testing Performed

- `tsc --noEmit` — clean (0 errors) after clearing a stale `.next` cache.
- `next build` (production) — succeeded; middleware registered as
  `ƒ Proxy (Middleware)`; all routes compile.
- Server-level redirect checks (production server, spoofed hosts):
  - `/login` + `x-forwarded-host: invertisprep.vercel.app` → `307` →
    `https://invertisprep.in/login` with whitelisted params preserved.
  - `/auth/signin` from the SEO host → `307` → `.in/auth/signin`.
  - `www.invertisprep.in/login` → `307` → apex `.in`.
  - `/login` from `.in` and from `localhost` → `200` (no redirect, no loop).
  - `/pyq`, `/ats-score` from the SEO host → `200` (public pages untouched).
  - `/login?returnUrl=%2F%2Fevil.com` → `returnUrl` dropped from the bounce.
- Deferred to post-deploy (require real Google OAuth + both live domains):
  Tests 1–10 from the acceptance list (one-click Google from both domains,
  email/team login, logout, protected routes, WebView deep link). The live
  `GEMINI_API_KEY` must be added in Vercel for the ATS analyser to run.

---

## 9. Remaining Limitations / Follow-up Work

1. **Set `GEMINI_API_KEY` (and optionally `OPENROUTER_API_KEY`) in the Vercel
   project environment** — the ATS analyser returns a clear configuration error
   until then. Google Console OAuth setup is unchanged (both callback URLs may
   stay registered during the transition; the `.vercel.app` callback simply
   stops being used by new flows).
2. **Existing sessions on `.vercel.app` don't migrate** — cookies/localStorage
   are origin-scoped. Users authenticated on `.vercel.app` simply log in once
   on `.in` (expected per the architecture).
3. **Guest resume drafts saved on `.vercel.app`** can't cross the domain
   handoff (localStorage is per-origin). The destination (`/resume-builder`)
   is preserved; the draft itself only survives when the whole flow stays on
   `.in`. On `.in` the guest-draft flow works end-to-end.
4. **Guard redirects in `wallet`, `profile`, `leaderboard`, `resumes`,
   `pyq/upload`, `pyq/[departmentId]`** still push to a bare `/login` (no
   `returnUrl`). They work correctly through the middleware boundary; adding
   `returnUrl` there is a mechanical follow-up.
5. **Vercel preview deployments** are intentionally excluded from the transition
   set so they keep working as isolated environments.
6. **`AUTH_TRUST_HOST=true`** (optional, Vercel env) would make next-auth trust
   `x-forwarded-host` on preview deployments too; not required for production.
7. **SEO migration** (global `.vercel.app → .in` canonicalization, canonical
   tag updates) is deliberately out of scope, per the product plan.
