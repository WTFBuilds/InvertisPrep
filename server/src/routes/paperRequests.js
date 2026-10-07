import { Router } from 'express';
import {
  createRequest,
  listRequests,
  updateStatus,
  deleteRequest,
} from '../controllers/paperRequestController.js';
import { authenticateJWT, isStaff, isAdmin, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Any logged-in user can request a paper
router.post('/', authenticateJWT, createRequest);

// Staff (SRT, admin, super-admin) can see who requested what
router.get('/', authenticateJWT, isStaff, listRequests);

// Triage is for admin + super-admin; SRT stays read-only
router.patch('/:id/status', authenticateJWT, isAdmin, updateStatus);
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteRequest);

export default router;
