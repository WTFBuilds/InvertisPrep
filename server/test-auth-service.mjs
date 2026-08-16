// Test: authService login → validate → refresh → revoke (Redis-backed)
// Creates a throwaway user in the dev DB for the refresh happy-path, then
// cleans up both the DB record and all Redis keys when finished.
import 'dotenv/config';
import mongoose from 'mongoose';
import { authService } from './src/services/authService.js';
import { User } from './src/models/User.js';
import { getRedis } from '@invertisprep/shared';

const assert = (name, cond) => {
  console.log(`${cond ? '✅' : '❌'} ${name}`);
  if (!cond) process.exitCode = 1;
};

const run = async () => {
  await getRedis(); // connect Redis
  await mongoose.connect(process.env.MONGODB_URI); // connect Mongo for refresh-path user lookup

  // Throwaway user — deleted in finally block
  const testUser = await User.create({
    email: `auth-test-${Date.now()}@example.com`,
    name: 'Auth Service Test',
    password: 'test-password-123',
    role: 'student',
    isActive: true,
  });
  const TEST_ID = testUser._id.toString();

  try {
    // 1. login → tokens + Redis session + user cache
    const { accessToken, refreshToken } = await authService.login(testUser, false);
    assert('login returns tokens', !!accessToken && !!refreshToken);

    const redis = await getRedis();
    const session = await redis.hGetAll(`session:${TEST_ID}`);
    assert('session stored in Redis', session.refreshToken === refreshToken);

    // 2. validateAccessToken → should hit the Redis cache (no DB)
    const validated = await authService.validateAccessToken(accessToken);
    assert('validateAccessToken returns cached user', validated?.id === TEST_ID && validated?.role === 'student');

    // 3. refreshAccessToken → session match + DB user check
    const refreshed = await authService.refreshAccessToken(refreshToken);
    assert('refreshAccessToken issues new tokens', !!refreshed?.accessToken && !!refreshed?.refreshToken);

    // 4. updateSessionMeta
    await authService.updateSessionMeta(TEST_ID, 'test-agent', '127.0.0.1');
    const meta = await redis.hGetAll(`session:${TEST_ID}`);
    assert('session meta updated', meta.userAgent === 'test-agent' && meta.ip === '127.0.0.1');

    // 5. revokeSession → clears session + cache
    await authService.revokeSession(TEST_ID);
    const revokedSession = await redis.exists(`session:${TEST_ID}`);
    const revokedCache = await redis.exists(`user:${TEST_ID}`);
    assert('revokeSession clears session and cache', revokedSession === 0 && revokedCache === 0);

    // 6. stale refresh token now rejected
    const afterRevoke = await authService.refreshAccessToken(refreshToken);
    assert('revoked refresh token rejected', afterRevoke === null);

    // 7. inactive user cannot validate (cache-bypass via fresh token on deactivated user)
    testUser.isActive = false;
    await testUser.save(); // triggers the post-save cache invalidation hook
    await authService.cacheUser(testUser); // re-cache with isActive: false
    const inactiveCheck = await authService.validateAccessToken(accessToken);
    assert('inactive user rejected on validate', inactiveCheck === null);
  } finally {
    await User.deleteOne({ _id: TEST_ID });
    const redis = await getRedis();
    await redis.del(`session:${TEST_ID}`, `user:${TEST_ID}`);
    await mongoose.disconnect();
  }

  console.log(process.exitCode ? '❌ SOME TESTS FAILED' : '✅ ALL AUTH SERVICE TESTS PASSED');
  process.exit(process.exitCode || 0);
};

run().catch((e) => { console.error('Test crashed:', e.message); process.exit(1); });
