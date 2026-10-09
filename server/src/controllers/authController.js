import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { verifyGoogleToken } from '../services/googleAuthService.js';
import { authService } from '../services/authService.js';
import { sendWelcomeEmail } from '../services/mailService.js';

// Centralised user shape so every response stays consistent
const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  roleId: user.roleId && typeof user.roleId === 'object' ? user.roleId._id : user.roleId || null,
  picture: user.picture,
  studentId: user.studentId || '',
  phoneNumber: user.phoneNumber || '',
  course: user.course || '',
  followers: user.followers || [],
  following: user.following || [],
  qcoins: user.qcoins ?? 0,
  freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
});

/**
 * Same shape, but custom-role ('staff') users also get their permission list
 * and the role's display metadata so the client can gate the admin UI. Called
 * on every endpoint that returns a user the client stores in localStorage —
 * a response missing these fields would wipe the client's permission snapshot.
 */
const formatUserWithRole = async (user) => {
  const formatted = formatUser(user);
  if (user.role !== 'staff' || !formatted.roleId) return formatted;

  try {
    const { Role } = await import('../models/Role.js');
    const role = await Role.findById(formatted.roleId).select('name label color permissions').lean();
    if (role) {
      formatted.roleId = String(role._id);
      formatted.roleMeta = { id: String(role._id), name: role.name, label: role.label, color: role.color };
      formatted.permissions = role.permissions || [];
    }
  } catch (err) {
    console.error('[Auth] Failed to load custom role:', err.message);
  }
  return formatted;
};


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
      user: await formatUserWithRole(user),
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
      user: await formatUserWithRole(user),
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
        // Welcome email for a brand-new signup. Fire-and-forget: a mail failure
        // must never block or fail the login response.
        sendWelcomeEmail(user).catch((err) =>
          console.error('[mail] welcome (google) failed:', err?.message)
        );
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
      user: await formatUserWithRole(user),
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
      user: await formatUserWithRole(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};

// ── Email/password student flow ─────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Route helper for the login page: does this email have an account, and is it
 * linked to Google sign-in? Lets the UI decide between the password step, the
 * registration step, or a "continue with Google" nudge.
 */
export const checkEmail = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ success: false, message: 'Enter a valid email address' });
      return;
    }

    const user = await User.findOne({ email }).select('googleId isActive').lean();

    res.json({
      success: true,
      data: {
        exists: !!user,
        isGoogleLinked: !!user?.googleId,
        isActive: user ? user.isActive !== false : undefined,
      },
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Student registration with email + password. All fields are mandatory:
 * valid email, name (2-60 chars), password (min 8 chars), 10-digit phone.
 * Responds with the same shape as login so the client session setup is
 * identical.
 */
export const register = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const phoneNumber = typeof req.body.phoneNumber === 'string' ? req.body.phoneNumber.trim() : '';

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ success: false, message: 'Enter a valid email address' });
      return;
    }
    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ success: false, message: 'Enter your full name' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      res.status(400).json({ success: false, message: 'Enter a valid 10-digit phone number' });
      return;
    }

    const existing = await User.findOne({ email }).select('googleId').lean();
    if (existing) {
      if (existing.googleId) {
        res.status(409).json({
          success: false,
          message: 'This email is already linked with Google. Please continue with Google.',
        });
      } else {
        res.status(409).json({ success: false, message: 'Account already exists. Please sign in.' });
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await User.create({
        email,
        name,
        password: hashedPassword,
        phoneNumber,
        role: 'student',
        isActive: true,
        lastLogin: new Date(),
      });
    } catch (dbError) {
      if (dbError.code === 11000) {
        // Race: account created between check and create
        res.status(409).json({ success: false, message: 'Account already exists. Please sign in.' });
        return;
      }
      throw dbError;
    }

    // Welcome email for the new email/password signup. Fire-and-forget: a mail
    // failure must never block or fail registration.
    sendWelcomeEmail(user).catch((err) =>
      console.error('[mail] welcome (register) failed:', err?.message)
    );

    const { accessToken, refreshToken } = await authService.login(user);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions(7 * 24 * 60 * 60 * 1000));
    await authService.updateSessionMeta(
      user._id.toString(),
      req.headers['user-agent'],
      req.ip
    );

    res.status(201).json({
      success: true,
      token: accessToken,
      user: await formatUserWithRole(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};
