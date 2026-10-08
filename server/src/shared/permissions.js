// ── Permission catalog ──────────────────────────────────────────────────────
// Single source of truth for every permission the admin console understands.
// The client mirrors this catalog in client/lib/permissions.ts for UI gating —
// keep the two files in sync (keys are stable strings, never rename one side).

export const PERMISSIONS = {
  // General
  'dashboard.view': 'View the admin dashboard and stats',

  // User management (role changes / bans / deletes stay super-admin only)
  'users.view': 'View users, profiles and user stats',

  // Papers (PYQ)
  'papers.view': 'Browse all uploaded papers',
  'papers.upload': 'Upload new PYQ papers',
  'papers.verify': 'Verify or reject uploaded papers',
  'papers.delete': 'Edit or delete papers',

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
};

// Reserved for the super-admin — never grantable to custom roles.
export const SYSTEM_ONLY_PERMISSIONS = ['roles.manage'];
PERMISSIONS['roles.manage'] = 'Create roles, edit permissions and create staff users';

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS);
export const GRANTABLE_PERMISSION_KEYS = ALL_PERMISSION_KEYS.filter(
  (key) => !SYSTEM_ONLY_PERMISSIONS.includes(key)
);

// Built-in roles resolve to fixed permission sets that reproduce the exact
// access they had before custom roles existed.
export const BUILTIN_ROLE_PERMISSIONS = {
  admin: ALL_PERMISSION_KEYS.filter((k) => k !== 'roles.manage'),
  srt: [
    'dashboard.view',
    'papers.view',
    'papers.upload',
    'papers.verify',
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

/**
 * Resolve the permission set for a request user.
 * Returns the string 'all' for super-admin, otherwise an array of keys.
 * Fail-closed: a staff user whose role vanished resolves to [].
 */
export async function resolveUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'super-admin') return 'all';
  if (user.role === 'admin') return BUILTIN_ROLE_PERMISSIONS.admin;
  if (user.role === 'srt') return BUILTIN_ROLE_PERMISSIONS.srt;
  if (user.role === 'staff' && user.roleId) {
    const role = await loadRole(user.roleId);
    return role ? role.permissions || [] : [];
  }
  return [];
}
