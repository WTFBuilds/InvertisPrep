import { authService } from '../services/authService.js';
import { resolveUserPermissions } from '../shared/permissions.js';
import jwt from 'jsonwebtoken';

// Middleware to extract user info optionally (if logged in) without blocking the request if not authenticated
export const optionalAuthenticateJWT = (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      token = token.trim();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore error and proceed without req.user
  }
  next();
};

export const authenticateJWT = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Trim any accidental whitespace or newlines
    token = token.trim();

    const user = await authService.validateAccessToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired or is invalid. Please log in again.',
        error: process.env.NODE_ENV === 'development' ? 'Invalid token' : undefined
      });
    }

    // The auth cache stores the API shape (`id`, no `_id`) — normalize so any
    // consumer reading req.user._id (activity tracking, PDF watermarking)
    // gets a usable id either way.
    if (user._id === undefined && user.id !== undefined) {
      user._id = user.id;
    }

    // Attach the resolved permission set ('all' for super-admin, otherwise an
    // array of keys) so route middlewares and controllers can gate on it.
    // Resolved fresh per request — never part of the Redis user cache — so
    // role permission edits propagate without waiting out the user cache TTL.
    user.permissions = await resolveUserPermissions(user);

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth] JWT Verification failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const hasPerm = (user, permission) =>
  user.permissions === 'all' || (Array.isArray(user.permissions) && user.permissions.includes(permission));

/**
 * Gate a route behind one or more permission keys (any-of when given an
 * array). Built-in roles resolve through their fixed sets; custom 'staff'
 * users through their Role document's permissions; super-admin passes all.
 */
export const requirePermission = (...permissionLists) => {
  const required = permissionLists.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (required.some((permission) => hasPerm(req.user, permission))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You don't have permission to perform this action",
    });
  };
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

// Staff = admin, super-admin, SRT, or a user holding a custom staff role.
// Fine-grained routes should prefer requirePermission() so custom roles are
// gated on what they were actually granted.
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
