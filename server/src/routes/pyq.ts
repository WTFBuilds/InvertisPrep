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

// Public routes
router.get('/', getPYQs);
router.post('/:id/download', trackDownload);
router.post('/:id/view', trackView);

// Admin routes
router.post('/upload', authenticateJWT, isAdmin, upload.single('pdf'), uploadPYQ);
router.get('/all', authenticateJWT, isAdmin, getAllPYQs);
router.delete('/:id', authenticateJWT, isAdmin, deletePYQ);

// Super admin routes
router.patch('/:id/verify', authenticateJWT, isSuperAdmin, verifyPYQ);

export default router;
