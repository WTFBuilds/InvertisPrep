import { Router } from 'express';
import { login, googleLogin, getCurrentUser, logout, updateProfile } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/me', authenticateJWT, getCurrentUser);
router.put('/profile', authenticateJWT, updateProfile);
router.post('/logout', logout);

export default router;
