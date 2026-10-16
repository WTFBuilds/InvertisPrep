// ── Permission catalog (client mirror) ─────────────────────────────────────
// Mirrors server/src/shared/permissions.js — keep the two files in sync.
// The server is the enforcement authority; this file only drives UI gating
// (sidebar visibility, action buttons, page guards).

export const PERMISSION_GROUPS = [
  {
    id: 'general',
    label: 'General',
    description: 'Dashboard access',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard', description: 'See the admin dashboard and its stats' },
      { key: 'dashboard.stats', label: 'Dashboard · stats row', description: 'Headline stats (users, papers, reports, bugs)' },
      { key: 'dashboard.live', label: 'Dashboard · live users', description: 'Who is online right now' },
      { key: 'dashboard.growth', label: 'Dashboard · growth', description: 'New signups over time' },
      { key: 'dashboard.activity', label: 'Dashboard · activity graphs', description: 'Signups & daily active users graphs' },
      { key: 'dashboard.attention', label: 'Dashboard · needs attention', description: 'Unverified papers, pending reports and bugs' },
      { key: 'dashboard.newusers', label: 'Dashboard · newest users', description: 'Recently joined users list' },
      { key: 'dashboard.leaderboard', label: 'Dashboard · leaderboard', description: 'Top contributors list' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    description: 'User accounts are always administered by super admins',
    permissions: [
      { key: 'users.view', label: 'View users', description: 'Browse the user list, profiles and stats' },
      { key: 'roles.manage', label: 'Manage roles & create users', description: 'Super-admin only — cannot be delegated', systemOnly: true },
    ],
  },
  {
    id: 'papers',
    label: 'Papers (PYQ)',
    description: 'Uploading, verifying and managing question papers',
    permissions: [
      { key: 'papers.view', label: 'View papers', description: 'Browse the full uploaded paper list' },
      { key: 'papers.upload', label: 'Upload papers', description: 'Upload new PYQ papers' },
      { key: 'papers.verify', label: 'Verify papers', description: 'Verify or reject uploaded papers' },
      { key: 'papers.edit', label: 'Edit papers', description: 'Edit paper details (metadata, branches, session)' },
      { key: 'papers.delete', label: 'Delete papers', description: 'Super-admin only — remove papers entirely', systemOnly: true },
    ],
  },
  {
    id: 'resources',
    label: 'Academic Setup',
    description: 'Departments, branches, sessions and syllabus',
    permissions: [
      { key: 'departments.view', label: 'View departments', description: 'Open the departments page' },
      { key: 'departments.manage', label: 'Manage departments', description: 'Create, edit and delete departments' },
      { key: 'branches.view', label: 'View branches', description: 'Open the branches page' },
      { key: 'branches.manage', label: 'Manage branches', description: 'Create, edit and delete branches' },
      { key: 'sessions.view', label: 'View sessions', description: 'Open the academic sessions page' },
      { key: 'sessions.manage', label: 'Manage sessions', description: 'Create and edit academic sessions' },
      { key: 'syllabus.upload', label: 'Upload syllabus', description: 'Upload syllabus documents' },
      { key: 'syllabus.manage', label: 'Manage syllabus', description: 'Delete syllabus documents' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    description: 'Campus event listings',
    permissions: [
      { key: 'events.view', label: 'View events', description: 'Open the events page' },
      { key: 'events.manage', label: 'Manage events', description: 'Create and manage events' },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation',
    description: 'Paper requests, reports and bug reports',
    permissions: [
      { key: 'requests.view', label: 'View paper requests', description: 'See what papers students have requested' },
      { key: 'requests.manage', label: 'Manage paper requests', description: 'Approve or reject paper requests' },
      { key: 'reports.view', label: 'View reports', description: 'See papers reported by students' },
      { key: 'reports.manage', label: 'Manage reports', description: 'Resolve or dismiss reports' },
      { key: 'bugs.view', label: 'View bug reports', description: 'See bug reports submitted by users' },
      { key: 'bugs.manage', label: 'Manage bug reports', description: 'Update status or delete bug reports' },
    ],
  },
  {
    id: 'mail',
    label: 'Mail Center',
    description: 'Automail, mailbox, broadcasts and mail logs',
    permissions: [
      { key: 'emails.view', label: 'View mail center', description: 'See automail, mailbox, compose and logs' },
      { key: 'emails.manage', label: 'Manage mail', description: 'Send broadcasts and edit mail templates (super-admin can grant)' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring & Marketing',
    description: 'Live activity monitor and marketing leads',
    permissions: [
      { key: 'activity.view', label: 'View activity monitor', description: 'See who is online, the live event feed and per-user activity trails' },
      { key: 'marketing.view', label: 'View marketing insights', description: 'See growth analytics and the leads list (contact info included, no IPs)' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Features',
    description: 'AI-assisted tools across the platform',
    permissions: [
      { key: 'ai.resume', label: 'Resume Builder AI', description: 'Use AI JD-fill, inline rephrase and section enhancement in resume builder' },
    ],
  },
] as const;

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

// Reserved for the super-admin — never grantable to custom or built-in roles
export const SYSTEM_ONLY_PERMISSIONS: string[] = ['roles.manage', 'papers.delete'];
export const GRANTABLE_PERMISSION_KEYS: string[] = ALL_PERMISSION_KEYS.filter(
  (key) => !SYSTEM_ONLY_PERMISSIONS.includes(key)
);

// Fallback permission sets for the editable built-in roles (mirrors the server
// seeds in server/src/shared/permissions.js). The live list comes from the
// server on the user object; these apply only to pre-existing cached sessions.
// 'papers.delete' is super-admin only; 'papers.edit' is grantable.
export const BUILTIN_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PERMISSION_KEYS.filter((k) => k !== 'roles.manage' && k !== 'papers.delete'),
  srt: [
    'dashboard.view',
    'papers.view',
    'papers.upload',
    'papers.verify',
    'papers.edit',
    'syllabus.upload',
    'departments.view',
    'branches.view',
    'sessions.view',
    'events.view',
    'requests.view',
    'reports.view',
    'bugs.view',
  ],
};

export type PermissionUser = {
  role?: string;
  permissions?: string[];
} | null | undefined;

/**
 * 'all' for super-admin, otherwise the resolved permission key list.
 * Built-in admin/srt prefer the server-provided `permissions` list (their
 * permission sets are editable), falling back to the hardcoded defaults for
 * sessions stored before the server sent them.
 */
export function userPermissionSet(user: PermissionUser): 'all' | string[] {
  if (!user) return [];
  if (user.role === 'super-admin') return 'all';
  if (user.role === 'admin') return user.permissions ?? BUILTIN_PERMISSIONS.admin;
  if (user.role === 'srt') return user.permissions ?? BUILTIN_PERMISSIONS.srt;
  if (user.role === 'staff') return user.permissions ?? [];
  return [];
}

/** True when the user holds every listed permission (pass one key or many). */
export function hasPermission(user: PermissionUser, ...keys: string[]): boolean {
  if (!user || keys.length === 0) return false;
  const set = userPermissionSet(user);
  if (set === 'all') return true;
  return keys.every((key) => set.includes(key));
}

/** True when the user holds at least one of the listed permissions. */
export function hasAnyPermission(user: PermissionUser, ...keys: string[]): boolean {
  if (!user || keys.length === 0) return false;
  const set = userPermissionSet(user);
  if (set === 'all') return true;
  return keys.some((key) => set.includes(key));
}

// ── Dashboard section visibility ────────────────────────────────────────────
export const DASHBOARD_SECTION_KEYS = [
  'dashboard.stats',
  'dashboard.live',
  'dashboard.growth',
  'dashboard.activity',
  'dashboard.attention',
  'dashboard.newusers',
  'dashboard.leaderboard',
] as const;

/**
 * Whether a dashboard section should render for this user. Unrestricted by
 * default: a role that holds NO section keys sees every section (so existing
 * roles and super-admin are unaffected). Once a role is given at least one
 * section key, only those sections render.
 */
export function canViewDashboardSection(user: PermissionUser, section: string): boolean {
  const set = userPermissionSet(user);
  if (set === 'all') return true;
  const chosen = set.filter((k) => (DASHBOARD_SECTION_KEYS as readonly string[]).includes(k));
  if (chosen.length === 0) return true;
  return set.includes(section);
}

// ── Role colors ─────────────────────────────────────────────────────────────
// Keys mirror server/src/shared/permissions.js ROLE_COLORS.
export interface RoleColorStyle {
  label: string;
  /** Solid badge classes (colored background + readable text) */
  badge: string;
  /** Small dot classes for pickers/chips */
  dot: string;
  /** Soft background chip (tinted background, darker text) */
  soft: string;
}

export const ROLE_COLORS: Record<string, RoleColorStyle> = {
  slate: { label: 'Slate', badge: 'bg-slate-600 text-white', dot: 'bg-slate-500', soft: 'bg-slate-100 text-slate-700' },
  rose: { label: 'Rose', badge: 'bg-rose-600 text-white', dot: 'bg-rose-500', soft: 'bg-rose-100 text-rose-700' },
  orange: { label: 'Orange', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500', soft: 'bg-orange-100 text-orange-700' },
  amber: { label: 'Amber', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500', soft: 'bg-amber-100 text-amber-700' },
  emerald: { label: 'Emerald', badge: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', soft: 'bg-emerald-100 text-emerald-700' },
  teal: { label: 'Teal', badge: 'bg-teal-600 text-white', dot: 'bg-teal-500', soft: 'bg-teal-100 text-teal-700' },
  sky: { label: 'Sky', badge: 'bg-sky-600 text-white', dot: 'bg-sky-500', soft: 'bg-sky-100 text-sky-700' },
  blue: { label: 'Blue', badge: 'bg-blue-600 text-white', dot: 'bg-blue-500', soft: 'bg-blue-100 text-blue-700' },
  indigo: { label: 'Indigo', badge: 'bg-indigo-600 text-white', dot: 'bg-indigo-500', soft: 'bg-indigo-100 text-indigo-700' },
  violet: { label: 'Violet', badge: 'bg-violet-600 text-white', dot: 'bg-violet-500', soft: 'bg-violet-100 text-violet-700' },
  fuchsia: { label: 'Fuchsia', badge: 'bg-fuchsia-600 text-white', dot: 'bg-fuchsia-500', soft: 'bg-fuchsia-100 text-fuchsia-700' },
  pink: { label: 'Pink', badge: 'bg-pink-600 text-white', dot: 'bg-pink-500', soft: 'bg-pink-100 text-pink-700' },
};

export const ROLE_COLOR_KEYS = Object.keys(ROLE_COLORS);

// ── Admin navigation gating ─────────────────────────────────────────────────
// Which permission(s) unlock each admin page. Array = any-of.
// /admin/roles is special-cased: super-admin only.
export const NAV_PERMISSIONS: Record<string, string[]> = {
  '/admin/dashboard': ['dashboard.view'],
  '/admin/users': ['users.view'],
  '/admin/departments': ['departments.view'],
  '/admin/branches': ['branches.view'],
  '/admin/sessions': ['sessions.view'],
  '/admin/upload': ['papers.upload'],
  '/admin/papers': ['papers.view'],
  '/admin/syllabus': ['syllabus.upload', 'syllabus.manage'],
  '/admin/reports': ['reports.view'],
  '/admin/requests': ['requests.view'],
  '/admin/bugs': ['bugs.view'],
  '/admin/events': ['events.view'],
  '/admin/mail': ['emails.view'],
  '/admin/mail/automail': ['emails.view'],
  '/admin/mail/mailbox': ['emails.view'],
  '/admin/mail/compose': ['emails.view'],
  '/admin/mail/logs': ['emails.view'],
  '/admin/mail/notifications': ['emails.view'],
  '/admin/activity': ['activity.view'],
  '/admin/marketing': ['marketing.view'],
};

// Prefix-gated dynamic routes (e.g. /admin/activity/u/:id) — a pathname falls
// under the first matching prefix.
export const NAV_PERMISSION_PREFIXES: [string, string[]][] = [
  ['/admin/activity/u/', ['activity.view']],
];

export const SUPER_ADMIN_ONLY_ROUTES = ['/admin/roles', '/admin/backup', '/admin/settings'];

export function canAccessAdminRoute(user: PermissionUser, pathname: string): boolean {
  if (SUPER_ADMIN_ONLY_ROUTES.includes(pathname)) {
    return user?.role === 'super-admin';
  }
  for (const [prefix, required] of NAV_PERMISSION_PREFIXES) {
    if (pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix)) {
      return hasAnyPermission(user, ...required);
    }
  }
  const required = NAV_PERMISSIONS[pathname];
  if (!required) return true; // not a gated route
  return hasAnyPermission(user, ...required);
}

/**
 * First admin route the user can actually open — used as the post-login
 * landing page for staff, so a marketing role lands on /admin/marketing
 * instead of hitting "Access denied" on the dashboard.
 */
export function firstAdminRoute(user: PermissionUser): string {
  const order = [
    '/admin/dashboard',
    '/admin/activity',
    '/admin/marketing',
    '/admin/users',
    '/admin/roles',
    '/admin/departments',
    '/admin/branches',
    '/admin/sessions',
    '/admin/upload',
    '/admin/papers',
    '/admin/syllabus',
    '/admin/reports',
    '/admin/requests',
    '/admin/bugs',
    '/admin/events',
    '/admin/mail',
  ];
  for (const route of order) {
    if (canAccessAdminRoute(user, route)) return route;
  }
  return '/admin/dashboard';
}

/**
 * Whether the user may enter the admin console at all — true for built-in
 * admins/SRT and for custom-role users who hold at least one permission.
 * Used to decide whether to surface a link into the admin area.
 */
export function canEnterAdmin(user: PermissionUser): boolean {
  if (!user) return false;
  if (user.role === 'super-admin' || user.role === 'admin' || user.role === 'srt') return true;
  return userPermissionSet(user).length > 0;
}

// Display metadata for the built-in roles
export const BUILTIN_ROLE_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  'super-admin': { label: 'Super Admin', badge: 'bg-slate-900 text-white', dot: 'bg-slate-900' },
  admin: { label: 'Admin', badge: 'bg-indigo-600 text-white', dot: 'bg-indigo-500' },
  srt: { label: 'SRT', badge: 'bg-teal-600 text-white', dot: 'bg-teal-500' },
  student: { label: 'Student', badge: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-300' },
  staff: { label: 'Custom Role', badge: 'bg-violet-600 text-white', dot: 'bg-violet-500' },
};

type RoleDescriptorUser = {
  role?: string;
  roleMeta?: { label?: string | null; color?: string | null } | null;
} | null | undefined;

/**
 * Human-readable label for a user's role, honouring custom roles. For a
 * custom-role user the assigned role's own label wins (e.g. "Librarian"),
 * falling back to the generic "Custom Role".
 */
export function roleDisplayLabel(user: RoleDescriptorUser): string {
  if (!user) return 'Student';
  if (user.role === 'staff') return user.roleMeta?.label || 'Custom Role';
  return BUILTIN_ROLE_META[user.role || 'student']?.label ?? 'Student';
}

/**
 * Solid badge classes for a user's role, honouring a custom role's colour.
 * Mirrors the built-in role badges from BUILTIN_ROLE_META.
 */
export function roleDisplayBadge(user: RoleDescriptorUser): string {
  if (!user) return BUILTIN_ROLE_META.student.badge;
  if (user.role === 'staff') {
    const style = ROLE_COLORS[user.roleMeta?.color || 'violet'] || ROLE_COLORS.violet;
    return style.badge;
  }
  return BUILTIN_ROLE_META[user.role || 'student']?.badge ?? BUILTIN_ROLE_META.student.badge;
}
