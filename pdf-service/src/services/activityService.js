import { ActivityLog, ACTIVITY_TYPES } from '../models/ActivityLog.js';

// Write-side activity helpers for the pdf-service. Paper views, downloads and
// searches land in the shared `activitylogs` collection; the main server owns
// all reads (admin monitor + marketing). Fire-and-forget by design: tracking
// must never slow down or break a PDF response.
export const VIEW_DEDUPE_MS = 30 * 60 * 1000;   // PDF range re-requests repeat fast
export const DOWNLOAD_DEDUPE_MS = 10 * 60 * 1000;
export const SEARCH_DEDUPE_MS = 10 * 60 * 1000;

const BROWSER_PATTERNS = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const OS_PATTERNS = [
  [/Windows NT 10/, 'Windows 10/11'],
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Mac OS X/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export function parseUserAgent(ua) {
  const s = typeof ua === 'string' ? ua.slice(0, 300) : '';
  const browser = BROWSER_PATTERNS.find(([re]) => re.test(s))?.[1] || '';
  const os = OS_PATTERNS.find(([re]) => re.test(s))?.[1] || '';
  let type = 'desktop';
  if (/iPad|Tablet/.test(s)) type = 'tablet';
  else if (/Mobi|iPhone|Android/.test(s)) type = 'mobile';
  return { browser, os, type };
}

// ── Client IP extraction ────────────────────────────────────────────────────
// Behind Vercel (our /pdfapi rewrite proxies server-side), Express's own
// req.ip is the proxy's address, not the student's. Prefer the leftmost
// x-forwarded-for entry (set by the edge), then x-real-ip, then req.ip —
// which is correct in local dev, where requests arrive directly.
const normalizeIp = (value) => {
  let v = String(value || '').trim();
  if (!v) return '';
  if (v.startsWith('::ffff:')) v = v.slice(7);
  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(v);
  if (withPort) v = withPort[1];
  return v.slice(0, 64);
};

export function clientIp(req) {
  // 1) x-client-ip stamped by our Next.js edge middleware on the /pdfapi proxy.
  const stamped = req?.headers?.['x-client-ip'];
  if (typeof stamped === 'string' && stamped.trim()) return normalizeIp(stamped);
  // 2) Proxy x-forwarded-for — leftmost entry is the client.
  const xff = req?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return normalizeIp(first);
  }
  const real = req?.headers?.['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return normalizeIp(real);
  // 3) Direct connection (local dev).
  return normalizeIp(req?.ip);
}

function clientMeta(req) {
  const userAgent = typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : '';
  return {
    ip: clientIp(req),
    userAgent: userAgent.slice(0, 400),
    device: parseUserAgent(userAgent),
  };
}

function cleanStr(value, max = 300) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export async function logActivity(payload, req) {
  try {
    if (!payload?.user || !ACTIVITY_TYPES.includes(payload.type)) return;
    await ActivityLog.create({
      user: payload.user,
      type: payload.type,
      title: cleanStr(payload.title),
      path: cleanStr(payload.path, 500),
      entityType: cleanStr(payload.entityType, 40),
      entityId: cleanStr(payload.entityId, 64),
      sessionKey: cleanStr(payload.sessionKey, 64),
      subjectName: cleanStr(payload.subjectName, 200),
      departmentName: cleanStr(payload.departmentName, 150),
      branchName: cleanStr(payload.branchName, 150),
      meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
      ...clientMeta(req),
    });
  } catch (err) {
    console.error('[Activity] pdf-service log failed:', err?.message);
  }
}

/** True when the same user/type/entity was already logged within the window. */
export async function hasRecentEvent({ userId, type, entityId, withinMs }) {
  if (!userId || !entityId) return false;
  try {
    return await ActivityLog.exists({
      user: userId,
      type,
      entityId: String(entityId).slice(0, 64),
      createdAt: { $gte: new Date(Date.now() - withinMs) },
    });
  } catch {
    return false;
  }
}
