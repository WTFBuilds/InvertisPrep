import { Request, Response } from 'express';
import { Department, Branch } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/departments
 * @desc    Get all active departments
 * @access  Public
 */
export const getAllDepartments = asyncHandler(
  async (_req: Request, res: Response) => {
    const departments = await Department.find({ isActive: true })
      .select('-__v')
      .sort({ name: 1 });

    res.json({ 
      success: true,
      departments 
    });
  }
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department by ID
 * @access  Public
 */
export const getDepartmentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const department = await Department.findOne({ id, isActive: true })
      .select('-__v');

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json({ 
      success: true,
      department 
    });
  }
);

/**
 * @route   GET /api/departments/:departmentId/branches
 * @desc    Get all branches for a department
 * @access  Public
 */
export const getBranchesByDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const { departmentId } = req.params;

    // Verify department exists
    const department = await Department.findOne({
      id: departmentId,
      isActive: true,
    });

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    const branches = await Branch.find({
      departmentId,
      isActive: true,
    })
      .select('-__v')
      .sort({ name: 1 });

    res.json({ 
      success: true,
      branches 
    });
  }
);
