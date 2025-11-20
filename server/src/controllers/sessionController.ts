import { Request, Response } from 'express';
import { Session } from '../models/Session.js';

// Get all sessions (public)
export const getSessions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await Session.find({ isActive: true }).sort({ startYear: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create session (admin only)
export const createSession = async (req: Request, res: Response): Promise<void> => {
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

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update session (admin only)
export const updateSession = async (req: Request, res: Response): Promise<void> => {
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

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete session (admin only)
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await Session.findOneAndUpdate(
      { id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
