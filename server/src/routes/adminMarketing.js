import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Presence } from '../models/Presence.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { ONLINE_WINDOW_MS } from '../services/activityService.js';

const router = Router();

router.use(authenticateJWT, requirePermission('marketing.view'));

// Marketing analytics are about students — internal staff accounts are noise
// in lead lists, so every query here scopes to student accounts.
const MARKET_ROLE = 'student';
const IST_TZ = '+05:30';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HOT_MS = 3 * 24 * 60 * 60 * 1000;
const WARM_MS = 14 * 24 * 60 * 60 * 1000;
const NEW_MS = 7 * 24 * 60 * 60 * 1000;

function istDayStart(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

function daysBack(n) {
  const start = istDayStart();
  return new Date(start.getTime() - n * 24 * 60 * 60 * 1000);
}

function filledSeries(rows, days) {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(daysBack(i).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key)?.count || 0 });
  }
  return out;
}

// ISO-8601 week key ("2026-W41"), aligned to the IST day (matches %G-W%V).
function isoWeekKey(date) {
  const d = new Date(date.getTime() + IST_OFFSET_MS);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function filledWeeklySeries(rows, weeks) {
  const map = new Map(rows.map((r) => [r.week, r.count]));
  const now = Date.now();
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const key = isoWeekKey(new Date(now - i * 7 * 24 * 60 * 60 * 1000));
    out.push({ week: key, count: map.get(key) || 0 });
  }
  return out;
}

