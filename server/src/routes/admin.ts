import { Router } from 'express';
import {
  uploadPaper,
  updatePaper,
  deletePaper,
  getAllPapers,
  getStatistics,
} from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Paper management
router.post('/pyq/upload', upload.single('file'), uploadPaper);
router.put('/pyq/:id', updatePaper);
router.delete('/pyq/:id', deletePaper);
router.get('/papers', getAllPapers);

// Statistics
router.get('/statistics', getStatistics);

export default router;
