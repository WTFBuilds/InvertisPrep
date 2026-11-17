import express from 'express';
import { createBug, getBugs, updateBugStatus, deleteBug, myBugs, replyToBug } from '../controllers/bugController.js';
import { authenticateJWT, optionalAuthenticateJWT, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuthenticateJWT, createBug);
// The reporter's own bug reports — support tickets under "My Requests"
router.get('/mine', authenticateJWT, myBugs);
// Reply to a bug ticket thread (own report as reporter, any as staff)
router.post('/:id/reply', authenticateJWT, replyToBug);
// Staff (incl. SRT) can view bugs; only admin/super-admin can update status or delete
router.get('/', authenticateJWT, requirePermission('bugs.view'), getBugs);
router.patch('/:id', authenticateJWT, requirePermission('bugs.manage'), updateBugStatus);
router.delete('/:id', authenticateJWT, requirePermission('bugs.manage'), deleteBug);

export default router;
