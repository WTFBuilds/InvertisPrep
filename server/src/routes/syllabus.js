import { Router } from 'express';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
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
// Staff (incl. SRT) can upload syllabus; only admin/super-admin can delete
router.post('/upload', authenticateJWT, requirePermission('syllabus.upload'), uploadLimiter, upload.single('pdf'), uploadSyllabus);
router.delete('/:id', authenticateJWT, requirePermission('syllabus.manage'), deleteSyllabus);

export default router;
