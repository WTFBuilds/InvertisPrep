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
import { authenticateJWT, isAdmin, isStaff } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Specific routes (must come before parameter routes)
router.get('/', getPYQs);
router.get('/upload-count', authenticateJWT, getDailyUploadCount);
// Staff (admin, super-admin, SRT) can upload papers
router.post('/upload', authenticateJWT, isStaff, uploadLimiter, upload.single('pdf'), uploadPYQ);
router.post('/upload-public', authenticateJWT, uploadLimiter, upload.single('pdf'), uploadPYQPublic);
// Staff can view the full paper list (admin panel + SRT review)
router.get('/all', authenticateJWT, isStaff, getAllPYQs);

// Parameter routes
router.post('/:id/download', authenticateJWT, trackDownload);
router.post('/:id/view', authenticateJWT, trackView);
// Staff (incl. SRT) can verify papers; SRT cannot edit/delete
router.patch('/:id/verify', authenticateJWT, isStaff, verifyPYQ);
router.put('/:id', authenticateJWT, isAdmin, updatePYQ);
router.delete('/:id', authenticateJWT, isAdmin, deletePYQ);

export default router;