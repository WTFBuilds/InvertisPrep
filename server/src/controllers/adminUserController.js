import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { PYQPaper } from '../models/PYQPaper.js';
import { Syllabus } from '../models/Syllabus.js';
import { Report } from '../models/Report.js';
import { Bug } from '../models/Bug.js';
import { Transaction } from '../models/Transaction.js';
import { PointsLog } from '../models/PointsLog.js';
import { calculateUserBadges } from '../utils/badges.js';

const VALID_ROLES = ['student', 'srt', 'admin', 'super-admin'];

// Escape user input before building a RegExp for search
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whitelisted sort keys → actual sort spec
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  points: { points: -1 },
  lastLogin: { lastLogin: -1 },
};

export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { search, role, status, sort } = req.query;

    const filter = {};

    // Search across name / email / studentId
    if (search && String(search).trim()) {
      const q = escapeRegExp(String(search).trim());
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
      ];
    }

    if (role && VALID_ROLES.includes(role)) {
      filter.role = role;
    }

    if (status === 'active') filter.isActive = true;
    else if (status === 'banned') filter.isActive = false;

    const sortSpec = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name email picture role isActive studentId course points qcoins freeDownloadsLeft lastLogin createdAt')
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        picture: u.picture || null,
        role: u.role,
        isActive: u.isActive,
        studentId: u.studentId || '',
        course: u.course || '',
        points: u.points ?? 0,
        qcoins: u.qcoins ?? 0,
        lastLogin: u.lastLogin,
        joinedAt: u.createdAt,
      })),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Server error while listing users' });
  }
};

export const getUserStats = async (_req, res) => {
  try {
    const [total, active, admins, srt, superAdmins, banned] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      User.countDocuments({ role: 'srt', isActive: true }),
      User.countDocuments({ role: 'super-admin', isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

    res.json({
      success: true,
      data: { total, active, admins, srt, superAdmins, banned },
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user stats' });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user id' });
      return;
    }

    const user = await User.findById(id).lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const [
      verifiedUploads,
      totalUploads,
      syllabusUploads,
      reportsFiled,
      reportsPending,
      bugsFiled,
      transactions,
      activity,
    ] = await Promise.all([
      PYQPaper.countDocuments({ uploadedBy: id, verified: true, isActive: true }),
      PYQPaper.countDocuments({ uploadedBy: id }),
      Syllabus.countDocuments({ uploadedBy: id }),
      Report.countDocuments({ reportedBy: id }),
      Report.countDocuments({ reportedBy: id, status: 'pending' }),
      Bug.countDocuments({ reportedBy: id }),
      Transaction.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
      PointsLog.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const quizWins = await PointsLog.countDocuments({
      userId: id,
      type: 'quiz',
      description: { $regex: /Won 1v1/i },
    });

    const rank = (await User.countDocuments({
      isActive: true,
      points: { $gt: user.points ?? 0 },
    })) + 1;

    const badges = calculateUserBadges(
      user.points ?? 0,
      verifiedUploads,
      quizWins,
      (user.followers || []).length
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture || null,
          role: user.role,
          isActive: user.isActive,
          studentId: user.studentId || '',
          phoneNumber: user.phoneNumber || '',
          course: user.course || '',
          points: user.points ?? 0,
          qcoins: user.qcoins ?? 0,
          freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
          followers: (user.followers || []).length,
          following: (user.following || []).length,
          lastLogin: user.lastLogin,
          joinedAt: user.createdAt,
          rank,
        },
        stats: {
          verifiedUploads,
          totalUploads,
          syllabusUploads,
          reportsFiled,
          reportsPending,
          bugsFiled,
        },
        badges,
        transactions: transactions.map((t) => ({
          id: t._id,
          type: t.type,
          category: t.category,
          coins: t.coins,
          rupees: t.rupees,
          description: t.description,
          balanceAfter: t.balanceAfter,
          createdAt: t.createdAt,
        })),
        activity: activity.map((a) => ({
          id: a._id,
          type: a.type,
          points: a.points,
          description: a.description,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user details' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user id' });
      return;
    }

    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Admins cannot change their own role (would lock themselves out / escalate)
    if (String(target._id) === String(req.user.id)) {
      res.status(400).json({ success: false, message: 'You cannot change your own role' });
      return;
    }

    // Never allow removing the last super-admin
    if (target.role === 'super-admin' && role !== 'super-admin') {
      const superAdminCount = await User.countDocuments({ role: 'super-admin' });
      if (superAdminCount <= 1) {
        res.status(400).json({ success: false, message: 'Cannot demote the last super admin' });
        return;
      }
    }

    target.role = role;
    await target.save();

    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating role' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ success: false, message: 'isActive must be a boolean' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user id' });
      return;
    }

    // Can't ban yourself
    if (String(id) === String(req.user.id)) {
      res.status(400).json({ success: false, message: 'You cannot change your own status' });
      return;
    }

    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    target.isActive = isActive;
    await target.save();

    res.json({
      success: true,
      message: isActive ? 'Account reactivated' : 'Account banned',
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating status' });
  }
};
