import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import net from 'net';

// Read a positive integer from env, falling back to `fallback` when missing/invalid
const envInt = (key, fallback) => {
  const val = parseInt(process.env[key], 10);
  return Number.isFinite(val) && val > 0 ? val : fallback;
};

const MINUTE = 60 * 1000;

// Shared message shape so the client can read `success` like every other endpoint
const tooMany = (message) => ({ success: false, message });

// ── Per-client bucket keys ───────────────────────────────────────────────────
// Two problems to dodge at once:
//   1. Behind the Vercel `/backend` rewrite every visitor arrives from
//      Vercel's egress IPs, so `req.ip` collapses everyone into one bucket.
//      Our edge middleware (client/middleware.ts) stamps the real client IP
//      into `x-client-ip` — use that.
//   2. On campus/hostel NAT many students share one public IP, so even the
//      real per-IP bucket would lump them together.
// So: prefer the AUTHENTICATED USER when a valid token is present (each
// student gets their own budget), else the real client IP, else the user/…
// A forged token fails the local signature check and falls through to the IP
// bucket, so an attacker cannot mint unlimited buckets.
function normalizeIp(v) {
  let value = typeof v === 'string' ? v.trim() : '';
  if (!value) return '';
  if (value.startsWith('::ffff:')) value = value.slice(7); // IPv4-mapped IPv6
  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value);
  if (withPort) value = withPort[1]; // strip an appended :port
  return value.slice(0, 64);
}

// Signature-checked user id from the bearer token — local HMAC verify only
// (no Redis/DB), so it's safe and cheap to run on every request. Returns ''
// when there's no token or it doesn't verify.
function userIdFromToken(req) {
  const raw = req?.headers?.authorization;
  if (typeof raw !== 'string' || !raw) return '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return '';
  try {
    const decoded = jwt.verify(token, secret);
    return decoded?.id ? String(decoded.id).slice(0, 64) : '';
  } catch {
    return '';
  }
}

function clientKey(req) {
  const uid = userIdFromToken(req);
  if (uid) return `user:${uid}`;
  const stamped = req?.headers?.['x-client-ip'];
  const ip =
    normalizeIp(Array.isArray(stamped) ? stamped[0] : stamped) ||
    normalizeIp(req?.headers?.['x-forwarded-for']?.split(',')[0]) ||
    normalizeIp(req?.headers?.['x-real-ip']) ||
    normalizeIp(req?.ip);
  if (ip) return `ip:${ip}`;
  return `ip:${normalizeIp(req?.socket?.remoteAddress) || 'unknown'}`;
}

// Per-account key for the auth limiter: counts attempts per login identity so
// one account's retries can never drain a shared IP bucket for everyone.
// `email` is the credential login/register/check-email actually verify, so it
// leads; `studentId` covers any body that sends only that. Pre-auth requests
// with neither (e.g. google-login's token) fall back to the per-client key.
function authKey(req) {
  const bodyId = String(
    req?.body?.email || req?.body?.studentId || req?.body?.id || ''
  ).trim().toLowerCase();
  if (bodyId) return `auth:${bodyId.slice(0, 120)}`;
  return `auth:${clientKey(req)}`;
}

const createMethodLimiter = (windowMs, limit, message, allowedMethods, keyGenerator) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany(message),
    keyGenerator: (req) => {
      const key = (keyGenerator || clientKey)(req);
      const method = (req.method || 'GET').toUpperCase();
      return `${key}:${method}`;
    },
    // Skip non-matching methods
    skip: (req) => !allowedMethods.includes(req.method),
  });
};

// General API limiter — applied to all /api routes.
// Per-client bucket (x-client-ip stamped by the edge, else x-forwarded-for /
// req.ip) so N concurrent students each get their own budget instead of
// draining one shared counter.
export const apiLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * MINUTE), // default: 15 min
  limit: envInt('RATE_LIMIT_MAX', 1000),                 // increased from 300 to 1000 req/window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: tooMany('Too many requests, please try again later.'),
});

// Read-only API limiter - higher limits for GET requests
export const readLimiter = createMethodLimiter(
  envInt('READ_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  envInt('READ_RATE_LIMIT_MAX', 2000),
  'Too many read requests, please try again later.',
  ['GET', 'HEAD', 'OPTIONS'],
  clientKey
);

export const writeLimiter = createMethodLimiter(
  envInt('WRITE_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  envInt('WRITE_RATE_LIMIT_MAX', 200),
  'Too many write requests, please try again later.',
  ['POST', 'PUT', 'PATCH', 'DELETE'],
  clientKey
);

// Auth limiter — stricter, protects login / Google OAuth from brute force.
// Keyed per login identity (studentId/email) so a shared IP (campus, hostel
// wifi) never drags unrelated students into the same bucket.
export const authLimiter = rateLimit({
  windowMs: envInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * MINUTE),
  limit: envInt('AUTH_RATE_LIMIT_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: authKey,
  message: tooMany('Too many login attempts, please try again later.'),
});

// Upload limiter — caps how often a client can POST files
export const uploadLimiter = rateLimit({
  windowMs: envInt('UPLOAD_RATE_LIMIT_WINDOW_MS', 60 * MINUTE), // default: 1 hour
  limit: envInt('UPLOAD_RATE_LIMIT_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: tooMany('Too many uploads, please try again later.'),
});

// PDF limiter — protects the watermark/render pipeline from being hammered
export const pdfLimiter = rateLimit({
  windowMs: envInt('PDF_RATE_LIMIT_WINDOW_MS', 1 * MINUTE), // default: 1 min
  limit: envInt('PDF_RATE_LIMIT_MAX', 120),                 // increased from 60 to 120
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: tooMany('Too many requests, please slow down.'),
});