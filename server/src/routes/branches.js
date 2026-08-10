import { Router } from 'express';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAllBranches);

// Admin routes
router.post('/', authenticateJWT, isAdmin, createBranch);
router.put('/:id', authenticateJWT, isAdmin, updateBranch);
router.delete('/:id', authenticateJWT, isAdmin, deleteBranch);

export default router;
