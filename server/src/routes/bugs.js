import express from 'express';
import { createBug, getBugs, updateBugStatus, deleteBug, myBugs, replyToBug } from '../controllers/bugController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to extract user info optionally (if logged in) without blocking the request if not authenticated
const optionalAuthenticateJWT = (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      token = token.trim();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore error and proceed without req.user
  }
  next();
};

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
