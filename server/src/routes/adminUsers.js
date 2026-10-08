import { Router } from 'express';
import {
  listUsers,
  getUserStats,
  getUserDetail,
  updateRole,
  updateStatus,
  deleteUser,
  createUser,
} from '../controllers/adminUserController.js';
import { authenticateJWT, requirePermission, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Create a new staff/user account — super-admin only
router.post('/', authenticateJWT, isSuperAdmin, createUser);

// Read endpoints: any role with users.view (built-in admin, or custom role)
router.get('/', authenticateJWT, requirePermission('users.view'), listUsers);
router.get('/stats', authenticateJWT, requirePermission('users.view'), getUserStats);
router.get('/:id', authenticateJWT, requirePermission('users.view'), getUserDetail);

// Write endpoints: only super-admin can create roles / ban-unban / delete
router.patch('/:id/role', authenticateJWT, isSuperAdmin, updateRole);
router.patch('/:id/status', authenticateJWT, isSuperAdmin, updateStatus);
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteUser);

export default router;
