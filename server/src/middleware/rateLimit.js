import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Read a positive integer from env, falling back to `fallback` when missing/invalid
const envInt = (key, fallback) => {
  const val = parseInt(process.env[key], 10);
  return Number.isFinite(val) && val > 0 ? val : fallback;
};

const MINUTE = 60 * 1000;

// Shared message shape so the client can read `success` like every other endpoint
const tooMany = (message) => ({ success: false, message });

// General API limiter — applied to all /api routes
// Increased limits for better throughput on Render
export const apiLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * MINUTE), // default: 15 min
  limit: envInt('RATE_LIMIT_MAX', 1000),                 // increased from 300 to 1000 req/window
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many requests, please try again later.'),
});

// Read-only API limiter - higher limits for GET requests
// Uses a custom handler to only limit GET/HEAD/OPTIONS
const createMethodLimiter = (windowMs, limit, message, allowedMethods) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany(message),
    // Use ipKeyGenerator for proper IPv6 support
    keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.method}`,
    // Skip non-matching methods
    skip: (req) => !allowedMethods.includes(req.method),
  });
};

export const readLimiter = createMethodLimiter(
  envInt('READ_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  envInt('READ_RATE_LIMIT_MAX', 2000),
  'Too many read requests, please try again later.',
  ['GET', 'HEAD', 'OPTIONS']
);

export const writeLimiter = createMethodLimiter(
  envInt('WRITE_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  envInt('WRITE_RATE_LIMIT_MAX', 200),
  'Too many write requests, please try again later.',
  ['POST', 'PUT', 'PATCH', 'DELETE']
);

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
// Increased limit since we now have caching
export const pdfLimiter = rateLimit({
  windowMs: envInt('PDF_RATE_LIMIT_WINDOW_MS', 1 * MINUTE), // default: 1 min
  limit: envInt('PDF_RATE_LIMIT_MAX', 120),                 // increased from 60 to 120
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany('Too many requests, please slow down.'),
});
