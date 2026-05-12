import { Router } from 'express';
import {
  uploadPYQ,
  getPYQs,
  getAllPYQs,
  trackDownload,
  trackView,
  verifyPYQ,
  deletePYQ,
} from '../controllers/pyqController.js';
import { authenticateJWT, isAdmin, isSuperAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Specific routes (must come before parameter routes)
router.get('/', getPYQs);
router.post('/upload', authenticateJWT, isAdmin, upload.single('pdf'), uploadPYQ);
router.get('/all', authenticateJWT, isAdmin, getAllPYQs);

// Parameter routes with actions
router.post('/:id/download', trackDownload);
router.post('/:id/view', trackView);
router.patch('/:id/verify', authenticateJWT, isSuperAdmin, verifyPYQ);
router.delete('/:id', authenticateJWT, isAdmin, deletePYQ);

export default router;
