import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getBranchesByDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

// GET /api/departments - Get all departments
router.get('/', getAllDepartments);

// GET /api/departments/:id - Get single department
router.get('/:id', getDepartmentById);

// GET /api/departments/:departmentId/branches - Get branches by department
router.get('/:departmentId/branches', getBranchesByDepartment);

export default router;
