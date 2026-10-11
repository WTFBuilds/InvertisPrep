import { Router } from 'express';
import jwt from 'jsonwebtoken';
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

// Resolve the caller when a token is present, without ever blocking the public
// listing — search events in the activity trail need the user id. The route
// itself stays public; guests simply aren't attributed.
const attachOptionalUser = (req, _res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) req.user = { _id: decoded.id };
    }
  } catch {
    // Anonymous or expired token — listing remains public
  }
  next();
};

// Specific routes (must come before parameter routes)
router.get('/', attachOptionalUser, getPYQs);
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