import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { connectDB } from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, readLimiter, writeLimiter, pdfLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { initializeQueue, startWorker, closeQueue, isQueueDisabled } from './services/queueService.js';

// Import routes
import pdfRoutes from './routes/pdf.js';
import uploadRoutes from './routes/upload.js';
import jobsRoutes from './routes/jobs.js';
import healthRoutes from './routes/health.js';
import pyqRoutes from './routes/pyq.js';

// Register lookup models (shared DB) so populate() on PYQ refs can resolve.
// Import order matters only in that these must load before the first request.
import './models/Department.js';
import './models/Branch.js';
import './models/Session.js';
import './models/User.js';

const app = express();
const PORT = env.PORT;

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

  // Initialize job queue
  initializeQueue();

  // Start worker if not in test mode and queue is enabled
  if (env.NODE_ENV !== 'test' && !isQueueDisabled()) {
    startWorker();
  } else if (isQueueDisabled()) {
    console.log('[Server] Queue disabled - jobs will be processed synchronously');
  }

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS - allow main server and client
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

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token'],
    exposedHeaders: ['Content-Disposition'],
  }));

  app.use(morgan('dev'));

  // General API rate limit
  app.use('/api', apiLimiter);

  // Read-optimized routes
  app.use('/api/jobs', readLimiter);
  app.use('/api/health', readLimiter);

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check (no rate limit)
  app.use('/api/health', healthRoutes);

  // API Routes
  app.use('/api/pyq', readLimiter, pyqRoutes);
  app.use('/api/pdf', pdfLimiter, pdfRoutes);
  app.use('/api/upload', uploadLimiter, uploadRoutes);
  app.use('/api/jobs', writeLimiter, jobsRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`���� PDF Service running on port ${PORT}`);
    console.log(`���� Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    server.close();
    await closeQueue();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

initApp().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;