function escapeCsv(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/marketing/overview — growth + engagement headlines,
 * acquisition sources and interest rankings for the marketing console.
 */
router.get('/overview', async (req, res) => {
  try {
    const todayStart = istDayStart();
    const weekAgo = daysBack(7);
    const monthAgo = daysBack(30);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weeksAgo8 = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

    const [totalStudents, newToday, new24h, newWeek, newMonth, onlineNow, totalUsers] = await Promise.all([
      User.countDocuments({ role: MARKET_ROLE }),
      User.countDocuments({ role: MARKET_ROLE, createdAt: { $gte: todayStart } }),
      User.countDocuments({ role: MARKET_ROLE, createdAt: { $gte: last24h } }),
      User.countDocuments({ role: MARKET_ROLE, createdAt: { $gte: weekAgo } }),
      User.countDocuments({ role: MARKET_ROLE, createdAt: { $gte: monthAgo } }),
      Presence.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }),
      User.countDocuments({}),
    ]);

    // Distinct active users per window, then filter down to students.
    const [idsToday, idsWeek, idsMonth, activatedIds] = await Promise.all([
      ActivityLog.distinct('user', { createdAt: { $gte: todayStart } }),
      ActivityLog.distinct('user', { createdAt: { $gte: weekAgo } }),
      ActivityLog.distinct('user', { createdAt: { $gte: monthAgo } }),
      ActivityLog.distinct('user', { type: 'paper_view' }),
    ]);
    const countStudents = async (ids) =>
      ids.length ? await User.countDocuments({ _id: { $in: ids }, role: MARKET_ROLE }) : 0;
    const [activeToday, activeWeek, activeMonth, activated] = await Promise.all([
      countStudents(idsToday),
      countStudents(idsWeek),
      countStudents(idsMonth),
      countStudents(activatedIds),
    ]);

    const [signupRows, signupWeeklyRows, dauRows, topReferrers, topDepartments, topBranches, topPapers, topSearches] =
      await Promise.all([
        User.aggregate([
          { $match: { role: MARKET_ROLE, createdAt: { $gte: monthAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, date: '$_id', count: 1 } },
          { $sort: { date: 1 } },
        ]),
        User.aggregate([
          { $match: { role: MARKET_ROLE, createdAt: { $gte: weeksAgo8 } } },
          {
            $group: {
              _id: { $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: IST_TZ } },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, week: '$_id', count: 1 } },
          { $sort: { week: 1 } },
        ]),
        ActivityLog.aggregate([
          { $match: { createdAt: { $gte: monthAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } },
              users: { $addToSet: '$user' },
            },
          },
          { $project: { _id: 0, date: '$_id', count: { $size: '$users' } } },
          { $sort: { date: 1 } },
        ]),
        ActivityLog.aggregate([
          { $match: { type: 'page_view', createdAt: { $gte: monthAgo }, referrerDomain: { $ne: '' } } },
          { $group: { _id: '$referrerDomain', count: { $sum: 1 }, users: { $addToSet: '$user' } } },
          { $project: { _id: 0, domain: '$_id', count: 1, users: { $size: '$users' } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        ActivityLog.aggregate([
          { $match: { type: 'paper_view', createdAt: { $gte: monthAgo }, departmentName: { $ne: '' } } },
          { $group: { _id: '$departmentName', count: { $sum: 1 }, users: { $addToSet: '$user' } } },
          { $project: { _id: 0, name: '$_id', count: 1, users: { $size: '$users' } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        ActivityLog.aggregate([
          { $match: { type: 'paper_view', createdAt: { $gte: monthAgo }, branchName: { $ne: '' } } },
          { $group: { _id: '$branchName', count: { $sum: 1 }, users: { $addToSet: '$user' } } },
          { $project: { _id: 0, name: '$_id', count: 1, users: { $size: '$users' } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        ActivityLog.aggregate([
          { $match: { type: 'paper_view', createdAt: { $gte: monthAgo } } },
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
          { $limit: 10 },
        ]),
        ActivityLog.aggregate([
          { $match: { type: 'search', createdAt: { $gte: monthAgo } } },
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
        totalStudents,
        // Reconciles with the dashboard's "Total Users" card: leads are
        // students only, so surface how many accounts are excluded and why.
        totalUsers,
        staffCount: Math.max(0, totalUsers - totalStudents),
        newToday,
        new24h,
        newWeek,
        newMonth,
        onlineNow,
        activeToday,
        activeWeek,
        activeMonth,
        dormant: Math.max(0, totalStudents - activeMonth),
        activated,
        activationRate: totalStudents ? Math.round((activated / totalStudents) * 100) : 0,
        signupSeries: filledSeries(signupRows, 30),
        signupWeeklySeries: filledWeeklySeries(signupWeeklyRows, 8),
        dauSeries: filledSeries(dauRows, 30),
        topReferrers,
        topDepartments,
        topBranches,
        topPapers,
        topSearches,
      },
    });
  } catch (error) {
    console.error('[AdminMarketing] overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to load marketing overview' });
  }
});

/**
 * Engagement rollup for a set of users over the trailing window.
 * Returns Map<userId, {events30, paperViews30, downloads30, lastEventAt}>.
 * In-memory merge keeps this simple and correct at the current scale
 * (a few thousand students); revisit with a pre-aggregated table if the user
 * base grows an order of magnitude.
 */
async function engagementMap(userIds, { since }) {
  const map = new Map();
  if (!userIds.length) return map;
  const rows = await ActivityLog.aggregate([
    { $match: { user: { $in: userIds }, createdAt: { $gte: since } } },
    { $group: { _id: { user: '$user', type: '$type' }, count: { $sum: 1 }, lastAt: { $max: '$createdAt' } } },
  ]);
  for (const row of rows) {
    const key = String(row._id.user);
    const entry = map.get(key) || { events30: 0, paperViews30: 0, downloads30: 0, lastEventAt: null };
    entry.events30 += row.count;
    if (row._id.type === 'paper_view') entry.paperViews30 += row.count;
    if (row._id.type === 'paper_download') entry.downloads30 += row.count;
    if (!entry.lastEventAt || row.lastAt > entry.lastEventAt) entry.lastEventAt = row.lastAt;
    map.set(key, entry);
  }
  return map;
}

function leadStatusFor(user, lastSeenAt, now) {
  const age = now - new Date(user.createdAt).getTime();
  if (age < NEW_MS) return 'new';
  if (lastSeenAt && now - new Date(lastSeenAt).getTime() < HOT_MS) return 'hot';
  if (lastSeenAt && now - new Date(lastSeenAt).getTime() < WARM_MS) return 'warm';
  return 'cold';
}

const LEAD_SORTS = {
  engaged: (a, b) => b.events30 - a.events30 || b.paperViews30 - a.paperViews30,
  recent: (a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  name: (a, b) => (a.name || '').localeCompare(b.name || ''),
  dormant: (a, b) => new Date(a.lastSeenAt || 0) - new Date(b.lastSeenAt || 0),
};

async function buildLeads({ search, status, sort }) {
  const query = { role: MARKET_ROLE };
  if (search) {
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'i');
    query.$or = [{ name: re }, { email: re }, { phoneNumber: re }, { course: re }];
  }

  const now = Date.now();
  const users = await User.find(query)
    .select('name email picture role course studentId phoneNumber createdAt lastLogin isActive')
    .lean();
  const ids = users.map((u) => u._id);

  const [presences, engagement] = await Promise.all([
    Presence.find({ user: { $in: ids } }).select('user lastSeenAt currentPath currentTitle device').lean(),
    engagementMap(ids, { since: daysBack(30) }),
  ]);
  const presenceMap = new Map(presences.map((p) => [String(p.user), p]));

  const leads = users.map((u) => {
    const key = String(u._id);
    const presence = presenceMap.get(key);
    const eng = engagement.get(key) || { events30: 0, paperViews30: 0, downloads30: 0, lastEventAt: null };
    const lastSeenAt = presence?.lastSeenAt || eng.lastEventAt || null;
    return {
      ...u,
      lastSeenAt,
      currentPath: presence?.currentPath || '',
      device: presence?.device || null,
      online: presence ? now - new Date(presence.lastSeenAt).getTime() < ONLINE_WINDOW_MS : false,
      events30: eng.events30,
      paperViews30: eng.paperViews30,
      downloads30: eng.downloads30,
      status: leadStatusFor(u, lastSeenAt, now),
    };
  });

  const filtered = status && status !== 'all' ? leads.filter((l) => l.status === status) : leads;
  const sorter = LEAD_SORTS[sort] || LEAD_SORTS.engaged;
  filtered.sort(sorter);

  const counts = { all: leads.length, hot: 0, warm: 0, cold: 0, new: 0 };
  for (const l of leads) counts[l.status] += 1;

  return { leads: filtered, counts };
}

/**
 * GET /api/admin/marketing/leads — paginated lead list with engagement stats.
 * Query: page, limit, search, status, sort.
 */
router.get('/leads', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const { leads, counts } = await buildLeads({
      search: req.query.search || '',
      status: req.query.status || 'all',
      sort: req.query.sort || 'engaged',
    });

    const start = (page - 1) * limit;
    res.json({
      success: true,
      data: leads.slice(start, start + limit),
      meta: { page, limit, total: leads.length, counts },
    });
  } catch (error) {
    console.error('[AdminMarketing] leads error:', error);
    res.status(500).json({ success: false, message: 'Failed to load leads' });
  }
});

/**
 * GET /api/admin/marketing/leads/export — the same list as a CSV download
 * (capped at 10 000 rows).
 */
router.get('/leads/export', async (req, res) => {
  try {
    const { leads } = await buildLeads({
      search: req.query.search || '',
      status: req.query.status || 'all',
      sort: req.query.sort || 'engaged',
    });

    const header = [
      'Name', 'Email', 'Phone', 'Course', 'Student ID', 'Joined', 'Last Active',
      'Lead Status', 'Events (30d)', 'Paper Views (30d)', 'Downloads (30d)', 'Online Now',
    ];
    const lines = [header.join(',')];
    for (const l of leads.slice(0, 10000)) {
      lines.push(
        [
          l.name, l.email, l.phoneNumber || '', l.course || '', l.studentId || '',
          new Date(l.createdAt).toISOString().slice(0, 10),
          l.lastSeenAt ? new Date(l.lastSeenAt).toISOString().slice(0, 16).replace('T', ' ') : 'never',
          l.status, l.events30, l.paperViews30, l.downloads30, l.online ? 'yes' : 'no',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invertisprep-leads-${date}.csv"`);
    res.send(lines.join('\n'));
  } catch (error) {
    console.error('[AdminMarketing] leads export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export leads' });
  }
});

/**
 * GET /api/admin/marketing/leads/:id — engagement-focused profile for one
 * lead. Deliberately excludes IP / user-agent — marketing sees behaviour and
 * contact info, not network identifiers (that's the activity monitor's job).
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id)
      .select('name email picture role course studentId phoneNumber createdAt lastLogin isActive qcoins points')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const since30 = daysBack(30);
    const [presence, totalEvents, byType, activeDaysRows, topPapers, topDepartments, recent] = await Promise.all([
      Presence.findOne({ user: id }).select('lastSeenAt currentPath currentTitle device').lean(),
      ActivityLog.countDocuments({ user: id }),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), createdAt: { $gte: since30 } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), createdAt: { $gte: since30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } } } },
        { $count: 'days' },
      ]),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), type: { $in: ['paper_view', 'paper_download'] } } },
        {
          $group: {
            _id: '$entityId',
            title: { $first: '$title' },
            subjectName: { $first: '$subjectName' },
            departmentName: { $first: '$departmentName' },
            views: { $sum: { $cond: [{ $eq: ['$type', 'paper_view'] }, 1, 0] } },
            downloads: { $sum: { $cond: [{ $eq: ['$type', 'paper_download'] }, 1, 0] } },
            lastAt: { $max: '$createdAt' },
          },
        },
        { $match: { _id: { $ne: '' } } },
        { $sort: { lastAt: -1 } },
        { $limit: 15 },
      ]),
      ActivityLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id), type: 'paper_view', departmentName: { $ne: '' } } },
        { $group: { _id: '$departmentName', count: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      ActivityLog.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('type title path createdAt subjectName')
        .lean(),
    ]);

    const now = Date.now();
    const lastSeenAt = presence?.lastSeenAt || null;
    const counts30 = Object.fromEntries(byType.map((r) => [r._id, r.count]));

    res.json({
      success: true,
      data: {
        user,
        presence: presence
          ? { lastSeenAt: presence.lastSeenAt, currentPath: presence.currentPath, currentTitle: presence.currentTitle, device: presence.device }
          : null,
        online: lastSeenAt ? now - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS : false,
        lastSeenAt,
        status: leadStatusFor(user, lastSeenAt, now),
        stats: {
          totalEvents,
          events30: byType.reduce((sum, r) => sum + r.count, 0),
          paperViews30: counts30.paper_view || 0,
          downloads30: counts30.paper_download || 0,
          searches30: counts30.search || 0,
          logins30: counts30.login || 0,
          activeDays30: activeDaysRows[0]?.days || 0,
        },
        topPapers,
        topDepartments,
        recent,
      },
    });
  } catch (error) {
    console.error('[AdminMarketing] lead detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load lead detail' });
  }
});

export default router;
