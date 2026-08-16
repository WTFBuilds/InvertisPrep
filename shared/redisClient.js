import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[Redis] Max retries reached, giving up');
        return new Error('Max retries reached');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
    connectTimeout: 10000,
    lazyConnect: true,
  },
});

redis.on('error', (err) => {
  console.error('[Redis] Client Error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redis.on('ready', () => {
  console.log('[Redis] Ready');
});

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

redis.on('end', () => {
  console.log('[Redis] Connection closed');
});

let connectPromise = null;

export const getRedis = async () => {
  if (!connectPromise) {
    connectPromise = redis.connect().catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  await connectPromise;
  return redis;
};

export const closeRedis = async () => {
  if (redis.isOpen) {
    await redis.quit();
    connectPromise = null;
  }
};

export default redis;