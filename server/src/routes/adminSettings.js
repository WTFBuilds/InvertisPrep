import { Router } from 'express';
import {
  getAdminSettings,
  updateInstagramPopupSetting,
  updateWelcomeEmailSetting,
  updatePaperRequestAckSetting,
  updatePaperRequestFulfilledSetting,
  updateCareerApplicationAckSetting,
} from '../controllers/settingsController.js';
import { authenticateJWT, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Super-admin only settings routes
router.get('/', authenticateJWT, isSuperAdmin, getAdminSettings);
router.put('/instagram-popup', authenticateJWT, isSuperAdmin, updateInstagramPopupSetting);

// Email feature toggles
router.put('/welcome-email', authenticateJWT, isSuperAdmin, updateWelcomeEmailSetting);
router.put('/paper-request-ack', authenticateJWT, isSuperAdmin, updatePaperRequestAckSetting);
router.put('/paper-request-fulfilled', authenticateJWT, isSuperAdmin, updatePaperRequestFulfilledSetting);
router.put('/career-application-ack', authenticateJWT, isSuperAdmin, updateCareerApplicationAckSetting);

export default router;
