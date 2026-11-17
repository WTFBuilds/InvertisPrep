import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Presence } from '../models/Presence.js';
import { ActivityLog, ACTIVITY_TYPES } from '../models/ActivityLog.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { ONLINE_WINDOW_MS } from '../services/activityService.js';

const router = Router();

// Every route resolves its own permission gate: monitor endpoints need
// activity.view, the chart drill-downs accept activity.view OR marketing.view
// (both dashboards click through to them).
router.use(authenticateJWT);

// ── Date helpers (IST day boundaries — the audience is India-based) ─────────
const IST_TZ = '+05:30';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istDayStart(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

function istDayKey(date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function daysBack(n) {
  const start = istDayStart();
  return new Date(start.getTime() - n * 24 * 60 * 60 * 1000);
}

// ── Time-range series (range-picker graphs) ─────────────────────────────────
// 24h → 24 hourly IST buckets; 7d/30d/90d → daily IST buckets.
const SERIES_RANGES = ['24h', '7d', '30d', '90d'];

function seriesWindow(range) {
  if (range === '24h') {
    const topOfHour = new Date();
    topOfHour.setUTCMinutes(0, 0, 0);
    return {
      from: new Date(topOfHour.getTime() - 23 * 60 * 60 * 1000),
      fmt: '%Y-%m-%dT%H:00',
      buckets: 24,
      stepMs: 60 * 60 * 1000,
      hourly: true,
    };
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return {
    from: daysBack(days - 1),
    fmt: '%Y-%m-%d',
    buckets: days,
    stepMs: 24 * 60 * 60 * 1000,
    hourly: false,
  };
}

// Bucket key matching $dateToString output in the given IST format
function bucketKey(instant, hourly) {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MS).toISOString();
  return hourly ? `${shifted.slice(0, 13)}:00` : shifted.slice(0, 10);
}

function fillBuckets(rows, { from, buckets, stepMs, hourly }) {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  for (let i = 0; i < buckets; i++) {
    const key = bucketKey(new Date(from.getTime() + i * stepMs), hourly);
    const row = map.get(key);
    out.push({ date: key, count: row?.count || 0, events: row?.events || 0 });
  }
  return out;
}

// IP / user-agent are only surfaced to super-admins — custom roles granted
// activity.view see behaviour, not network identifiers.
function sanitizeEvent(doc, viewer) {
  if (!doc) return doc;
  if (viewer?.role === 'super-admin') return doc;
  const { ip, userAgent, ...rest } = doc;
  void ip;
  void userAgent;
  return { ...rest, ip: null, userAgent: null };
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * GET /api/admin/activity/overview
 * Headline stats + top pages/papers for the monitor & dashboard. Time-range
 * graphs come from /series.
 */
router.get('/overview', requirePermission('activity.view'), async (req, res) => {
  try {
    const weekAgo = daysBack(7);
    const todayStart = istDayStart();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [onlineNow, activeToday, activeWeek, activeMonth, eventsToday, viewsToday, downloadsToday, newToday, new24h, newWeek, new30d, totalUsers] =
      await Promise.all([
        Presence.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }),
        ActivityLog.distinct('user', { createdAt: { $gte: todayStart } }),
        ActivityLog.distinct('user', { createdAt: { $gte: weekAgo } }),
        ActivityLog.distinct('user', { createdAt: { $gte: daysBack(30) } }),
        ActivityLog.countDocuments({ createdAt: { $gte: todayStart } }),
        ActivityLog.countDocuments({ type: 'paper_view', createdAt: { $gte: todayStart } }),
        ActivityLog.countDocuments({ type: 'paper_download', createdAt: { $gte: todayStart } }),
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        User.countDocuments({ createdAt: { $gte: last24h } }),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ createdAt: { $gte: daysBack(30) } }),
        User.countDocuments({}),
      ]);

    const [topPages, topPapers, topSearches] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { type: 'page_view', createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$path', count: { $sum: 1 }, users: { $addToSet: '$user' }, title: { $last: '$title' } } },
        { $match: { _id: { $ne: '' } } },
        { $project: { _id: 0, path: '$_id', title: 1, count: 1, users: { $size: '$users' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      ActivityLog.aggregate([
        { $match: { type: 'paper_view', createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: '$entityId',
            title: { $first: '$title' },
            subjectName: { $first: '$subjectName' },
            departmentName: { $first: '$departmentName' },
            count: { $sum: 1 },
            users: { $addToSet: '$user' },
          },
        },
        { $match: { _id: { $ne: '' } } },
        { $project: { _id: 0, entityId: '$_id', title: 1, subjectName: 1, departmentName: 1, count: 1, users: { $size: '$users' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      ActivityLog.aggregate([
        { $match: { type: 'search', createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$title', count: { $sum: 1 }, users: { $addToSet: '$user' } } },
        { $match: { _id: { $ne: '' } } },
        { $project: { _id: 0, query: '$_id', count: 1, users: { $size: '$users' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        onlineNow,
        activeToday: activeToday.length,
        activeWeek: activeWeek.length,
        activeMonth: activeMonth.length,
        eventsToday,
        viewsToday,
        downloadsToday,
        newToday,
        new24h,
        newWeek,
        new30d,
        totalUsers,
        topPages,
        topPapers,
        topSearches,
      },
    });
  } catch (error) {
    console.error('[AdminActivity] overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to load activity overview' });
  }
});

/**
 * GET /api/admin/activity/series?metric=signups|active&range=24h|7d|30d|90d
 * Range-picker graph data: hourly buckets for 24h, daily IST buckets for the
 * day ranges. 'signups' → new accounts per bucket; 'active' → distinct users
 * with at least one recorded event per bucket.
 */
router.get('/series', requirePermission('activity.view', 'marketing.view'), async (req, res) => {
  try {
    const metric = req.query.metric === 'active' ? 'active' : 'signups';
    const range = SERIES_RANGES.includes(req.query.range) ? req.query.range : '30d';
    const win = seriesWindow(range);

    // The Vercel-style stat header shows the window total next to the graph;
    // prevTotal is the equally-sized window immediately before it, so the
    // client can render a real % change ("vs previous 30 days").
    const windowMs = win.buckets * win.stepMs;
    const windowEnd = new Date(win.from.getTime() + windowMs); // exclusive
    const prevStart = new Date(win.from.getTime() - windowMs);

    let rows;
    let total;
    let prevTotal;
    if (metric === 'signups') {
      rows = await User.aggregate([
        { $match: { createdAt: { $gte: win.from } } },
        {
          $group: {
            _id: { $dateToString: { format: win.fmt, date: '$createdAt', timezone: IST_TZ } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } },
      ]);
      [total, prevTotal] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: win.from, $lt: windowEnd } }),
        User.countDocuments({ createdAt: { $gte: prevStart, $lt: win.from } }),
      ]);
    } else {
      rows = await ActivityLog.aggregate([
        { $match: { createdAt: { $gte: win.from } } },
        {
          $group: {
            _id: { $dateToString: { format: win.fmt, date: '$createdAt', timezone: IST_TZ } },
            users: { $addToSet: '$user' },
            events: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: '$_id', count: { $size: '$users' }, events: 1 } },
        { $sort: { date: 1 } },
      ]);
      // Distinct users can't be counted with countDocuments — re-aggregate the
      // window and the previous window separately.
      const distinctIn = async (from, to) => {
        const r = await ActivityLog.aggregate([
          { $match: { createdAt: { $gte: from, $lt: to } } },
          { $group: { _id: '$user' } },
          { $count: 'n' },
        ]);
        return r[0]?.n || 0;
      };
      [total, prevTotal] = await Promise.all([
        distinctIn(win.from, windowEnd),
        distinctIn(prevStart, win.from),
      ]);
    }

    res.json({
      success: true,
      data: { metric, range, total, prevTotal, series: fillBuckets(rows, win) },
    });
  } catch (error) {
    console.error('[AdminActivity] series error:', error);
    res.status(500).json({ success: false, message: 'Failed to load series' });
  }
});

/**
 * GET /api/admin/activity/online — everyone currently online with the page
 * they're on right now.
 */
router.get('/online', requirePermission('activity.view'), async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
    const rows = await Presence.find({ lastSeenAt: { $gte: cutoff } })
      .sort({ lastSeenAt: -1 })
      .limit(300)
      .populate('user', 'name email picture role lastLogin')
      .lean();

    const data = rows
      .filter((r) => r.user)
      .map((r) => ({
        user: r.user,
        lastSeenAt: r.lastSeenAt,
        currentPath: r.currentPath,
        currentTitle: r.currentTitle,
        isTabVisible: r.isTabVisible,
        device: r.device,
        ip: req.user.role === 'super-admin' ? r.ip : null,
      }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[AdminActivity] online error:', error);
    res.status(500).json({ success: false, message: 'Failed to load online users' });
  }
});

/**
 * GET /api/admin/activity/feed — global filterable event stream.
 * Query: page, limit, type, userId, search (user name/email), from, to.
 */
router.get('/feed', requirePermission('activity.view'), async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};

    if (req.query.type && ACTIVITY_TYPES.includes(req.query.type)) {
      query.type = req.query.type;
    }
    if (req.query.userId && mongoose.isValidObjectId(req.query.userId)) {
      query.user = new mongoose.Types.ObjectId(req.query.userId);
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }
    if (req.query.search) {
      const re = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const users = await User.find({ $or: [{ name: re }, { email: re }] }).select('_id').limit(50).lean();
      query.user = { $in: users.map((u) => u._id) };
    }

    const [rows, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email picture role')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rows.map((r) => sanitizeEvent(r, req.user)),
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('[AdminActivity] feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to load activity feed' });
  }
});

/**
 * GET /api/admin/activity/users/:id/summary — profile + engagement rollup +
 * session list for one user (the monitor's deep-dive header).
 */
router.get('/users/:id/summary', requirePermission('activity.view'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id)
      .populate('roleId', 'label color')
      .select('-password -followers -following')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [presence, byType, totalEvents, activeDaysRows, sessions, firstEventAt] = await Promise.all([
      Presence.findOne({ user: id }).lean(),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$type', count: { $sum: 1 }, lastAt: { $max: '$createdAt' } } },
      ]),
      ActivityLog.countDocuments({ user: id }),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), createdAt: { $gte: daysBack(30) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } } } },
        { $count: 'days' },
      ]),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), sessionKey: { $ne: '' } } },
        {
          $group: {
            _id: '$sessionKey',
            firstAt: { $min: '$createdAt' },
            lastAt: { $max: '$createdAt' },
            events: { $sum: 1 },
            device: { $last: '$device' },
          },
        },
        { $project: { _id: 0, sessionKey: '$_id', firstAt: 1, lastAt: 1, events: 1, device: 1 } },
        { $sort: { lastAt: -1 } },
        { $limit: 30 },
      ]),
      ActivityLog.findOne({ user: id }).sort({ createdAt: 1 }).select('createdAt').lean(),
    ]);

    const byTypeMap = Object.fromEntries(byType.map((r) => [r._id, r]));
    const paperViews = byTypeMap.paper_view?.count || 0;
    const downloads = byTypeMap.paper_download?.count || 0;
    const searches = byTypeMap.search?.count || 0;
    const logins = byTypeMap.login?.count || 0;
    const lastSeenAt = presence?.lastSeenAt || byType.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))[0]?.lastAt || null;

    res.json({
      success: true,
      data: {
        user,
        presence: presence
          ? {
              lastSeenAt: presence.lastSeenAt,
              currentPath: presence.currentPath,
              currentTitle: presence.currentTitle,
              isTabVisible: presence.isTabVisible,
              device: presence.device,
              ip: req.user.role === 'super-admin' ? presence.ip : null,
            }
          : null,
        stats: {
          totalEvents,
          paperViews,
          downloads,
          searches,
          logins,
          activeDays30: activeDaysRows[0]?.days || 0,
          firstEventAt: firstEventAt?.createdAt || null,
          lastSeenAt,
        },
        sessions,
      },
    });
  } catch (error) {
    console.error('[AdminActivity] user summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user activity summary' });
  }
});

