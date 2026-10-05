import { Router } from 'express';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { authenticateJWT, isAdmin, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getSessions);

// Admin routes
router.post('/', authenticateJWT, isAdmin, createSession);
router.put('/:id', authenticateJWT, isAdmin, updateSession);
// Permanent removal is destructive — super-admin only
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteSession);

export default router;
