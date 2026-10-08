import { Router } from 'express';
import {
  createReport,
  getReports,
  updateReportStatus,
} from '../controllers/reportController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT, createReport);
// Staff (incl. SRT) can view reports; only admin/super-admin can resolve them
router.get('/', authenticateJWT, requirePermission('reports.view'), getReports);
router.patch('/:id', authenticateJWT, requirePermission('reports.manage'), updateReportStatus);

export default router;
