import { Router } from 'express';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { fillFromJD, rephrase, enhanceSection } from '../controllers/aiController.js';

const router = Router();

// AI resume endpoints — gated on the 'ai.resume' permission so the
// feature is visible to everyone but only usable by roles a
// super-admin has granted it to. The per-user daily limiter
// (aiLimiter) caps how many calls each account can make so
// OpenRouter credits can't be drained.
router.use(authenticateJWT, requirePermission('ai.resume'), aiLimiter);

router.post('/resume/fill-from-jd', fillFromJD);
router.post('/resume/rephrase', rephrase);
router.post('/resume/enhance-section', enhanceSection);

export default router;