/**
 * GET /api/admin/activity/users/:id/logs — one user's full event timeline.
 */
router.get('/users/:id/logs', requirePermission('activity.view'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    const { page, limit, skip } = parsePagination(req.query);
    const query = { user: new mongoose.Types.ObjectId(id) };
    if (req.query.type && ACTIVITY_TYPES.includes(req.query.type)) {
      query.type = req.query.type;
    }

    const [rows, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rows.map((r) => sanitizeEvent(r, req.user)),
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('[AdminActivity] user logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user activity' });
  }
});

/**
 * GET /api/admin/activity/users/:id/papers — every paper the user has viewed
 * or downloaded, with counts (the "what is he viewing" answer).
 */
router.get('/users/:id/papers', requirePermission('activity.view'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const rows = await ActivityLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(id),
          type: { $in: ['paper_view', 'paper_download'] },
        },
      },
      {
        $group: {
          _id: '$entityId',
          title: { $first: '$title' },
          subjectName: { $first: '$subjectName' },
          departmentName: { $first: '$departmentName' },
          branchName: { $first: '$branchName' },
          views: { $sum: { $cond: [{ $eq: ['$type', 'paper_view'] }, 1, 0] } },
          downloads: { $sum: { $cond: [{ $eq: ['$type', 'paper_download'] }, 1, 0] } },
          lastAt: { $max: '$createdAt' },
        },
      },
      { $match: { _id: { $ne: '' } } },
      { $project: { _id: 0, entityId: '$_id', title: 1, subjectName: 1, departmentName: 1, branchName: 1, views: 1, downloads: 1, lastAt: 1 } },
      { $sort: { lastAt: -1 } },
      { $limit: 100 },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[AdminActivity] user papers error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user papers' });
  }
});

