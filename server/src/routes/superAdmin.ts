import { Router } from 'express';
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createBranch,
  updateBranch,
  deleteBranch,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/superAdminController.js';
import { authenticate, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// All super admin routes require authentication and super admin role
router.use(authenticate);
router.use(isSuperAdmin);

// Department management
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Branch management
router.post('/branches', createBranch);
router.put('/branches/:id', updateBranch);
router.delete('/branches/:id', deleteBranch);

// Session management
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

export default router;
