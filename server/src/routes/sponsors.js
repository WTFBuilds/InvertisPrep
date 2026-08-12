import { Router } from 'express';
import {
  getSponsors,
  getAllSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../controllers/sponsorController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getSponsors);

// Admin routes
router.get('/all', authenticateJWT, isAdmin, getAllSponsors);
router.post('/', authenticateJWT, isAdmin, createSponsor);
router.put('/:id', authenticateJWT, isAdmin, updateSponsor);
router.delete('/:id', authenticateJWT, isAdmin, deleteSponsor);

export default router;
