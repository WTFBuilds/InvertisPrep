import { Router } from 'express';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateJWT, isAdmin);

router.get('/', getAllBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
