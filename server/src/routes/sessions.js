import { Router } from 'express';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { authenticateJWT, requirePermission, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getSessions);

// Admin routes
router.post('/', authenticateJWT, requirePermission('sessions.manage'), createSession);
router.put('/:id', authenticateJWT, requirePermission('sessions.manage'), updateSession);
// Permanent removal is destructive — super-admin only
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteSession);

export default router;
