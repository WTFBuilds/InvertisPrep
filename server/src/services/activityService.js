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

// ── Client IP extraction ────────────────────────────────────────────────────
// Behind Vercel (our /backend rewrite proxies server-side), Express's own
// req.ip is the *proxy's* address — so every student appeared to share
// Vercel's handful of rotating egress IPs. The edge sets x-forwarded-for to
// the real client; its leftmost entry is that client (Vercel overwrites this
// header at the edge, so a value injected by the browser can't survive).
// Falls back to x-real-ip, then Express's resolved req.ip — which is already
// correct in local dev, where the request arrives directly.
const normalizeIp = (value) => {
  let v = String(value || '').trim();
  if (!v) return '';
  if (v.startsWith('::ffff:')) v = v.slice(7); // IPv4-mapped IPv6 → IPv4
  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(v);
  if (withPort) v = withPort[1]; // strip an appended :port (IPv4 only)
  return v.slice(0, 64);
};

export function clientIp(req) {
  // 1) x-client-ip is stamped by our Next.js edge middleware (client/middleware.ts)
  //    on the /backend proxy — the most trustworthy source for a proxied call.
  const stamped = req?.headers?.['x-client-ip'];
  if (typeof stamped === 'string' && stamped.trim()) return normalizeIp(stamped);
  // 2) The edge/main proxy's x-forwarded-for — leftmost entry is the client.
  const xff = req?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return normalizeIp(first);
  }
  const real = req?.headers?.['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return normalizeIp(real);
  // 3) Direct connection (local dev) — Express's own resolution is correct.
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
 * Upsert the user's live presence. Called by the heartbeat route, on login and
 * on navigation (page views double as a presence beat).
 *
 * De-duplicated per user+tick: the same user's path updates arriving within
 * HEARTBEAT_MIN_MS of each other collapse into the cheapest possible upsert —
 * a `$set` that only bumps lastSeenAt when nothing meaningful changed. This
 * keeps 16+ open tabs from hammering the Presence collection with writes.
 */
const HEARTBEAT_MIN_MS = 15 * 1000; // client beats every 45s; absorb 3x spam
const presenceDedup = new Map();    // user id -> { at, path, title, sessionKey, visible, ip }

export async function touchPresence(userId, payload, req) {
  try {
    if (!userId) return;
    const id = String(userId);
    const path = cleanStr(payload?.path, 500);
    const title = cleanStr(payload?.title);
    const sessionKey = cleanStr(payload?.sessionKey, 64);
    const visible = payload?.visible !== false;
    const ip = req?.headers?.['x-client-ip'] || req?.headers?.['x-forwarded-for']?.split(',')[0] || '';

    const now = Date.now();
    const prev = presenceDedup.get(id);
    const changed =
      !prev ||
      prev.path !== path ||
      prev.title !== title ||
      prev.sessionKey !== sessionKey ||
      prev.visible !== visible ||
      prev.ip !== ip;
    if (prev && now - prev.at < HEARTBEAT_MIN_MS && !changed) {
      // Same spot, same tab — nothing to persist yet. The next beat (45s) will.
      return;
    }
    presenceDedup.set(id, { at: now, path, title, sessionKey, visible, ip });
    if (presenceDedup.size > 5000) presenceDedup.clear(); // arbitrary cap; users churn

    const meta = req ? clientMeta(req) : {};
    // A same-user upsert is idempotent: where the user already has a presence
    // doc (every repeat beat), update just the heartbeat fields. The doc is
    // created on the first beat with all defaults from the schema.
    await Presence.updateOne(
      { user: userId },
      {
        $set: {
          lastSeenAt: new Date(),
          currentPath: path,
          currentTitle: title,
          sessionKey,
          isTabVisible: visible,
          ...meta,
        },
        $setOnInsert: { user: userId },
      },
      { upsert: true }
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
