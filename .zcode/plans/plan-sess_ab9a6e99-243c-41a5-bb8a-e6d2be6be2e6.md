## Add "SRT" role (Support & Resource Team)

**Permissions:** view all admin pages (read-only) · verify papers · upload papers + syllabus · NO delete/edit/ban anywhere · NO user management. Regular admin/super-admin permissions are unchanged, except verify is extended to staff roles so SRT can do it.

### Server (Express + Mongoose)

1. **`server/src/models/User.js`** — add `'srt'` to the `role` enum.
2. **`server/src/middleware/auth.js`** — add `isStaff` = admin | super-admin | **srt** (read/upload/verify gate). `isAdmin` (admin|super-admin) stays for delete/edit/user-control ops → SRT is automatically blocked from those.
3. **`server/src/routes/pyq.js`**:
   - `GET /all` → `isStaff` (was isAdmin) — SRT can view papers
   - `POST /upload` → `isStaff` — SRT can upload
   - `PATCH /:id/verify` → `isStaff` (was isSuperAdmin) — SRT (and admins) can verify
   - `PUT /:id`, `DELETE /:id` → keep `isAdmin` — **no edit/delete for SRT**
4. **`server/src/routes/syllabus.js`** — `POST /upload` → `isStaff` (SRT can upload syllabus); `DELETE /:id` stays `isAdmin`.
5. **`server/src/routes/reports.js`** — `GET /` → `isStaff` (view); `PATCH /:id` stays `isAdmin` (SRT can't resolve).
6. **`server/src/routes/bugs.js`** — `GET /` → `isStaff` (view); `PATCH`/`DELETE` stay `isAdmin`.
7. **`server/src/controllers/pyqController.js`** — `getDailyUploadCount`: exempt SRT from the daily upload limit (like admin/super-admin).
8. **`server/src/controllers/adminUserController.js`** — `VALID_ROLES` add `'srt'` (so super-admins can assign it).
9. **`server/src/types/index.js`** — `UserRole` JSDoc typedef add `'srt'`.

### Client (Next.js)

10. **`client/types/index.ts`** — `UserRole` add `'srt'`.
11. **`client/components/ProtectedRoute.tsx`** — allow `srt` into `/admin` (currently admin|super-admin only).
12. **`client/components/app-sidebar.tsx`** — keep all nav items EXCEPT **Users**, which is hidden when role is `srt`.
13. **`client/app/admin/layout.tsx`** — use the same role-filtered nav list for the breadcrumb.
14. **`client/app/admin/dashboard/page.tsx`** — role label shows "SRT"; hide the **Total Users** stat card and **Newest Users** panel for SRT; skip the `adminUserApi` fetches when role is `srt` (they'd 403 and trigger a misleading warning).
15. **`client/app/admin/papers/page.tsx`** — for SRT: hide **Edit**, **Delete**, and **Delete Selected** buttons (View/Verify/Download/Select All/Verify Selected stay).
16. **`client/app/admin/syllabus/page.tsx`** — keep upload, hide delete for SRT.
17. **`client/app/admin/reports/page.tsx`**, **`bugs/page.tsx`**, **`events/page.tsx`**, **`departments/page.tsx`**, **`branches/page.tsx`**, **`sessions/page.tsx`** — hide their modify/delete controls for SRT (view-only). Shared pattern: `const canModify = user?.role !== 'srt'`.
18. **`client/app/admin/users/page.tsx`** — add `SRT` to the role filter options + `roleBadge` (page itself stays blocked for SRT via server 403 + hidden nav).
19. **`client/components/admin/user-detail-dialog.tsx`** — add SRT to `roleBadge`.
20. **`client/app/profile/page.tsx`** — role label shows "SRT".
21. **`client/components/Navbar.tsx`** — show the admin Dashboard link for `srt` too.

### Notes
- Verify becomes available to **admin, super-admin, SRT** (a natural consequence of SRT verifying — admins keep it).
- No migration needed — the enum change is additive; `authenticateJWT` already re-reads role from DB each request, so role changes take effect immediately.
- New SRT accounts: assign the `srt` role via the existing Users page (super-admin).

### Verify
- `node --check` on changed server files
- `npx tsc --noEmit` + eslint on changed client files
- Restart required (server model/route changes)
