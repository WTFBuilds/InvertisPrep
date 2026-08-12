import rateLimit from 'express-rate-limit';

// Read a positive integer from env, falling back to `fallback` when missing/invalid
const envInt = (key, fallback) => {
  const val = parseInt(process.env[key], 10);
  return Number.isFinite(val) && val > 0 ? val : fallback;
};

const MINUTE = 60 * 1000;

// Shared message shape so the client can read `success` like every other endpoint
const tooMany = (message) => ({ success: false, message });

// General API limiter — applied to all /api routes
export const apiLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * MINUTE), // default: 15 min
  limit: envInt('RATE_LIMIT_MAX', 300),                 // default: 300 req / window
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many requests, please try again later.'),
});

// Auth limiter — stricter, protects login / Google OAuth from brute force
export const authLimiter = rateLimit({
  windowMs: envInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  limit: envInt('AUTH_RATE_LIMIT_MAX', 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many login attempts, please try again later.'),
});

// Upload limiter — caps how often a client can POST files
export const uploadLimiter = rateLimit({
  windowMs: envInt('UPLOAD_RATE_LIMIT_WINDOW_MS', 60 * MINUTE), // default: 1 hour
  limit: envInt('UPLOAD_RATE_LIMIT_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many uploads, please try again later.'),
});

// PDF limiter — protects the watermark/render pipeline from being hammered
export const pdfLimiter = rateLimit({
  windowMs: envInt('PDF_RATE_LIMIT_WINDOW_MS', 1 * MINUTE), // default: 1 min
  limit: envInt('PDF_RATE_LIMIT_MAX', 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many requests, please slow down.'),
});
