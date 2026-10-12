import { Router } from 'express';
import {
  createRequest,
  checkExistingPaper,
  listRequests,
  updateStatus,
  deleteRequest,
  myRequests,
  replyToRequest,
} from '../controllers/paperRequestController.js';
import { authenticateJWT, requirePermission, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Any logged-in user can check whether a paper already exists before requesting
router.get('/check', authenticateJWT, checkExistingPaper);

// A student's own paper requests — "My Requests" on their profile
router.get('/mine', authenticateJWT, myRequests);

// Unread staff replies across the student's tickets — powers the dot on the
// profile dropdown (paper requests + bug reports + paper reports combined).
router.get('/unread-count', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;

    const [paperRequests, bugs, reports] = await Promise.all([
      import('../models/PaperRequest.js').then(({ PaperRequest }) =>
        PaperRequest.countDocuments({
          requestedBy: userId,
          'messages.0': { $exists: true },
          $expr: {
            $and: [
              { $ne: [{ $arrayElemAt: ['$messages.senderRole', -1] }, 'student'] },
              { $ne: [{ $arrayElemAt: ['$messages.sender', -1] }, userId] },
            ],
          },
        })
      ),
      import('../models/Bug.js').then(({ Bug }) =>
        Bug.countDocuments({
          reportedBy: userId,
          'messages.0': { $exists: true },
          $expr: {
            $and: [
              { $ne: [{ $arrayElemAt: ['$messages.senderRole', -1] }, 'student'] },
              { $ne: [{ $arrayElemAt: ['$messages.sender', -1] }, userId] },
            ],
          },
        })
      ),
      import('../models/Report.js').then(({ Report }) =>
        Report.countDocuments({
          reportedBy: userId,
          'messages.0': { $exists: true },
          $expr: {
            $and: [
              { $ne: [{ $arrayElemAt: ['$messages.senderRole', -1] }, 'student'] },
              { $ne: [{ $arrayElemAt: ['$messages.sender', -1] }, userId] },
            ],
          },
        })
      ),
    ]);

    res.json({ success: true, data: { unread: paperRequests + bugs + reports } });
  } catch (error) {
    console.error('Unread replies count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reply to a paper-request ticket thread (own request as student, any as staff)
router.post('/:id/reply', authenticateJWT, replyToRequest);

// Any logged-in user can request a paper
router.post('/', authenticateJWT, createRequest);

// Staff (SRT, admin, super-admin) can see who requested what
router.get('/', authenticateJWT, requirePermission('requests.view'), listRequests);

// Triage is for admin + super-admin; SRT stays read-only
router.patch('/:id/status', authenticateJWT, requirePermission('requests.manage'), updateStatus);
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteRequest);

export default router;
