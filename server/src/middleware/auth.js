import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.originalUrl}`);
      res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
      return;
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Trim any accidental whitespace or newlines (common in mobile app injections)
    token = token.trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-validate against the DB on every authenticated request so that
    // role changes and account bans take effect immediately (the JWT only
    // carries a snapshot of the role from login time).
    const user = await User.findById(decoded.id)
      .select('role isActive email name picture')
      .lean();

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
      });
      return;
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture,
    };
    next();
  } catch (error) {
    console.error(`[Auth] JWT Verification failed: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'Super admin access required' });
    return;
  }

  next();
};
