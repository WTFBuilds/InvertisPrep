import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const router = Router();

// Public endpoint for runtime feature toggles and flags
router.get('/public', getPublicSettings);

export default router;
