import express from 'express';
import { googleAuth, emailLogin, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/google - Google OAuth login/register
router.post('/google', googleAuth);

// POST /api/auth/login - Email/Password login
router.post('/login', emailLogin);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/logout - Logout (protected)
router.post('/logout', authenticate, logout);

export default router;
