import jwt from 'jsonwebtoken';
import { getRedis } from '../shared/redisClient.js';
import { User } from '../models/User.js';

// Read the secret lazily (at call time), NOT at module load.
// ESM hoists imports, so this module evaluates before dotenv.config()
// runs in server.js — a top-level const would capture undefined.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured (check server/.env)');
  }
  return secret;
};

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const REMEMBER_ME_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const USER_CACHE_TTL = 300; // 5 minutes in seconds

export const authService = {
  /**
   * Generate access and refresh tokens for a user
   * Store refresh token in Redis session
   */
  async login(user, rememberMe = false) {
    const accessToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString(), type: 'refresh' },
      getJwtSecret(),
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    // Store session in Redis
    const sessionKey = `session:${user._id}`;
    const redis = await getRedis();
    await redis.hSet(sessionKey, {
      refreshToken,
      userAgent: '', // Will be set by route handler
      ip: '', // Will be set by route handler
      createdAt: Date.now().toString()
    });
    await redis.expire(sessionKey, rememberMe ? REMEMBER_ME_TTL : REFRESH_TOKEN_TTL);

    // Cache user profile
    await this.cacheUser(user);

    return { accessToken, refreshToken };
  },

  /**
   * Validate access token and return cached user profile
   * Falls back to DB if not in cache
   */
  async validateAccessToken(token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      
      // Check Redis for user profile (cached)
      const redis = await getRedis();
      const cacheKey = `user:${decoded.id}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const user = JSON.parse(cached);
        if (user.isActive) {
          return user;
        }
      }

      // Fallback to DB, then cache
      const user = await User.findById(decoded.id)
        .select('role roleId isActive email name picture')
        .lean();

      if (user && user.isActive) {
        await this.cacheUser(user);
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleId: user.roleId ? user.roleId.toString() : null,
          picture: user.picture,
          isActive: user.isActive
        };
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Token validation failed:', error.message);
      return null;
    }
  },

  /**
   * Cache user profile in Redis
   */
  async cacheUser(user) {
    try {
      const redis = await getRedis();
      const key = `user:${user._id.toString()}`;
      const userData = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId ? user.roleId.toString() : null,
        picture: user.picture,
        isActive: user.isActive
      };
      await redis.setEx(key, USER_CACHE_TTL, JSON.stringify(userData));
    } catch (err) {
      console.error('[AuthService] Cache user error:', err.message);
    }
  },

  /**
   * Invalidate user cache (call on role/status change)
   */
  async invalidateUserCache(userId) {
    try {
      const redis = await getRedis();
      await redis.del(`user:${userId}`);
    } catch (err) {
      console.error('[AuthService] Invalidate cache error:', err.message);
    }
  },

  /**
   * Revoke user session (logout)
   */
  async revokeSession(userId) {
    try {
      const redis = await getRedis();
      await redis.del(`session:${userId}`);
      await this.invalidateUserCache(userId);
    } catch (err) {
      console.error('[AuthService] Revoke session error:', err.message);
    }
  },

  /**
   * Refresh access token using refresh token
   * Validates refresh token against Redis session
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, getJwtSecret());
      if (decoded.type !== 'refresh') return null;

      // Verify session exists in Redis and token matches
      const redis = await getRedis();
      const session = await redis.hGetAll(`session:${decoded.id}`);
      
      if (!session.refreshToken || session.refreshToken !== refreshToken) {
        return null;
      }

      const user = await User.findById(decoded.id)
        .select('role roleId isActive email name picture')
        .lean();

      if (!user || !user.isActive) return null;

      return this.login(user);
    } catch (error) {
      console.error('[AuthService] Refresh token failed:', error.message);
      return null;
    }
  },

  /**
   * Update session metadata (user agent, IP)
   */
  async updateSessionMeta(userId, userAgent, ip) {
    try {
      const redis = await getRedis();
      await redis.hSet(`session:${userId}`, {
        userAgent: userAgent || '',
        ip: ip || ''
      });
    } catch (err) {
      console.error('[AuthService] Update session meta error:', err.message);
    }
  }
};