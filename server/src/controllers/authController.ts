import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { GoogleAuthPayload, AuthResponse } from '../types/index.js';

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth callback - Create/login user
 * @access  Public
 */
export const googleAuth = asyncHandler(
  async (req: Request, res: Response) => {
    const { googleId, email, name, picture } = req.body as GoogleAuthPayload;

    // Validate required fields
    if (!googleId || !email || !name) {
      res.status(400).json({ 
        error: 'Missing required fields: googleId, email, name' 
      });
      return;
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email exists with different googleId
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res.status(400).json({ 
          error: 'Email already registered with different account' 
        });
        return;
      }

      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        role: 'student', // Default role
      });
    } else {
      // Update existing user info
      user.name = name;
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
      },
    };

    res.json({
      success: true,
      ...response,
    });
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        picture: req.user.picture,
        lastLogin: req.user.lastLogin,
      },
    });
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Email/Password login for admins
 * @access  Public
 */
export const emailLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
      },
    };

    res.json({
      success: true,
      ...response,
    });
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = asyncHandler(
  async (_req: Request, res: Response) => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint exists for consistency and future features
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);
