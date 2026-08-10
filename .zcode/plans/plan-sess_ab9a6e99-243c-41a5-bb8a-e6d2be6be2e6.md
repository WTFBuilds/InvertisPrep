## Redesign Admin Dashboard (`client/app/admin/dashboard/page.tsx`)

The current page is 10 giant "Manage" link cards (all duplicated in the sidebar) + 6 bare counts — low-value. Replace it with a real admin dashboard surfaced from **existing endpoints only** (no server changes).

### Layout

**1. Header**
- Greeting: "Good {morning/afternoon/evening}, {admin name}" + role badge + today's date (en-IN)
- Primary CTA: "Upload Paper" button → `/admin/upload`

**2. Stat cards (6, clickable, with sub-counts)**
- **Total Users** (adminUserApi.stats) — sub: "X active · Y banned" → `/admin/users`
- **Papers** (pyqApi.getAll total) — sub: "X verified" → `/admin/papers`
- **Pending Review** — count of unverified papers → `/admin/papers`
- **Pending Reports** (reportApi.getAll('pending')) → `/admin/reports`
- **Open Bugs** (bugApi.getAll('pending')) → `/admin/bugs`
- **Active Events** (eventApi.getAll, registrationOpen count) → `/admin/events`

**3. "Needs Attention" panel** (the actionable core)
- Three columns: **Unverified papers** (top 5, title + dept/branch/year), **Pending reports** (top 5, paper + reason), **Open bugs** (top 5, title + severity badge)
- Each column has "View all →" link to its management page
- Red/amber severity accents

**4. Recent activity row (2 columns)**
- **Newest users** — top 5 from adminUserApi.list({sort:'newest'}) — avatar, name, email, joined date, View → user dialog
- **Leaderboard top 5** — leaderboardApi.getRankings('all_time') — rank, name, course, points

**5. Quick actions strip**
- Compact pill buttons (not giant cards): Departments, Branches, Sessions, Syllabus, Bug Reports, Events — each linking to its page

### Implementation notes
- Single `Promise.all` fetch with per-call `.catch` fallbacks (dashboard stays usable if one endpoint fails) — matches existing pattern
- Skeleton placeholders while loading; inline error strip if everything fails
- White/light theme consistent with the app (slate-900 headings, slate borders, rounded-2xl/3xl)
- Reuses Badge, Avatar, Button, Card, Skeleton from shadcn
- No new files, no server changes — pure rewrite of dashboard/page.tsx

### Verify
- `npx tsc --noEmit` clean
- `npx eslint app/admin/dashboard/page.tsx` — only pre-existing warnings (no new errors; the `any` in the papers-total cast will be replaced with a typed approach)
