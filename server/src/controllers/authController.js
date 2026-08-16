import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { verifyGoogleToken } from '../services/googleAuthService.js';
import { authService } from '../services/authService.js';

// Centralised user shape so every response stays consistent
const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  picture: user.picture,
  studentId: user.studentId || '',
  phoneNumber: user.phoneNumber || '',
  course: user.course || '',
  followers: user.followers || [],
  following: user.following || [],
  qcoins: user.qcoins ?? 0,
  freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
});


// Cookie options for the refresh token.
// In production the client (Vercel) and API (Render) are on different sites, so the
// cookie must be SameSite=None + Secure to travel with cross-site requests.
const refreshCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

export const login = async (req, res) => {
  try {
    // Coerce to plain strings — blocks NoSQL operator injection (e.g. {"$gt": ""})
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const rememberMe = req.body.rememberMe === true;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens via authService (with Redis session)
    const { accessToken, refreshToken } = await authService.login(user, rememberMe);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshCookieOptions(
      rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    ));

    // Update session metadata
    await authService.updateSessionMeta(
      user._id.toString(),
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      token: accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      details: process.env.NODE_ENV === 'development'
        ? `${error?.name || 'Error'}: ${error?.message || 'unknown'}`
        : undefined
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Google token is required' });
      return;
    }

    // Verify the Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(token);
    } catch (tokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired Google token'
      });
      return;
    }

    if (!googleUser || !googleUser.email) {
      res.status(400).json({ success: false, message: 'Invalid Google user data' });
      return;
    }

    if (!googleUser.email_verified) {
      res.status(400).json({ success: false, message: 'Email not verified with Google' });
      return;
    }

    // Check if user exists and handle concurrency with proper error handling
    let user;
    try {
      user = await User.findOne({ email: googleUser.email });

      // If user doesn't exist, create a new student account
      if (!user) {
        user = await User.create({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name || 'User',
          picture: googleUser.picture || null,
          role: 'student', // Default role for Google OAuth users
          isActive: true,
          lastLogin: new Date(),
        });
      } else if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Your account has been disabled' });
        return;
      } else {
        // Update last login, picture, and googleId if not set
        user.lastLogin = new Date();
        if (googleUser.picture) {
          user.picture = googleUser.picture;
        }
        if (!user.googleId && googleUser.sub) {
          user.googleId = googleUser.sub;
        }
        await user.save();
      }
    } catch (dbError) {
      if (dbError.code === 11000) {
        // Duplicate key error - race condition where user was created between find and create
        user = await User.findOne({ email: googleUser.email });
        if (user) {
          user.lastLogin = new Date();
          if (!user.googleId && googleUser.sub) {
            user.googleId = googleUser.sub;
          }
          await user.save();
        } else {
          throw dbError;
        }
      } else {
        throw dbError;
      }
    }

    if (!user) {
      res.status(500).json({ success: false, message: 'Failed to create or retrieve user' });
      return;
    }

    // Also create Redis session for consistency
    const { accessToken, refreshToken } = await authService.login(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshCookieOptions(7 * 24 * 60 * 60 * 1000));

    await authService.updateSessionMeta(
      user._id.toString(),
      req.headers['user-agent'],
      req.ip
    );

    res.json({
      success: true,
      token: accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Google login error:', error);
    const detail = `${error?.name || 'Error'}: ${error?.message || 'unknown'}`;
    res.status(500).json({
      success: false,
      // In development, surface the actual cause so it's visible in the client
      message: process.env.NODE_ENV === 'development'
        ? `Google login failed — ${detail}`
        : 'Server error during Google login',
      details: process.env.NODE_ENV === 'development' ? detail : undefined
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await authService.revokeSession(userId);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    const tokens = await authService.refreshAccessToken(refreshToken);
    
    if (!tokens) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      success: true,
      token: tokens.accessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, studentId, phoneNumber, course } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name !== undefined) user.name = name;
    if (studentId !== undefined) user.studentId = studentId;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (course !== undefined) user.course = course;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};
