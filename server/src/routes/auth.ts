import { Router } from 'express';
import { login, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/logout', logout);

export default router;
