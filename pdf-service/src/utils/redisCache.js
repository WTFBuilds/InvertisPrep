import { getRedis } from '../shared/redisClient.js';

const CACHE_TTL = 24 * 60 * 60; // 24 hours
const PREFIX = 'pdf:watermarked:';

export const pdfRedisCache = {
  async get(paperId) {
    try {
      const redis = await getRedis();
      const key = `${PREFIX}${paperId}`;
      const cached = await redis.get(key);
      if (cached) {
        return Buffer.from(cached, 'base64');
      }
      return null;
    } catch (err) {
      console.error('[PDF Redis Cache] Get error:', err.message);
      return null; // Fail open - allow regeneration
    }
  },

  async set(paperId, pdfBytes) {
    try {
      const redis = await getRedis();
      const key = `${PREFIX}${paperId}`;
      const base64 = Buffer.from(pdfBytes).toString('base64');
      await redis.setEx(key, CACHE_TTL, base64);
    } catch (err) {
      console.error('[PDF Redis Cache] Set error:', err.message);
      // Fail silently - cache miss will trigger regeneration
    }
  },

  async invalidate(paperId) {
    try {
      const redis = await getRedis();
      const key = `${PREFIX}${paperId}`;
      await redis.del(key);
    } catch (err) {
      console.error('[PDF Redis Cache] Invalidate error:', err.message);
    }
  },

  async clear() {
    try {
      const redis = await getRedis();
      const keys = await redis.keys(`${PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      console.error('[PDF Redis Cache] Clear error:', err.message);
    }
  }
};