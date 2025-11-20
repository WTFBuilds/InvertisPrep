import { Request, Response } from 'express';
import { Department } from '../models/Department.js';
import { Branch } from '../models/Branch.js';

// Get all departments (public)
export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create department (admin only)
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, displayName, icon, description } = req.body;

    if (!id || !name || !displayName || !description) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const exists = await Department.findOne({ id });
    if (exists) {
      res.status(400).json({ success: false, message: 'Department with this ID already exists' });
      return;
    }

    const department = await Department.create({
      id,
      name,
      displayName,
      icon: icon || '🎓',
      description,
      isActive: true,
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update department (admin only)
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const department = await Department.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete department (admin only)
export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Soft delete
    const department = await Department.findOneAndUpdate(
      { id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get branches by department (public)
export const getBranchesByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;

    const branches = await Branch.find({ departmentId, isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
