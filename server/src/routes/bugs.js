import express from 'express';
import { createBug, getBugs, updateBugStatus, deleteBug } from '../controllers/bugController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';
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
router.get('/', authenticateJWT, isAdmin, getBugs);
router.patch('/:id', authenticateJWT, isAdmin, updateBugStatus);
router.delete('/:id', authenticateJWT, isAdmin, deleteBug);

export default router;
