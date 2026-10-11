import { ActivityLog, ACTIVITY_TYPES } from '../models/ActivityLog.js';
import { Presence } from '../models/Presence.js';

// A user counts as "online" while their tab heartbeats at least this often.
// The client sends a beat every 45s, so 90s absorbs one missed beat.
export const ONLINE_WINDOW_MS = 90 * 1000;

// ── User-agent parsing (dependency-free) ────────────────────────────────────
// Ordered: first match wins, so Edge/Opera are checked before Chrome.
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

function clientMeta(req) {
  const userAgent = typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : '';
  return {
    ip: req?.ip || '',
    userAgent: userAgent.slice(0, 400),
    device: parseUserAgent(userAgent),
  };
}

function cleanStr(value, max = 300) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function referrerDomain(referrer) {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname.slice(0, 200);
  } catch {
    return '';
  }
}

/**
 * Record an activity event. Fire-and-forget by design: callers never await it
 * (tracking must never slow down or break the real request) and failures are
 * logged but swallowed.
 */
export async function logActivity(payload, req) {
  try {
    if (!payload?.user || !ACTIVITY_TYPES.includes(payload.type)) return;
    const meta = req ? clientMeta(req) : {};
    const referrer = cleanStr(payload.referrer, 500);

    await ActivityLog.create({
      user: payload.user,
      type: payload.type,
      title: cleanStr(payload.title),
      path: cleanStr(payload.path, 500),
      entityType: cleanStr(payload.entityType, 40),
      entityId: cleanStr(payload.entityId, 64),
      sessionKey: cleanStr(payload.sessionKey, 64),
      referrer,
      referrerDomain: payload.referrerDomain || referrerDomain(referrer),
      subjectName: cleanStr(payload.subjectName, 200),
      departmentName: cleanStr(payload.departmentName, 150),
      branchName: cleanStr(payload.branchName, 150),
      meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
      ...meta,
    });
  } catch (err) {
    console.error('[Activity] log failed:', err?.message);
  }
}

/**
 * Upsert the user's live presence. Called by the heartbeat route and on login.
 */
export async function touchPresence(userId, payload, req) {
  try {
    if (!userId) return;
    const meta = req ? clientMeta(req) : {};
    await Presence.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          lastSeenAt: new Date(),
          currentPath: cleanStr(payload?.path, 500),
          currentTitle: cleanStr(payload?.title),
          sessionKey: cleanStr(payload?.sessionKey, 64),
          isTabVisible: payload?.visible !== false,
          ...meta,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('[Activity] presence update failed:', err?.message);
  }
}

/**
 * True when an identical event (same user/type/entity) was already recorded
 * within the window. Used to dedupe paper views from PDF range re-requests
 * and repeat heartbeats on the same document.
 */
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
