import { authService } from '../services/authService.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.cookies?.token;

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.' 
      });
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Trim any accidental whitespace or newlines
    token = token.trim();

    const user = await authService.validateAccessToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired or is invalid. Please log in again.',
        error: process.env.NODE_ENV === 'development' ? 'Invalid token' : undefined
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth] JWT Verification failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  next();
};

// Staff = admin, super-admin, or SRT. Used for read / upload / verify access.
// Delete and edit operations must keep using isAdmin so SRT stays read-only except verify/upload.
export const isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'super-admin' &&
    req.user.role !== 'srt'
  ) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }

  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }

  next();
};