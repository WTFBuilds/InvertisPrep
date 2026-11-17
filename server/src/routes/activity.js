import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { logActivity, touchPresence, ONLINE_WINDOW_MS } from '../services/activityService.js';
import { ACTIVITY_TYPES } from '../models/ActivityLog.js';
import { Presence } from '../models/Presence.js';

const router = Router();

const cleanStr = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const SESSION_TYPES = new Set(['page_view', 'search', 'profile_update']);

/**
 * POST /api/activity — record a client-side event (page navigation, search,
 * etc.). The JWT identifies the user; everything else is sanitized payload.
 */
router.post('/', authenticateJWT, async (req, res) => {
  const { type, title, path, entityType, entityId, sessionKey, referrer, meta } = req.body || {};

  if (!type || !ACTIVITY_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: 'Unknown activity type' });
  }
  // Server-authoritative events (login/signup/logout, paper views/downloads)
  // are logged by their own controllers — the client never posts those here.
  if (!SESSION_TYPES.has(type)) {
    return res.status(400).json({ success: false, message: 'Event type not accepted from client' });
  }

  // Fire-and-forget: tracking must never hold the connection open. The write
  // runs in the background (the service swallows its own errors); the client
  // gets an immediate ack so a slow DB can't pile up sockets under load.
  void (async () => {
    await logActivity(
      {
        user: req.user._id ?? req.user.id,
        type,
        title,
        path,
        entityType,
        entityId,
        sessionKey,
        referrer,
        meta: meta && typeof meta === 'object' ? meta : {},
      },
      req
    );

    // A page view doubles as a presence beat, so a fresh navigation shows the
    // user online immediately without waiting for the next heartbeat.
    if (type === 'page_view') {
      await touchPresence(req.user._id ?? req.user.id, { path, title, sessionKey, visible: true }, req);
    }
  })();

  res.json({ success: true });
});

/**
 * POST /api/activity/presence — heartbeat from the tracker (every 45s while
 * the tab is open). Keeps the "Live Now" view accurate.
 */
router.post('/presence', authenticateJWT, async (req, res) => {
  const { path, title, sessionKey, visible } = req.body || {};
  // Fire-and-forget like the tracker route — respond before the upsert lands.
  void (async () => {
    await touchPresence(req.user._id ?? req.user.id, { path, title, sessionKey, visible }, req);
  })();
  res.json({ success: true, onlineWindowSec: ONLINE_WINDOW_MS / 1000 });
});

/**
 * GET /api/activity/presence — self check (used by the tracker to confirm the
 * pipeline works; harmless but keeps the API symmetric).
 */
router.get('/presence', authenticateJWT, async (req, res) => {
  const presence = await Presence.findOne({ user: req.user._id }).lean();
  res.json({ success: true, data: presence || null });
});

export default router;
