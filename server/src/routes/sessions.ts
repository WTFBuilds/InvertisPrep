import express from 'express';
import {
  getAllSessions,
  getSessionById,
} from '../controllers/sessionController.js';

const router = express.Router();

// GET /api/sessions - Get all sessions
router.get('/', getAllSessions);

// GET /api/sessions/:id - Get single session
router.get('/:id', getSessionById);

export default router;
