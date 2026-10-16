import { Router } from 'express';
import {
  getAdminSettings,
  updateInstagramPopupSetting,
} from '../controllers/settingsController.js';
import { authenticateJWT, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Super-admin only settings routes
router.get('/', authenticateJWT, isSuperAdmin, getAdminSettings);
router.put('/instagram-popup', authenticateJWT, isSuperAdmin, updateInstagramPopupSetting);

export default router;
