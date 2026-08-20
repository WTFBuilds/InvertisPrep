# Implementation Plan: Improved Backend Architecture

## Overview
This plan implements the architecture from `IMPROVED_ARCHITECTURE.md` with specific code changes, file modifications, and validation steps.

---

## Phase 1: PDF Service - Generic Watermark + Redis Caching ✅ COMPLETED

### 1.1 Update PDF Processor (Remove User-Specific Watermark) ✅ DONE
**File**: `pdf-service/src/services/pdfProcessor.js`

- [x] Remove `user` parameter from `buildWatermarkedPdf()`
- [x] Remove `getUserEmail()`, `formatDateTime()`, footer drawing code
- [x] Keep only diagonal "INVERTISPREP" gradient watermark
- [x] Update cache key to use only `paper._id` (not `user.id`)

### 1.2 Create Redis Cache Service ✅ DONE
**File**: `pdf-service/src/utils/redisCache.js` (NEW)

- [x] Import `getRedis` from `@invertisprep/shared`
- [x] Implement `get(paperId)` - returns Buffer or null
- [x] Implement `set(paperId, pdfBytes)` - stores base64 in Redis with 24h TTL
- [x] Implement `invalidate(paperId)` - deletes key
- [x] Implement `clear()` - deletes all PDF cache keys

### 1.3 Update PDF Controller ✅ DONE
**File**: `pdf-service/src/controllers/pdfController.js`

- [x] Import `pdfRedisCache` from utils/redisCache.js
- [x] Remove `req.user` from `buildWatermarkedPdf()` call
- [x] Use Redis cache (check → generate → store → serve)

### 1.4 Update PDF Service Dependencies ✅ DONE
**File**: `pdf-service/package.json`

- [x] Added: `redis` package
- [x] Added: `@invertisprep/shared` package reference

### 1.5 Environment Variables ✅ DONE (local dev)
**File**: `pdf-service/.env`

- [x] `REDIS_URL=redis://localhost:6379`
- [x] `JWT_SECRET=shared-with-main-server`
- [x] `CLOUDINARY_*` credentials
- [ ] Production: configure same vars on Render

---

## Phase 2: Auth Service - Redis Session Management ✅ COMPLETED

### 2.1 Create Shared Redis Client ✅ DONE
**File**: `shared/redisClient.js` (NEW)

- [x] Create Redis client with reconnect strategy
- [x] Export `getRedis()` function
- [x] Handle connection events (error, connect, ready, reconnecting, end)

### 2.2 Create Shared Package ✅ DONE
**File**: `shared/package.json`

- [x] Name: `@invertisprep/shared`
- [x] Main: `redisClient.js`
- [x] Dependencies: `redis@^4.6.0`

### 2.3 Create Auth Service ✅ DONE
**File**: `server/src/services/authService.js` (NEW)

- [x] `login(user, rememberMe)` - generates access+refresh tokens, stores session in Redis
- [x] `validateAccessToken(token)` - verifies JWT, checks Redis cache, falls back to DB
- [x] `cacheUser(user)` - caches user profile in Redis (5 min TTL)
- [x] `invalidateUserCache(userId)` - deletes user cache
- [x] `revokeSession(userId)` - deletes session and cache
- [x] `refreshAccessToken(refreshToken)` - validates refresh token against Redis
- [x] `updateSessionMeta(userId, userAgent, ip)` - updates session metadata

### 2.4 Refactor Auth Middleware ✅ DONE
**File**: `server/src/middleware/auth.js`

- [x] Import `authService`
- [x] Replace DB lookup with `authService.validateAccessToken(token)`
- [x] Remove `User` import and `.findById()` call
- [x] Keep role check middlewares (`isAdmin`, `isStaff`, `isSuperAdmin`) unchanged

### 2.5 Update Auth Controller ✅ DONE
**File**: `server/src/controllers/authController.js`

- [x] Import `authService`
- [x] Update `login` to use `authService.login()` and set refresh token cookie
- [x] Update `googleLogin` to use `authService.login()` and set refresh token cookie
- [x] Add `refresh` endpoint
- [x] Update `logout` to revoke session and clear cookie
- [x] Remove JWT generation from controller (now in authService)

