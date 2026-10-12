import { Router } from 'express';
import {
  createReport,
  getReports,
  updateReportStatus,
  myReports,
  replyToReport,
} from '../controllers/reportController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT, createReport);
// The reporter's own reports — under "My Requests"
router.get('/mine', authenticateJWT, myReports);
// Reply to a report ticket thread (own report as reporter, any as staff)
router.post('/:id/reply', authenticateJWT, replyToReport);
// Staff (incl. SRT) can view reports; only admin/super-admin can resolve them
router.get('/', authenticateJWT, requirePermission('reports.view'), getReports);
router.patch('/:id', authenticateJWT, requirePermission('reports.manage'), updateReportStatus);

export default router;
