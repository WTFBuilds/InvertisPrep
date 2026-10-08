import { Router } from 'express';
import {
  uploadPYQ,
  uploadPYQPublic,
  getDailyUploadCount,
  getPYQs,
  getAllPYQs,
  trackDownload,
  trackView,
  verifyPYQ,
  updatePYQ,
  deletePYQ,
} from '../controllers/pyqController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Specific routes (must come before parameter routes)
router.get('/', getPYQs);
router.get('/upload-count', authenticateJWT, getDailyUploadCount);
// Paper permissions gate every staff action on this service
router.post('/upload', authenticateJWT, requirePermission('papers.upload'), uploadLimiter, upload.single('pdf'), uploadPYQ);
router.post('/upload-public', authenticateJWT, uploadLimiter, upload.single('pdf'), uploadPYQPublic);
// Staff with papers.view can list the full paper set (admin panel + SRT review)
router.get('/all', authenticateJWT, requirePermission('papers.view'), getAllPYQs);

// Parameter routes
router.post('/:id/download', authenticateJWT, trackDownload);
router.post('/:id/view', authenticateJWT, trackView);
router.patch('/:id/verify', authenticateJWT, requirePermission('papers.verify'), verifyPYQ);
router.put('/:id', authenticateJWT, requirePermission('papers.delete'), updatePYQ);
router.delete('/:id', authenticateJWT, requirePermission('papers.delete'), deletePYQ);

export default router;