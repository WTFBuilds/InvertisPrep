import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

// Get all sessions (public)
export const getSessions = async (_req, res) => {
  try {
    const cacheKey = 'sessions:all';
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json({ success: true, data: cached });
    }
    
    console.log(`[Cache] MISS for ${cacheKey}`);
    const sessions = await Session.find({ isActive: true }).sort({ startYear: -1 }).lean();
    setCache(cacheKey, sessions, 5 * 60 * 1000); // 5 minutes TTL
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create session (admin only)
export const createSession = async (req, res) => {
  try {
    const { id, name, startYear, endYear } = req.body;

    if (!id || !name || !startYear || !endYear) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const exists = await Session.findOne({ id });
    if (exists) {
      res.status(400).json({ success: false, message: 'Session with this ID already exists' });
      return;
    }

    const session = await Session.create({
      id,
      name,
      startYear,
      endYear,
      isActive: true,
    });

    delCache('sessions:all');
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update session (admin only)
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await Session.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    delCache('sessions:all');

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete session (admin only)
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    // The client may pass either the Mongo _id or the business id
    // (e.g. "2024-25") — match whichever form arrives.
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
    const session = await Session.findOneAndUpdate(
      query,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    delCache('sessions:all');

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
