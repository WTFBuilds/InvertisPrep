import { Router } from 'express';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAllBranches);

// Admin routes
router.post('/', authenticateJWT, requirePermission('branches.manage'), createBranch);
router.put('/:id', authenticateJWT, requirePermission('branches.manage'), updateBranch);
router.delete('/:id', authenticateJWT, requirePermission('branches.manage'), deleteBranch);

export default router;