/**
 * GET /api/admin/activity/signups?from=ISO&to=ISO
 * Chart drill-down: everyone who created an account inside [from, to).
 * Client passes IST bounds (single day or ISO week). Capped at 500 rows.
 */
router.get('/signups', requirePermission('activity.view', 'marketing.view'), async (req, res) => {
  try {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const users = await User.find({ createdAt: { $gte: from, $lt: to } })
      .select('name email picture role course studentId phoneNumber createdAt lastLogin')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ success: true, data: { count: users.length, users } });
  } catch (error) {
    console.error('[AdminActivity] signups error:', error);
    res.status(500).json({ success: false, message: 'Failed to load signups' });
  }
});

/**
 * GET /api/admin/activity/active-users?from=ISO&to=ISO
 * Chart drill-down: distinct users with at least one recorded event in the
 * window, richest-activity first, with per-user event counts.
 */
router.get('/active-users', requirePermission('activity.view', 'marketing.view'), async (req, res) => {
  try {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const rows = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$user', events: { $sum: 1 } } },
      { $sort: { events: -1 } },
      { $limit: 500 },
    ]);
    const ids = rows.map((r) => r._id);

    const users = await User.find({ _id: { $in: ids } })
      .select('name email picture role course studentId phoneNumber createdAt lastLogin')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const data = rows
      .filter((r) => byId.has(String(r._id)))
      .map((r) => ({ ...byId.get(String(r._id)), eventCount: r.events }));

    res.json({ success: true, data: { count: rows.length, users: data } });
  } catch (error) {
    console.error('[AdminActivity] active-users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load active users' });
  }
});

export default router;
