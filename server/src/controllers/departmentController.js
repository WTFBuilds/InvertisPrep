import mongoose from 'mongoose';
import { Department } from '../models/Department.js';
import { Branch } from '../models/Branch.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

// Resolve a department by ObjectId OR slug (e.g. "btech") — slugs power the
// public /pyq/<slug> URLs. Returns null when neither matches.
const findDepartmentByIdOrSlug = async (idOrSlug) => {
  if (mongoose.isValidObjectId(idOrSlug)) {
    return Department.findById(idOrSlug).lean();
  }
  return Department.findOne({ id: idOrSlug }).lean();
};

// Get single department by ID or slug (public)
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `department:${id}`;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json({ success: true, data: cached });
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const department = await findDepartmentByIdOrSlug(id);
    if (!department || !department.isActive) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }
    setCache(cacheKey, department, 5 * 60 * 1000); // 5 minutes TTL
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all departments (public)
export const getDepartments = async (_req, res) => {
  try {
    const cacheKey = 'departments:all';
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json({ success: true, data: cached });
    }
    
    console.log(`[Cache] MISS for ${cacheKey}`);
    const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
    setCache(cacheKey, departments, 5 * 60 * 1000); // 5 minutes TTL
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create department (admin only)
export const createDepartment = async (req, res) => {
  try {
    const { id, name, displayName, icon, description } = req.body;

    if (!id || !name || !displayName || !description) {
      const missing = [];
      if (!id) missing.push('id');
      if (!name) missing.push('name');
      if (!displayName) missing.push('displayName');
      if (!description) missing.push('description');
      
      res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
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

    delCache('departments:all');
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update department (admin only)
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Match by _id (ObjectId) when possible, else by the slug `id` field
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { id };

    const department = await Department.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    delCache('departments:all');
    delCache(`department:${id}`);

    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete department (admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Match by _id (ObjectId) when possible, else by the slug `id` field
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { id };

    // Soft delete
    const department = await Department.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    delCache('departments:all');
    delCache(`department:${id}`);
    delCache(`branches:${id}`);

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get branches by department (public)
export const getBranchesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Branches store the department's ObjectId — resolve slugs to it first
    let deptObjectId = departmentId;
    if (!mongoose.isValidObjectId(departmentId)) {
      const department = await Department.findOne({ id: departmentId }).lean();
      if (!department || !department.isActive) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }
      deptObjectId = department._id.toString();
    }

    const cacheKey = `branches:${deptObjectId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json({ success: true, data: cached });
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const branches = await Branch.find({ departmentId: deptObjectId, isActive: true }).sort({ name: 1 }).lean();
    setCache(cacheKey, branches, 5 * 60 * 1000); // 5 minutes TTL
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches by department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
