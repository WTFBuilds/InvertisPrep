// Cross-service JWT validation test (Phase 7.4):
// Signs a token with the shared JWT_SECRET for a real DB user, then calls the
// PDF service's protected /api/pyq/all WITHOUT priming the Redis user cache —
// forcing the pdf-service auth middleware down its main-server fallback path
// (GET /api/auth/internal/user/:id with X-Service-Token).
import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './src/models/User.js';
import { getRedis } from './src/shared/redisClient.js';

const PDF_SERVICE = process.env.PDF_SERVICE_URL || 'http://localhost:5002';
const MAIN_SERVER = `http://localhost:${process.env.PORT || 5000}`;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ isActive: true }).lean();
  if (!user) { console.log('❌ no active user in DB to test with'); process.exit(1); }
  const userId = user._id.toString();

  // Ensure a cold cache so the fallback path is exercised
  const redis = await getRedis();
  await redis.del(`user:${userId}`);

  const token = jwt.sign(
    { id: userId, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  // 1. Internal endpoint reachable with service token?
  const internalRes = await fetch(`${MAIN_SERVER}/api/auth/internal/user/${userId}`, {
    headers: { 'X-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
  });
  console.log(`${internalRes.ok ? '✅' : '❌'} main-server internal user endpoint: ${internalRes.status}`);

  // 2. Protected PDF-service endpoint accepts main-server-issued JWT
  const pyqRes = await fetch(`${PDF_SERVICE}/api/pyq/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`${pyqRes.status !== 401 ? '✅' : '❌'} pdf-service /api/pyq/all cross-service JWT: ${pyqRes.status}`);

  // 3. User now cached in Redis by the pdf-service (fallback caches it)
  const cached = await redis.get(`user:${userId}`);
  console.log(`${cached ? '✅' : '❌'} pdf-service cached user profile in Redis`);

  // 4. Tampered token rejected
  const badRes = await fetch(`${PDF_SERVICE}/api/pyq/all`, {
    headers: { Authorization: 'Bearer not.a.validtoken' },
  });
  console.log(`${badRes.status === 401 ? '✅' : '❌'} invalid token rejected: ${badRes.status}`);

  await redis.del(`user:${userId}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error('Test crashed:', e.message); process.exit(1); });
