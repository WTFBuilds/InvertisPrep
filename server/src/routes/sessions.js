import { Router } from 'express';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getSessions);

// Admin routes
router.post('/', authenticateJWT, isAdmin, createSession);
router.put('/:id', authenticateJWT, isAdmin, updateSession);
router.delete('/:id', authenticateJWT, isAdmin, deleteSession);

export default router;
