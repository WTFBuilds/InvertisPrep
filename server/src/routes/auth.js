import { Router } from 'express';
import crypto from 'crypto';
import { login, googleLogin, register, checkEmail, getCurrentUser, logout, updateProfile, refresh, sendVerificationCode, verifyCode } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// authLimiter protects only credential-verification endpoints — the
// brute-force targets. It is keyed PER ACCOUNT (studentId/email), so a
// shared campus IP never lumps unrelated students together and one student's
// retries can't lock anyone else out. Session routes (/me, /profile, /logout,
// /refresh) are called on every page load / token expiry and must not share
// that bucket; they're covered by the general apiLimiter instead.
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/check-email', authLimiter, checkEmail);
router.post('/google-login', authLimiter, googleLogin);

// Email verification code endpoints (verification before registration)
router.post('/send-verification-code', authLimiter, sendVerificationCode);
router.post('/verify-code', authLimiter, verifyCode);

router.get('/me', authenticateJWT, getCurrentUser);
router.put('/profile', authenticateJWT, updateProfile);
router.post('/logout', logout);
router.post('/refresh', refresh);

// Timing-safe comparison for the service-to-service bearer token
const isValidServiceToken = (provided) => {
  const expected = process.env.INTERNAL_SERVICE_TOKEN || '';
  const given = typeof provided === 'string' ? provided : '';
  if (!expected || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
};

// Internal endpoint for PDF service to validate users
router.get('/internal/user/:userId', async (req, res) => {
  try {
    if (!isValidServiceToken(req.headers['x-service-token'])) {
      return res.status(403).json({ success: false, message: 'Unauthorized service' });
    }

    const { User } = await import('../models/User.js');
    const user = await User.findById(req.params.userId).select('role roleId isActive email name picture').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Internal user fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Internal endpoint for PDF service to resolve a custom role's permissions
router.get('/internal/role/:roleId', async (req, res) => {
  try {
    if (!isValidServiceToken(req.headers['x-service-token'])) {
      return res.status(403).json({ success: false, message: 'Unauthorized service' });
    }

    const { Role } = await import('../models/Role.js');
    const role = await Role.findById(req.params.roleId).select('name label color permissions').lean();

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Internal role fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
