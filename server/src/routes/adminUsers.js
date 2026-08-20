import { Router } from 'express';
import {
  listUsers,
  getUserStats,
  getUserDetail,
  updateRole,
  updateStatus,
} from '../controllers/adminUserController.js';
import { authenticateJWT, isAdmin, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Read endpoints: any admin (or super-admin) can list/search/view users
router.get('/', authenticateJWT, isAdmin, listUsers);
router.get('/stats', authenticateJWT, isAdmin, getUserStats);
router.get('/:id', authenticateJWT, isAdmin, getUserDetail);

// Write endpoints: only super-admin can change roles / ban-unban accounts
router.patch('/:id/role', authenticateJWT, isSuperAdmin, updateRole);
router.patch('/:id/status', authenticateJWT, isSuperAdmin, updateStatus);

export default router;
