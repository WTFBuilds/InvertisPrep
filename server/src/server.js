
import './config/env.js'; // Load environment variables from .env file

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { connectDB } from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, uploadLimiter, pdfLimiter, readLimiter, writeLimiter } from './middleware/rateLimit.js';

// Import routes
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import branchRoutes from './routes/branches.js';
import sessionRoutes from './routes/sessions.js';
import syllabusRoutes from './routes/syllabus.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import pdfRoutes from './routes/pdf.js';
import pdfProxyRoutes from './routes/pdfProxy.js';
import resumeRoutes from './routes/resumes.js';
import walletRoutes from './routes/wallet.js';
import bugRoutes from './routes/bugs.js';
import leaderboardRoutes from './routes/leaderboard.js';
import eventRoutes from './routes/events.js';
import adminUserRoutes from './routes/adminUsers.js';
import roleRoutes from './routes/roles.js';
import sponsorRoutes from './routes/sponsors.js';
import paperRequestRoutes from './routes/paperRequests.js';
import adminMailRoutes from './routes/adminMail.js';
import activityRoutes from './routes/activity.js';
import adminActivityRoutes from './routes/adminActivity.js';
import adminMarketingRoutes from './routes/adminMarketing.js';
import adminBackupRoutes from './routes/adminBackup.js';

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS Configuration
// Default origins always apply; env var CORS_ORIGINS adds extra origins (comma-separated).
// Localhost origins are dev-only — never accepted in production.
const isProduction = process.env.NODE_ENV === 'production';
const defaultOrigins = [
  ...(isProduction ? [] : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5002']),
  'https://invertisprep.vercel.app',
  'https://invertisprepv2.vercel.app',
];
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

// Body size limit for JSON payloads (e.g. "3mb")
const bodyLimit = process.env.BODY_LIMIT || '3mb';

// Trust the first proxy hop when deployed behind a reverse proxy (Vercel, nginx, etc.)
// TRUST_PROXY=1 enables it. Keep 0 in local dev so client IPs are real.
const trustProxy = Number(process.env.TRUST_PROXY) || 0;
if (trustProxy > 0) {
  app.set('trust proxy', trustProxy);
}

const initApp = async () => {
  await connectDB();

  // Configure Cloudinary
  configureCloudinary();

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Expose the download filename so the client can read Content-Disposition
    exposedHeaders: ['Content-Disposition'],
  }));

  app.use(morgan('dev'));

  // General API rate limit — applied to every /api request
  app.use('/api', apiLimiter);
  
  // Read-optimized routes get higher limits
  app.use('/api/departments', readLimiter);
  app.use('/api/branches', readLimiter);
  app.use('/api/sessions', readLimiter);
  app.use('/api/syllabus', readLimiter);
  app.use('/api/syllabus', readLimiter);
  app.use('/api/sponsors', readLimiter);
  app.use('/api/users', readLimiter);
  app.use('/api/leaderboard', readLimiter);

  // Resume drafts can include a deliberately small base64 profile photo.
  // verify: stash the raw body so the Razorpay webhook can check its
  // HMAC signature against the exact bytes Razorpay signed.
  app.use(express.json({
    limit: bodyLimit,
    verify: (req, _res, buf) => { req.rawBody = buf; },
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/paper-requests', paperRequestRoutes);
app.use('/api/pdf', pdfLimiter, pdfRoutes);
app.use('/api/pdf-proxy', pdfProxyRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/roles', roleRoutes);
app.use('/api/admin/mail', adminMailRoutes);
app.use('/api/admin/activity', adminActivityRoutes);
app.use('/api/admin/marketing', adminMarketingRoutes);
app.use('/api/admin/backup', adminBackupRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/sponsors', sponsorRoutes);

  // Apply write limiter to mutation-heavy routes
  app.use('/api/departments', writeLimiter);
  app.use('/api/branches', writeLimiter);
  app.use('/api/sessions', writeLimiter);
  app.use('/api/syllabus', writeLimiter);
  app.use('/api/reports', writeLimiter);
  app.use('/api/resumes', writeLimiter);
  app.use('/api/wallet', writeLimiter);
  app.use('/api/bugs', writeLimiter);
  app.use('/api/admin/users', writeLimiter);
  app.use('/api/admin/roles', writeLimiter);
  app.use('/api/sponsors', writeLimiter);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initApp().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
