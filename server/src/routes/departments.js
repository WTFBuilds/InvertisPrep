import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getBranchesByDepartment,
} from '../controllers/departmentController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getDepartments);
router.get('/:departmentId/branches', getBranchesByDepartment);
router.get('/:id', getDepartmentById);

// Admin routes
router.post('/', authenticateJWT, requirePermission('departments.manage'), createDepartment);
router.put('/:id', authenticateJWT, requirePermission('departments.manage'), updateDepartment);
router.delete('/:id', authenticateJWT, requirePermission('departments.manage'), deleteDepartment);

export default router;
