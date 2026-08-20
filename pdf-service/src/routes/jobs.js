import { Router } from 'express';
import { createJob, getJob, listJobs } from '../controllers/jobController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { readLimiter, writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Internal service endpoints (require X-Service-Token header)
router.post('/', writeLimiter, createJob);
router.get('/', readLimiter, authenticateJWT, listJobs);
router.get('/:id', readLimiter, authenticateJWT, getJob);

export default router;