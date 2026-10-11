import jwt from 'jsonwebtoken';
import { getRedis } from '../shared/redisClient.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';

// Read the secret lazily (at call time), NOT at module load.
// ESM hoists imports, so this module evaluates before dotenv.config()
// runs in server.js — a top-level const would capture undefined.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured (check pdf-service/.env)');
  }
  return secret;
};

const USER_CACHE_TTL = 300; // 5 minutes in seconds

// ── Custom role permission resolution ───────────────────────────────────────
// Custom-role ('staff') users carry a roleId; their permission set lives on the
// Role document. The PDF service and the main server share one MongoDB, so we
// read the Role directly — no service-to-service HTTP hop, so paper access
// never depends on MAIN_SERVER_URL/INTERNAL_SERVICE_TOKEN being reachable.
// A short in-process cache keeps that free while letting edits propagate.
// The built-in sets below mirror server/src/shared/permissions.js — keep in sync.
const ROLE_CACHE_TTL_MS = 60 * 1000;
const roleCache = new Map(); // roleId -> { permissions, expires }

const BUILTIN_PERMISSIONS = {
  admin: [
    'dashboard.view', 'users.view',
    'papers.view', 'papers.upload', 'papers.verify', 'papers.delete',
    'departments.view', 'departments.manage',
    'branches.view', 'branches.manage',
    'sessions.view', 'sessions.manage',
    'syllabus.upload', 'syllabus.manage',
    'events.view', 'events.manage',
    'requests.view', 'requests.manage',
    'reports.view', 'reports.manage',
    'bugs.view', 'bugs.manage',
  ],
  srt: [
    'dashboard.view', 'papers.view', 'papers.upload', 'papers.verify',
    'syllabus.upload', 'departments.view', 'branches.view', 'sessions.view',
    'events.view', 'requests.view', 'reports.view', 'bugs.view',
  ],
};

// Primary path: read the Role straight from the shared DB. Returns null on a
// read error (so the caller can try the fallback) or an array otherwise.
const loadRolePermissionsFromDb = async (roleId) => {
  try {
    const role = await Role.findById(roleId).select('permissions').lean();
    return role ? role.permissions || [] : [];
  } catch (err) {
    console.error('[Auth] Failed to read role from DB:', err.message);
    return null;
  }
};

// Fallback path (only when the DB read errored): ask the main server. Kept so
// a transient DB hiccup can't take paper access down entirely. Bounded by a
// 5s timeout — a hung main server must never stall paper requests.
const fetchRolePermissionsFromServer = async (roleId) => {
  try {
    const response = await fetch(
      `${process.env.MAIN_SERVER_URL || 'http://localhost:5000'}/api/auth/internal/role/${roleId}`,
      {
        headers: {
          'X-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data?.permissions || [];
  } catch (err) {
    console.error('[Auth] Failed to fetch role permissions:', err.message);
    return null;
  }
};

const resolvePermissions = async (user) => {
  if (!user) return [];
  if (user.role === 'super-admin') return 'all';
  if (user.role === 'admin' || user.role === 'srt') {
    return BUILTIN_PERMISSIONS[user.role] || [];
  }
  if (user.role === 'staff' && user.roleId) {
    const key = String(user.roleId);
    const hit = roleCache.get(key);
    if (hit && hit.expires > Date.now()) return hit.permissions;

    let permissions = await loadRolePermissionsFromDb(key);
    if (permissions === null) permissions = await fetchRolePermissionsFromServer(key);

    if (Array.isArray(permissions)) {
      roleCache.set(key, { permissions, expires: Date.now() + ROLE_CACHE_TTL_MS });
      return permissions;
    }
    roleCache.delete(key);
    return [];
  }
  return [];
};

const permissionSatisfied = (user, permission) =>
  user.permissions === 'all' ||
  (Array.isArray(user.permissions) && user.permissions.includes(permission));

// Map a raw user doc/payload into the request user. `id` and `_id` are both
// set — controllers read either (`req.user._id` in the activity trail, `id`
// elsewhere), and a missing `_id` silently dropped every activity log entry.
const toRequestUser = (u) => ({
  id: String(u._id || u.id),
  _id: String(u._id || u.id),
  email: u.email,
  name: u.name,
  role: u.role,
  roleId: u.roleId ? String(u.roleId) : null,
  picture: u.picture || null,
  isActive: u.isActive,
});

export const authenticateJWT = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Trim any accidental whitespace or newlines
    token = token.trim();

    const decoded = jwt.verify(token, getJwtSecret());
    const cacheKey = `user:${decoded.id}`;

    // Redis is an optional cache, never a dependency — an unreachable Redis
    // must not 401 an otherwise-valid session.
    try {
      const redis = await getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        const user = JSON.parse(cached);
        if (user.isActive) {
          user.permissions = await resolvePermissions(user);
          req.user = user;
          return next();
        }
      }
    } catch (cacheErr) {
      console.warn('[Auth] Redis cache unavailable, falling back to DB:', cacheErr.message);
    }

    // Primary lookup: read the user straight from the shared MongoDB — the
    // pdf-service and the main server use one cluster, so auth doesn't depend
    // on the main server process being reachable.
    let user = null;
    try {
      const doc = await User.findById(decoded.id)
        .select('name email role roleId isActive picture')
        .lean();
      if (doc && doc.isActive) user = toRequestUser(doc);
    } catch (dbErr) {
      console.error('[Auth] DB user lookup failed:', dbErr.message);
    }

    // Last resort (DB read errored): ask the main server, bounded by a 5s
    // timeout so a hung main server can't stall paper requests.
    if (!user) {
      try {
        const response = await fetch(`${process.env.MAIN_SERVER_URL || 'http://localhost:5000'}/api/auth/internal/user/${decoded.id}`, {
          headers: {
            'X-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const userData = await response.json();
          const raw = userData.data;
          if (raw && raw.isActive) user = toRequestUser(raw);
        }
      } catch (fetchError) {
        console.error('[Auth] Failed to fetch user from main server:', fetchError.message);
      }
    }

    if (user) {
      user.permissions = await resolvePermissions(user);

      // Best-effort cache write; failures never block the request.
      try {
        const redis = await getRedis();
        await redis.setEx(cacheKey, USER_CACHE_TTL, JSON.stringify(user));
      } catch { /* cache unavailable — fine */ }

      req.user = user;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
    });
  } catch (error) {
    console.error(`[Auth] JWT Verification failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  next();
};

export const isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'super-admin' &&
    req.user.role !== 'srt' &&
    req.user.role !== 'staff'
  ) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }

  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }

  next();
};

/**
 * Gate a route behind one or more permission keys (any-of when given an
 * array). Mirrors the main server's requirePermission: built-in roles resolve
 * through their fixed sets; custom 'staff' users through their Role document.
 */
export const requirePermission = (...permissionLists) => {
  const required = permissionLists.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (required.some((permission) => permissionSatisfied(req.user, permission))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You don't have permission to perform this action",
    });
  };
};

// Invalidate user cache (called from main server via webhook)
export const invalidateUserCache = async (userId) => {
  try {
    const redis = await getRedis();
    await redis.del(`user:${userId}`);
  } catch (err) {
    console.error('[Auth] Invalidate cache error:', err);
  }
};