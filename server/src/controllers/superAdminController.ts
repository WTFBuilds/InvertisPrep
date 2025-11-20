import { Request, Response } from 'express';
import { Department, Branch, Session } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  CreateBranchDTO,
  UpdateBranchDTO,
  CreateSessionDTO,
  UpdateSessionDTO,
} from '../types/index.js';

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

/**
 * @route   POST /api/super-admin/departments
 * @desc    Create new department
 * @access  Private (Super Admin)
 */
export const createDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, name, displayName, icon, description } = req.body as CreateDepartmentDTO;

    // Check if department with this ID already exists
    const existingDept = await Department.findOne({ id });
    if (existingDept) {
      res.status(400).json({ error: 'Department with this ID already exists' });
      return;
    }

    const department = await Department.create({
      id,
      name,
      displayName,
      icon,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  }
);

/**
 * @route   PUT /api/super-admin/departments/:id
 * @desc    Update department
 * @access  Private (Super Admin)
 */
export const updateDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as UpdateDepartmentDTO;

    const department = await Department.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      department,
    });
  }
);

/**
 * @route   DELETE /api/super-admin/departments/:id
 * @desc    Deactivate department (soft delete)
 * @access  Private (Super Admin)
 */
export const deleteDepartment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const department = await Department.findOneAndUpdate(
      { id },
      { isActive: false },
      { new: true }
    );

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Department deactivated successfully',
    });
  }
);

// ============================================
// BRANCH MANAGEMENT
// ============================================

/**
 * @route   POST /api/super-admin/branches
 * @desc    Create new branch
 * @access  Private (Super Admin)
 */
export const createBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, name, displayName, departmentId, semesters, description } =
      req.body as CreateBranchDTO;

    // Verify department exists
    const department = await Department.findOne({ id: departmentId });
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    // Check if branch with this ID already exists for this department
    const existingBranch = await Branch.findOne({ id, departmentId });
    if (existingBranch) {
      res.status(400).json({
        error: 'Branch with this ID already exists in this department',
      });
      return;
    }

    const branch = await Branch.create({
      id,
      name,
      displayName,
      departmentId,
      semesters,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch,
    });
  }
);

/**
 * @route   PUT /api/super-admin/branches/:id
 * @desc    Update branch
 * @access  Private (Super Admin)
 */
export const updateBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { departmentId } = req.query;
    const updates = req.body as UpdateBranchDTO;

    if (!departmentId) {
      res.status(400).json({ error: 'departmentId query parameter is required' });
      return;
    }

    const branch = await Branch.findOneAndUpdate(
      { id, departmentId },
      updates,
      { new: true, runValidators: true }
    );

    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Branch updated successfully',
      branch,
    });
  }
);

/**
 * @route   DELETE /api/super-admin/branches/:id
 * @desc    Deactivate branch (soft delete)
 * @access  Private (Super Admin)
 */
export const deleteBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { departmentId } = req.query;

    if (!departmentId) {
      res.status(400).json({ error: 'departmentId query parameter is required' });
      return;
    }

    const branch = await Branch.findOneAndUpdate(
      { id, departmentId },
      { isActive: false },
      { new: true }
    );

    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Branch deactivated successfully',
    });
  }
);

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * @route   POST /api/super-admin/sessions
 * @desc    Create new session
 * @access  Private (Super Admin)
 */
export const createSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, startYear, endYear, description } = req.body as CreateSessionDTO;

    // Check if session with this ID already exists
    const existingSession = await Session.findOne({ id });
    if (existingSession) {
      res.status(400).json({ error: 'Session with this ID already exists' });
      return;
    }

    // Validate year format
    if (endYear - startYear !== 1) {
      res.status(400).json({
        error: 'Invalid session years. End year should be start year + 1',
      });
      return;
    }

    const session = await Session.create({
      id,
      startYear,
      endYear,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session,
    });
  }
);

/**
 * @route   PUT /api/super-admin/sessions/:id
 * @desc    Update session
 * @access  Private (Super Admin)
 */
export const updateSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as UpdateSessionDTO;

    // If updating years, validate them
    if (updates.startYear && updates.endYear) {
      if (updates.endYear - updates.startYear !== 1) {
        res.status(400).json({
          error: 'Invalid session years. End year should be start year + 1',
        });
        return;
      }
    }

    const session = await Session.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Session updated successfully',
      session,
    });
  }
);

/**
 * @route   DELETE /api/super-admin/sessions/:id
 * @desc    Deactivate session (soft delete)
 * @access  Private (Super Admin)
 */
export const deleteSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const session = await Session.findOneAndUpdate(
      { id },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Session deactivated successfully',
    });
  }
);
