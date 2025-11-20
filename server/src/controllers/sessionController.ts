import { Request, Response } from 'express';
import { Session } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/sessions
 * @desc    Get all active sessions
 * @access  Public
 */
export const getAllSessions = asyncHandler(
  async (req: Request, res: Response) => {
    const sessions = await Session.find({ isActive: true })
      .select('-__v')
      .sort({ startYear: -1 }); // Newest first

    res.json({ 
      success: true,
      sessions 
    });
  }
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get single session by ID
 * @access  Public
 */
export const getSessionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const session = await Session.findOne({ id, isActive: true })
      .select('-__v');

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ 
      success: true,
      session 
    });
  }
);
