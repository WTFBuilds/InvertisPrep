import { Router } from 'express';
import {
  createReport,
  getReports,
  updateReportStatus,
} from '../controllers/reportController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT, createReport);
router.get('/', authenticateJWT, isAdmin, getReports);
router.patch('/:id', authenticateJWT, isAdmin, updateReportStatus);

export default router;
