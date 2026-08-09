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
import { authenticateJWT, isAdmin, isSuperAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Specific routes (must come before parameter routes)
router.get('/', getPYQs);
router.get('/upload-count', authenticateJWT, getDailyUploadCount);
router.post('/upload', authenticateJWT, isAdmin, uploadLimiter, upload.single('pdf'), uploadPYQ);
router.post('/upload-public', authenticateJWT, uploadLimiter, upload.single('pdf'), uploadPYQPublic);
router.get('/all', authenticateJWT, isAdmin, getAllPYQs);

// Parameter routes with actions
router.post('/:id/download', trackDownload);
router.post('/:id/view', trackView);
router.patch('/:id/verify', authenticateJWT, isSuperAdmin, verifyPYQ);
router.put('/:id', authenticateJWT, isAdmin, updatePYQ);
router.delete('/:id', authenticateJWT, isAdmin, deletePYQ);

export default router;
