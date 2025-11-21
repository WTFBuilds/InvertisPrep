import { Router } from 'express';
import { login, googleLogin, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/logout', logout);

export default router;
