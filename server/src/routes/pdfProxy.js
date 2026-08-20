import { Router } from 'express';
import { getJobStatus } from '../services/pdfServiceClient.js';
import { authenticateJWT } from '../middleware/auth.js';
import { readLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Proxy endpoint to check PDF job status
 * GET /api/pdf-proxy/jobs/:jobId
 */
router.get('/jobs/:jobId', readLimiter, authenticateJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Only return result if job belongs to this user (or user is admin)
    if (job.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this job' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('PDF proxy job status error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job status' });
  }
});

export default router;