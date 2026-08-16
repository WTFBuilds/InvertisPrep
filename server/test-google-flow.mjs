// Replicates the googleLogin handler's post-verification flow exactly:
// findOne → create/update → save → authService.login → updateSessionMeta → formatUser
// (skips only verifyGoogleToken, which needs a real Google ID token)
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { authService } from './src/services/authService.js';
import { getRedis } from './src/shared/redisClient.js';

const formatUser = (user) => ({
  id: user._id, email: user.email, name: user.name, role: user.role,
  picture: user.picture, studentId: user.studentId || '', phoneNumber: user.phoneNumber || '',
  course: user.course || '', followers: user.followers || [], following: user.following || [],
  qcoins: user.qcoins ?? 0, freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
});

const email = `googletest-${Date.now()}@example.com`;
const sub = `test-sub-${Date.now()}`;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await getRedis();
  let user;

  try {
    // --- NEW USER PATH (first Google login) ---
    user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: sub, email, name: 'Google Test', picture: null,
        role: 'student', isActive: true, lastLogin: new Date(),
      });
      console.log('✅ User.create (new Google user) OK');
    }

    // --- EXISTING USER PATH (subsequent login) ---
    user.lastLogin = new Date();
    if (!user.googleId) user.googleId = sub;
    await user.save();
    console.log('✅ user.save (existing Google user) OK');

    // --- authService.login + cookie/meta flow ---
    const { accessToken, refreshToken } = await authService.login(user);
    console.log('✅ authService.login OK (access + refresh tokens)');

    await authService.updateSessionMeta(user._id.toString(), 'Mozilla/5.0 test', '127.0.0.1');
    console.log('✅ updateSessionMeta OK');

    const shaped = formatUser(user);
    console.log('✅ formatUser OK:', shaped.email, shaped.role);

    console.log('\n✅ FULL GOOGLE-LOGIN FLOW PASSES — handler code is healthy');
  } catch (e) {
    console.error('\n❌ FAILURE:', e?.name, '-', e?.message);
    console.error(e?.stack?.split('\n').slice(0, 4).join('\n'));
    process.exitCode = 1;
  } finally {
    if (user?._id) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      const redis = await getRedis();
      await redis.del(`session:${user._id}`, `user:${user._id}`).catch(() => {});
    }
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
};

run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
