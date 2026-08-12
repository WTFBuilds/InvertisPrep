import { Router } from 'express';
import {
  createReport,
  getReports,
  updateReportStatus,
} from '../controllers/reportController.js';
import { authenticateJWT, isAdmin, isStaff } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT, createReport);
// Staff (incl. SRT) can view reports; only admin/super-admin can resolve them
router.get('/', authenticateJWT, isStaff, getReports);
router.patch('/:id', authenticateJWT, isAdmin, updateReportStatus);

export default router;
