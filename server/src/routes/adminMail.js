import { Router } from 'express';
import {
  getMailSettings,
  updateWelcomeSettings,
  listAutomailLog,
  listInbox,
  triggerSync,
  getInboundMail,
  composeRecipients,
  sendCampaign,
  listUnifiedLogs,
  getNotifySettingsState,
  updateNotifySettings,
  uploadBanner,
} from '../controllers/adminMailController.js';
import { authenticateJWT, requirePermission, isSuperAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Read endpoints: any role with emails.view can see automail log, mailbox, logs.
router.get('/automail', authenticateJWT, requirePermission('emails.view'), listAutomailLog);
router.get('/mailbox', authenticateJWT, requirePermission('emails.view'), listInbox);
router.post('/mailbox/sync', authenticateJWT, requirePermission('emails.view'), triggerSync);
router.get('/mailbox/:id', authenticateJWT, requirePermission('emails.view'), getInboundMail);
router.get('/logs', authenticateJWT, requirePermission('emails.view'), listUnifiedLogs);

// Notification toggles (paper-request ack + fulfillment). Read: emails.view;
// write: super-admin (or emails.manage when granted).
router.get('/notifications', authenticateJWT, requirePermission('emails.view'), getNotifySettingsState);
router.put('/notifications', authenticateJWT, isSuperAdmin, updateNotifySettings);

// Compose preview (recipient count) — readable by emails.view
router.get('/compose/recipients', authenticateJWT, requirePermission('emails.view'), composeRecipients);

// Write endpoints: sending campaigns + editing the welcome template are
// powerful actions — super-admin only (or a custom role later granted
// emails.manage).
router.post('/compose/send', authenticateJWT, isSuperAdmin, sendCampaign);
router.post('/compose/upload-banner', authenticateJWT, isSuperAdmin, uploadLimiter, uploadImage.single('image'), uploadBanner);
router.get('/settings', authenticateJWT, requirePermission('emails.view'), getMailSettings);
router.put('/settings', authenticateJWT, isSuperAdmin, updateWelcomeSettings);

export default router;