### 2.6 Update User Model Hooks ✅ DONE
**File**: `server/src/models/User.js`

- [x] Add post-save hook to invalidate cache on role/status change (verified by test #7 in `server/test-auth-service.mjs`)

### 2.7 Add Auth Routes ✅ DONE
**File**: `server/src/routes/auth.js`

- [x] `/logout` endpoint exists
- [x] `/me` endpoint exists
- [x] Add `/refresh` endpoint (verified: returns 401 "Refresh token required" without token)

### 2.8 Environment Variables ✅ DONE (local dev)
**File**: `server/.env`

- [x] `REDIS_URL=redis://localhost:6379`
- [x] `JWT_SECRET=shared-with-pdf-service`
- [x] `MONGODB_URI=...`
- [ ] Production: configure same vars on Render

---

## Phase 3: Migrate PYQ Routes to PDF Service ✅ COMPLETED

### 3.1 Copy PYQ Controller ✅ DONE
**File**: `pdf-service/src/controllers/pyqController.js` (NEW)

- [x] Copy from `server/src/controllers/pyqController.js`
- [x] Replace `PYQPaper` with `PDFDocument` model
- [x] Remove `enqueueWatermarkJob` calls (now direct PDF view)
- [x] Simplify `awardPoints` to console.log (or call main server via webhook)
- [x] Keep all business logic identical

### 3.2 Copy PYQ Routes ✅ DONE
**File**: `pdf-service/src/routes/pyq.js` (NEW)

- [x] Copy from `server/src/routes/pyq.js`
- [x] Import controllers from pdf-service
- [x] Import middleware from pdf-service
- [x] Remove `isSuperAdmin` import (not used)

### 3.3 Copy Required Middleware ✅ DONE
**Files to ensure exist in pdf-service/src/middleware/**:
- [x] `auth.js` - Redis-cache JWT validation + main-server fallback
- [x] `upload.js` - exists
- [x] `rateLimit.js` - exists
- [x] `validation.js` - exists

### 3.4 Register Routes in PDF Service Server ✅ DONE
**File**: `pdf-service/src/server.js`

- [x] Import `pyqRoutes` from './routes/pyq.js'
- [x] Add `app.use('/api/pyq', readLimiter, pyqRoutes);`

### 3.5 Verify PYQ Model ✅ DONE
**File**: `pdf-service/src/models/PDFDocument.js`

- [x] Model exists with all required fields (matches server's PYQPaper schema)

---

## Phase 4: Remove PYQ from Main Server ✅ COMPLETED

### 4.1 Remove PYQ Routes Registration
**File**: `server/src/server.js`

- [x] Remove `import pyqRoutes from './routes/pyq.js';`
- [x] Remove `app.use('/api/pyq', pyqRoutes);`

### 4.2 Remove PYQ Controller Import
- [x] Check if `pyqController` is used in other routes - remove if not

### 4.3 Keep PDF Proxy Routes
**File**: `server/src/routes/pdfProxy.js` - Keep for non-PYQ PDFs

---

## Phase 5: Update Client API for Direct PDF Service Calls ✅ COMPLETED

### 5.1 Update API Configuration ✅ DONE
**File**: `client/lib/api.ts`

- [x] Define `API_URL` and `PDF_SERVICE_URL` constants (env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PDF_API_URL`)
- [x] Create `pyqApi` object with all PYQ endpoints pointing to PDF service
- [x] Create `authApi` object with all auth endpoints pointing to main server
- [x] Auth token interceptor + 401 handler wired on both axios instances
- [x] `pdfApi.view/download` routes syllabus → main server, pyq → PDF service

### 5.2 Update Environment Variables ✅ DONE (local dev)
**File**: `client/.env`

- [x] `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- [x] `NEXT_PUBLIC_PDF_API_URL=http://localhost:5002/api`
- [ ] Production: point both at Render URLs when deployed

### 5.3 Update Components Using PYQ API ✅ DONE
- [x] Verified all PYQ consumers (`app/pyq/*`, `app/admin/papers|upload|reports`, `components/PDFViewer`) use `pyqApi`

---

## Phase 6: Shared Redis Client + Environment Config ✅ COMPLETED

### 6.1 Create Shared Package Structure ✅ DONE
```
shared/
├── package.json
├── redisClient.js
└── index.js
```

### 6.2 Shared Package.json ✅ DONE
**File**: `shared/package.json`

- [x] Name: `@invertisprep/shared`
- [x] Version: `1.0.0`
- [x] Type: `module`
- [x] Main: `redisClient.js`
- [x] Dependencies: `redis@^4.6.0`

### 6.3 Update Service Package.jsons ✅ DONE
- [x] PDF Service: Added `@invertisprep/shared` (`file:../shared`) and `redis`
- [x] Main Server: Added `@invertisprep/shared` (`file:../shared`) and `redis`
- [x] `npm install` run in `shared/`, `server/`, and `pdf-service/` (shared needs its own node_modules for `file:` symlink resolution)
- [x] `pdf-service/.npmrc` adds `legacy-peer-deps=true` (bullmq's optional redis@>=5 peer vs pinned redis@4)

### 6.4 Environment Files ✅ DONE (local dev)
**Main Server** (`.env`):
- [x] `PORT=5000`
- [x] `REDIS_URL=redis://localhost:6379`
- [x] `JWT_SECRET=your-shared-secret`
- [x] `MONGODB_URI=...`
- [x] `INTERNAL_SERVICE_TOKEN=...`

**PDF Service** (`.env`):
- [x] `PORT=5002`
- [x] `REDIS_URL=redis://localhost:6379`
- [x] `JWT_SECRET=your-shared-secret`
- [x] `MONGODB_URI=...`
- [x] `CLOUDINARY_*=...`
- [ ] Production: configure same vars on Render

---

## Phase 7: Testing & Validation ✅ COMPLETED (local)

### 7.1 Unit / Service Tests ✅ DONE
- [x] Auth service: login, validate, refresh, logout — `server/test-auth-service.mjs` (8/8 pass)
  - login returns tokens · session stored in Redis · validateAccessToken via cache · refreshAccessToken ·
    session meta update · revokeSession clears session+cache · revoked refresh rejected · inactive user rejected
- [x] PDF cache: get, set, invalidate — set/get roundtrip + invalidate verified against local Redis
- [x] PDF processor: generic watermark only — no `user` param, no email/date footer (code verified)
- [x] Rate limiters: in-memory express-rate-limit (Redis-backed rate limiting deferred — optional)

### 7.2 Integration Tests ✅ DONE
- [x] Auth flow: login → access → refresh → logout (covered by test-auth-service.mjs)
- [x] Cross-service auth: main-server-issued JWT accepted by PDF service `/api/pyq/all` (200), user cached in shared Redis, invalid token → 401 — `server/test-cross-service.mjs` (4/4 pass)
- [x] Route removal: `GET localhost:5000/api/pyq` → 404 (moved to PDF service)
- [x] Public PYQ listing on PDF service → 200 (all 838 legacy papers, populated refs)
- [x] Full view → download flow: cold view 858ms (Cloudinary+watermark), cached view 47ms (Redis), download with branded filename — `server/test-pdf-view.mjs` (4/4 pass)

### 7.3 Load Testing ⬜ DEFERRED
- [ ] 300 users/hour simulation
- [ ] Concurrent PDF views (50+)
- [ ] Redis memory usage under load
- [ ] Cold start behavior

### 7.4 Deployment Validation ✅ DONE (local), ⬜ PENDING (Render)
- [x] Main server health check → `{"status":"ok"}` on :5000
- [x] PDF service health check → `{"status":"ok","database":"connected","queue":"initialized"}` on :5002
- [x] Redis connectivity from both services (session/cache/queue all verified)
- [x] CORS headers correct (both services share origin config; `X-Service-Token` allowed on PDF service)
- [x] JWT validation works across services (cross-service test above)
- [ ] Repeat all checks against Render URLs after deployment

---

## File Change Summary

### New Files ✅ CREATED
| File | Purpose | Status |
|------|---------|--------|
| `shared/redisClient.js` | Shared Redis connection | ✅ |
| `shared/package.json` | Shared package config | ✅ |
| `server/src/services/authService.js` | Redis-backed auth | ✅ |
| `pdf-service/src/utils/redisCache.js` | Redis PDF cache | ✅ |
| `pdf-service/src/controllers/pyqController.js` | PYQ logic in PDF service | ✅ |

### Modified Files ✅ UPDATED
| File | Changes | Status |
|------|---------|--------|
| `pdf-service/src/services/pdfProcessor.js` | Generic watermark only | ✅ |
| `pdf-service/src/controllers/pdfController.js` | Redis cache, no user param | ✅ |
| `server/src/middleware/auth.js` | Use authService, no DB lookup | ✅ |
| `server/src/controllers/authController.js` | Use authService, cookies | ✅ |
| `pdf-service/src/routes/pyq.js` | PYQ routes in PDF service | ✅ |
| `pdf-service/src/server.js` | Add PYQ routes | ✅ |
| `pdf-service/package.json` | Add dependencies | ✅ |

### Files to Modify ✅ ALL UPDATED
| File | Changes |
|------|---------|
| `server/src/models/User.js` | Cache invalidation hook ✅ |
| `server/src/routes/auth.js` | Refresh endpoint ✅ |
| `server/src/server.js` | PYQ routes removed ✅ |
| `server/src/models/PYQPaper.js` | Points explicitly at existing `pyqpapers` collection (same as pdf-service `PDFDocument`) — no data migration needed ✅ |
| `server/package.json` | shared/redis dependencies ✅ |
| `client/lib/api.ts` | Dual API endpoints + syllabus routes via main server ✅ |
| `client/.env` | Environment variables ✅ |

### Files Deleted from Main Server
| File | Reason |
|------|--------|
| `server/src/controllers/pyqController.js` | Moved to pdf-service |
| `server/src/routes/pyq.js` | Moved to pdf-service |

### Test / Utility Files
| File | Purpose |
|------|---------|
| `server/test-auth-service.mjs` | Auth service Redis integration test (8 checks) |
| `server/test-cross-service.mjs` | Cross-service JWT validation test (4 checks) |
| `start-all.sh` | Boots Redis + main server + PDF service + client together |

---

## Dependencies Status

### Main Server (`server/package.json`)
- [x] Add `redis: ^4.6.0`
- [x] Add `@invertisprep/shared: file:../shared`

### PDF Service (`pdf-service/package.json`)
- [x] Added `redis: ^4.6.0`
- [x] Added `@invertisprep/shared: file:../shared` (fixed from `file:../../shared` — broken symlink)

### Shared (`shared/package.json`)
- [x] Own `node_modules` installed (`redis` resolves from the real path when symlinked)

### Client (`client/package.json`)
- No new dependencies needed

---

## Deployment Order

1. **Deploy Shared Redis** (Render Redis or external)
2. **Deploy Main Server** (with authService, no PYQ routes)
3. **Deploy PDF Service** (with PYQ routes, Redis cache, generic watermark)
4. **Deploy Client** (with dual API endpoints)
5. **Smoke Test** all flows
6. **Monitor** for 24 hours

---

## Rollback Plan

If issues arise:
1. Re-add PYQ routes to main server temporarily
2. Revert client to single API endpoint
3. Keep Redis auth caching (independent improvement)
4. Debug PDF service in isolation

---

## Success Criteria

- [ ] 300 users/hour sustained without errors
- [ ] PDF view < 500ms (cached) / < 2s (uncached)
- [ ] Auth validation < 50ms (Redis cached)
- [ ] Zero DB queries for auth on steady state
- [ ] Generic watermark renders correctly
- [ ] No user email/date in PDF footer
- [ ] All existing tests pass