import { Router } from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import {
  uploadSyllabus,
  getSyllabus,
  deleteSyllabus,
  getAllSyllabus,
} from '../controllers/syllabusController.js';

const router = Router();

router.get('/all', getAllSyllabus);
router.get('/', getSyllabus);
router.post('/upload', authenticateJWT, isAdmin, uploadLimiter, upload.single('pdf'), uploadSyllabus);
router.delete('/:id', authenticateJWT, isAdmin, deleteSyllabus);

export default router;
