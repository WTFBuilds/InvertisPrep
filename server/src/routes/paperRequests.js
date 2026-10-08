import { Router } from 'express';
import {
  createRequest,
  checkExistingPaper,
  listRequests,
  updateStatus,
  deleteRequest,
} from '../controllers/paperRequestController.js';
import { authenticateJWT, requirePermission, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Any logged-in user can check whether a paper already exists before requesting
router.get('/check', authenticateJWT, checkExistingPaper);

// Any logged-in user can request a paper
router.post('/', authenticateJWT, createRequest);

// Staff (SRT, admin, super-admin) can see who requested what
router.get('/', authenticateJWT, requirePermission('requests.view'), listRequests);

// Triage is for admin + super-admin; SRT stays read-only
router.patch('/:id/status', authenticateJWT, requirePermission('requests.manage'), updateStatus);
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteRequest);

export default router;
