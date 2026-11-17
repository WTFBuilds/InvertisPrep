import express from 'express';
import {
  submitApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  getStats,
  getMyApplications,
} from '../controllers/careerController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Public: Submit application (auth required to associate with user)
router.post('/apply', authenticateJWT, submitApplication);

// Staff: Dashboard stats
router.get('/applications/stats', authenticateJWT, requirePermission('careers.view'), getStats);

// Staff: List applications with filters/pagination
router.get('/applications', authenticateJWT, requirePermission('careers.view'), getApplications);

// Applicant: own submissions for status display (must precede /applications/:id)
router.get('/applications/me', authenticateJWT, getMyApplications);

// Staff: Get single application detail
router.get('/applications/:id', authenticateJWT, requirePermission('careers.view'), getApplication);

// Staff: Update application status/notes
router.patch('/applications/:id', authenticateJWT, requirePermission('careers.manage'), updateApplication);

// Staff: Delete application
router.delete('/applications/:id', authenticateJWT, requirePermission('careers.manage'), deleteApplication);

export default router;