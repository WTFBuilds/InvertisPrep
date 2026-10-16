// ── Permission catalog ──────────────────────────────────────────────────────
// Single source of truth for every permission the admin console understands.
// The client mirrors this catalog in client/lib/permissions.ts for UI gating —
// keep the two files in sync (keys are stable strings, never rename one side).

export const PERMISSIONS = {
  // General
  'dashboard.view': 'View the admin dashboard and stats',

  // Dashboard sections — fine-grained control over which dashboard widgets a
  // role sees. A role that holds dashboard.view but none of these sees every
  // section (backwards compatible for pre-existing roles); once a role is
  // given any section permission, only its selected sections render.
  'dashboard.stats': 'Headline stats row (users, papers, reports, bugs)',
  'dashboard.live': 'Live users panel — who is online right now',
  'dashboard.growth': 'Growth panel — new signups over time',
  'dashboard.activity': 'Activity graphs — signups & daily active users',
  'dashboard.attention': 'Needs Attention — unverified papers, reports, bugs',
  'dashboard.newusers': 'Newest users list',
  'dashboard.leaderboard': 'Top contributors leaderboard',

  // User management (role changes / bans / deletes stay super-admin only)
  'users.view': 'View users, profiles and user stats',

  // Papers (PYQ)
  'papers.view': 'Browse all uploaded papers',
  'papers.upload': 'Upload new PYQ papers',
  'papers.verify': 'Verify or reject uploaded papers',
  'papers.edit': 'Edit paper details (metadata, branches, session)',

  // Academic setup
  'departments.view': 'View the departments page',
  'departments.manage': 'Create, edit and delete departments',
  'branches.view': 'View the branches page',
  'branches.manage': 'Create, edit and delete branches',
  'sessions.view': 'View the academic sessions page',
  'sessions.manage': 'Create and edit academic sessions',
  'syllabus.upload': 'Upload syllabus documents',
  'syllabus.manage': 'Delete syllabus documents',

  // Events
  'events.view': 'View the events page',
  'events.manage': 'Create and manage events',

  // Moderation
  'requests.view': 'View paper requests',
  'requests.manage': 'Approve or reject paper requests',
  'reports.view': 'View reported papers',
  'reports.manage': 'Resolve or dismiss reports',
  'bugs.view': 'View bug reports',
  'bugs.manage': 'Update or delete bug reports',

  // Mail center
  'emails.view': 'View the mail center (automail, mailbox, logs)',
  'emails.manage': 'Send broadcasts and edit mail templates',

  // Monitoring & marketing
  'activity.view': 'View the activity monitor: live users, event feed and per-user trails',
  'marketing.view': 'View marketing insights: growth, engagement and the leads list',

  // Resume builder AI
  'ai.resume': 'Use AI resume tools (job-description fill, rephrase, enhance)',
};

// Reserved for the super-admin — never grantable to custom or built-in roles.
// roles.manage guards role/user administration; papers.delete (removing papers
// entirely) is likewise reserved: everyone else may at most edit paper details.
export const SYSTEM_ONLY_PERMISSIONS = ['roles.manage', 'papers.delete'];
PERMISSIONS['roles.manage'] = 'Create roles, edit permissions and create staff users';
PERMISSIONS['papers.delete'] = 'Delete papers (super-admin only)';

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS);
export const GRANTABLE_PERMISSION_KEYS = ALL_PERMISSION_KEYS.filter(
  (key) => !SYSTEM_ONLY_PERMISSIONS.includes(key)
);

// Dashboard section keys — the dashboard renders a section when the role has
// no section keys at all (unrestricted) or holds that specific section key.
export const DASHBOARD_SECTION_KEYS = [
  'dashboard.stats',
  'dashboard.live',
  'dashboard.growth',
  'dashboard.activity',
  'dashboard.attention',
  'dashboard.newusers',
  'dashboard.leaderboard',
];

// Built-in roles resolve to fixed permission sets that reproduce the exact
// access they had before custom roles existed.
// 'papers.delete' is SUPER_ADMIN ONLY (system-only); 'papers.edit' is grantable.
export const BUILTIN_ROLE_PERMISSIONS = {
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

// Valid hex-free color keys shared with the client (see ROLE_COLORS there).
export const ROLE_COLORS = [
  'slate',
  'rose',
  'orange',
  'amber',
  'emerald',
  'teal',
  'sky',
  'blue',
  'indigo',
  'violet',
  'fuchsia',
  'pink',
];

// ── Role lookup cache ───────────────────────────────────────────────────────
// Custom-role holders resolve their permission set from the Role collection on
// every request; a 60s in-process cache keeps that free while still letting
// permission edits propagate within a minute. Failures are never cached.
const ROLE_CACHE_TTL_MS = 60 * 1000;
const roleCache = new Map(); // roleId -> { role, expires }

export function invalidateRoleCache(roleId) {
  if (roleId) roleCache.delete(String(roleId));
  else roleCache.clear();
}

async function loadRole(roleId) {
  const key = String(roleId);
  const hit = roleCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.role;

  const { Role } = await import('../models/Role.js');
  const role = await Role.findById(key).lean().catch(() => null);

  if (role) {
    roleCache.set(key, { role, expires: Date.now() + ROLE_CACHE_TTL_MS });
  } else {
    roleCache.delete(key);
  }
  return role;
}

// ── Editable built-in role permissions ──────────────────────────────────────
// 'admin' and 'srt' exist as real Role documents (isSystem: true) so a super
// admin can tune exactly what they may do — e.g. an admin that can verify
// papers but not delete them. BUILTIN_ROLE_PERMISSIONS remains the seed for
// new documents and the fallback whenever the document is missing or the DB
// read fails, so auth never breaks because of a roles-collection hiccup.
// 'super-admin' always resolves to 'all' and 'student' to [] — deliberately
// NOT editable, so permission revocation can never lock super-admins out.
const SYSTEM_ROLE_CACHE_TTL_MS = 60 * 1000;
const systemRoleCache = new Map(); // role name -> { permissions, expires }

export function invalidateSystemRoleCache(name) {
  if (name) systemRoleCache.delete(name);
  else systemRoleCache.clear();
}

export async function loadSystemRolePermissions(name) {
  const hit = systemRoleCache.get(name);
  if (hit && hit.expires > Date.now()) return hit.permissions;

  try {
    const { Role } = await import('../models/Role.js');
    const doc = await Role.findOne({ name, isSystem: true }).select('permissions').lean();
    if (!doc) return null; // no document yet → caller falls back to defaults
    const permissions = doc.permissions || [];
    systemRoleCache.set(name, { permissions, expires: Date.now() + SYSTEM_ROLE_CACHE_TTL_MS });
    return permissions;
  } catch {
    return null; // DB hiccup → fall back to defaults, never fail auth
  }
}

/**
 * Resolve the permission set for a request user.
 * Returns the string 'all' for super-admin, otherwise an array of keys.
 * Fail-closed: a staff user whose role vanished resolves to [].
 */
export async function resolveUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'super-admin') return 'all';
  if (user.role === 'admin' || user.role === 'srt') {
    const override = await loadSystemRolePermissions(user.role);
    if (override) return override;
    return BUILTIN_ROLE_PERMISSIONS[user.role] || [];
  }
  if (user.role === 'staff' && user.roleId) {
    const role = await loadRole(user.roleId);
    return role ? role.permissions || [] : [];
  }
  return [];
}
