import { Branch } from '../models/Branch.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

// Get all branches (admin only)
export const getAllBranches = async (_req, res) => {
  try {
    const cacheKey = 'branches:all';
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json({ success: true, data: cached });
    }
    
    console.log(`[Cache] MISS for ${cacheKey}`);
    const branches = await Branch.find().sort({ departmentId: 1, name: 1 }).lean();
    setCache(cacheKey, branches, 5 * 60 * 1000); // 5 minutes TTL
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get all branches error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create branch (admin only)
export const createBranch = async (req, res) => {
  try {
    const { id, name, departmentId, semesters } = req.body;

    if (!id || !name || !departmentId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const exists = await Branch.findOne({ id, departmentId });
    if (exists) {
      res.status(400).json({ success: false, message: 'Branch already exists in this department' });
      return;
    }

    const branch = await Branch.create({
      id,
      name,
      departmentId,
      semesters: semesters || [1, 2, 3, 4, 5, 6, 7, 8],
      isActive: true,
    });

    delCache('branches:all');
    delCache(`branches:${departmentId}`);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update branch (admin only)
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const branch = await Branch.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });

    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    delCache('branches:all');
    delCache(`branches:${branch.departmentId}`);

    res.json({ success: true, data: branch });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete branch (admin only)
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });

    if (!branch) {
      res.status(404).json({ success: false, message: 'Branch not found' });
      return;
    }

    delCache('branches:all');
    delCache(`branches:${branch.departmentId}`);

    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
