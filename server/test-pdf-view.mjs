// End-to-end PDF view test: real paper → PDF service view endpoint (auth'd)
// Exercises: JWT auth (Redis cache path) → pyqpapers lookup → Cloudinary
// download → watermark → Redis PDF cache → response bytes.
import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './src/models/User.js';
import { getRedis } from './src/shared/redisClient.js';

const PDF_SERVICE = process.env.PDF_SERVICE_URL || 'http://localhost:5002';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ isActive: true }).lean();
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  // pick a verified paper via the service's own listing
  const listRes = await fetch(`${PDF_SERVICE}/api/pyq`);
  const list = await listRes.json();
  const paper = list.data?.[0];
  if (!paper) { console.log('❌ no papers in listing'); process.exit(1); }

  const redis = await getRedis();
  const cacheKey = `pdf:watermarked:${paper._id}`;

  const t0 = Date.now();
  const res1 = await fetch(`${PDF_SERVICE}/api/pdf/view/${paper._id}?type=pyq`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bytes1 = Buffer.from(await res1.arrayBuffer());
  const t1 = Date.now();
  const isPdf = bytes1.slice(0, 5).toString().startsWith('%PDF');
  const cached = await redis.exists(cacheKey);

  console.log(`${res1.status === 200 && isPdf ? '✅' : '❌'} view #1 (cold): HTTP ${res1.status}, ${isPdf ? 'valid PDF' : 'NOT a PDF'}, ${(bytes1.length / 1024).toFixed(0)} KB, ${t1 - t0}ms`);
  console.log(`${cached ? '✅' : '❌'} watermarked PDF cached in Redis`);

  // second view should hit the Redis cache (fast)
  const t2 = Date.now();
  const res2 = await fetch(`${PDF_SERVICE}/api/pdf/view/${paper._id}?type=pyq`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await res2.arrayBuffer();
  const t3 = Date.now();
  console.log(`${res2.status === 200 ? '✅' : '❌'} view #2 (cached): HTTP ${res2.status}, ${t3 - t2}ms`);

  // download endpoint with filename
  const dl = await fetch(`${PDF_SERVICE}/api/pdf/download/${paper._id}?type=pyq`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const disp = dl.headers.get('content-disposition') || '';
  console.log(`${dl.status === 200 && disp.includes('attachment') ? '✅' : '❌'} download: HTTP ${dl.status}, filename present: ${disp.includes('filename')}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error('Test crashed:', e.message); process.exit(1); });
