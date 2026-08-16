import jwt from 'jsonwebtoken';
import { getRedis } from '../shared/redisClient.js';

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

    // Check Redis cache first
    const redis = await getRedis();
    const cacheKey = `user:${decoded.id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const user = JSON.parse(cached);
      if (user.isActive) {
        req.user = user;
        return next();
      }
    }

    // If not in cache or inactive, fetch from main server (as fallback)
    // This should rarely happen if main server properly caches on login
    try {
      const response = await fetch(`${process.env.MAIN_SERVER_URL || 'http://localhost:5000'}/api/auth/internal/user/${decoded.id}`, {
        headers: {
          'X-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const user = userData.data;
        
        if (user && user.isActive) {
          // Cache for future requests
          await redis.setEx(cacheKey, USER_CACHE_TTL, JSON.stringify({
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
            isActive: user.isActive
          }));

          req.user = {
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
            isActive: user.isActive
          };
          return next();
        }
      }
    } catch (fetchError) {
      console.error('[Auth] Failed to fetch user from main server:', fetchError);
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
    req.user.role !== 'srt'
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

// Invalidate user cache (called from main server via webhook)
export const invalidateUserCache = async (userId) => {
  try {
    const redis = await getRedis();
    await redis.del(`user:${userId}`);
  } catch (err) {
    console.error('[Auth] Invalidate cache error:', err);
  }
};