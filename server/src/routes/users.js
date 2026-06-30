import { Router } from 'express';
import { getUserProfile, followUser, unfollowUser } from '../controllers/userController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/:id', getUserProfile);
router.post('/:id/follow', followUser);
router.post('/:id/unfollow', unfollowUser);

export default router;
