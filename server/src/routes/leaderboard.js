import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { getLeaderboard, getMyStats } from '../controllers/leaderboardController.js';

const router = Router();

// Get general rankings
router.get('/', getLeaderboard);

// Get authenticated user's stats and badges
router.get('/me', authenticateJWT, getMyStats);

export default router;
