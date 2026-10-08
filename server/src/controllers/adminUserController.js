import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { PYQPaper } from '../models/PYQPaper.js';
import { Syllabus } from '../models/Syllabus.js';
import { Report } from '../models/Report.js';
import { Bug } from '../models/Bug.js';
import { Transaction } from '../models/Transaction.js';
import { PointsLog } from '../models/PointsLog.js';
import { calculateUserBadges } from '../utils/badges.js';

const VALID_ROLES = ['student', 'srt', 'staff', 'admin', 'super-admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        .select('name email picture role roleId isActive studentId course points qcoins freeDownloadsLeft lastLogin createdAt')
        .populate('roleId', 'name label color')
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
        roleId: u.roleId?._id ? String(u.roleId._id) : null,
        roleLabel: u.roleId?.label || null,
        roleColor: u.roleId?.color || null,
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
    const [total, active, admins, srt, staff, superAdmins, banned] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      User.countDocuments({ role: 'srt', isActive: true }),
      User.countDocuments({ role: 'staff', isActive: true }),
      User.countDocuments({ role: 'super-admin', isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

    res.json({
      success: true,
      data: { total, active, admins, srt, staff, superAdmins, banned },
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

    const user = await User.findById(id).populate('roleId', 'name label color').lean();
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
          roleId: user.roleId?._id ? String(user.roleId._id) : null,
          roleLabel: user.roleId?.label || null,
          roleColor: user.roleId?.color || null,
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
    const { role, roleId } = req.body;

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

    // Resolve the assignment: either a built-in role or a custom role document
    let nextRole = role;
    let nextRoleId = null;
    let roleLabelForMessage = role;

    if (roleId) {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        res.status(400).json({ success: false, message: 'Invalid role id' });
        return;
      }
      const customRole = await Role.findById(roleId).lean();
      if (!customRole) {
        res.status(404).json({ success: false, message: 'Custom role not found' });
        return;
      }
      if (customRole.isSystem) {
        res.status(400).json({ success: false, message: 'System roles cannot be assigned by id' });
        return;
      }
      nextRole = 'staff';
      nextRoleId = customRole._id;
      roleLabelForMessage = customRole.label;
    } else if (!VALID_ROLES.includes(role) || role === 'staff') {
      res.status(400).json({
        success: false,
        message: 'Provide a built-in role or a custom roleId',
      });
      return;
    }

    // Never allow removing the last super-admin
    if (target.role === 'super-admin' && nextRole !== 'super-admin') {
      const superAdminCount = await User.countDocuments({ role: 'super-admin' });
      if (superAdminCount <= 1) {
        res.status(400).json({ success: false, message: 'Cannot demote the last super admin' });
        return;
      }
    }

    target.role = nextRole;
    target.roleId = nextRoleId;
    await target.save();

    res.json({
      success: true,
      message: `Role updated to ${roleLabelForMessage}`,
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating role' });
  }
};

/**
 * Create a new user from the admin console (super-admin only). Every account
 * gets a password here — students self-register instead. Custom roles are
 * assigned by roleId, built-ins by role name.
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, roleId, studentId, phoneNumber, course } = req.body;

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : '';

    if (cleanName.length < 2 || cleanName.length > 60) {
      res.status(400).json({ success: false, message: 'Name must be 2-60 characters' });
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      res.status(400).json({ success: false, message: 'Enter a valid email address' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }
    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      res.status(400).json({ success: false, message: 'Enter a valid 10-digit phone number' });
      return;
    }

    // Resolve the role assignment
    let nextRole;
    let nextRoleId = null;

    if (roleId) {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        res.status(400).json({ success: false, message: 'Invalid role id' });
        return;
      }
      const customRole = await Role.findById(roleId).lean();
      if (!customRole) {
        res.status(404).json({ success: false, message: 'Custom role not found' });
        return;
      }
      if (customRole.isSystem) {
        res.status(400).json({ success: false, message: 'System roles cannot be assigned by id' });
        return;
      }
      nextRole = 'staff';
      nextRoleId = customRole._id;
    } else {
      if (!VALID_ROLES.includes(role) || role === 'staff') {
        res.status(400).json({
          success: false,
          message: `Role must be one of: ${VALID_ROLES.filter((r) => r !== 'staff').join(', ')}, or a custom roleId`,
        });
        return;
      }
      nextRole = role;
    }

    const existing = await User.findOne({ email: cleanEmail }).select('_id').lean();
    if (existing) {
      res.status(409).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: nextRole,
      roleId: nextRoleId,
      studentId: typeof studentId === 'string' ? studentId.trim() : '',
      phoneNumber: cleanPhone,
      course: typeof course === 'string' ? course.trim() : '',
      isActive: true,
      lastLogin: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Created ${user.email} with role ${nextRole === 'staff' ? 'custom role' : nextRole}`,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, roleId: user.roleId },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating user' });
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

// Permanently delete a user (super-admin only).
// Blocks self-deletion and other super-admin accounts; removes content the
// user authored (reports, bug reports, points history). Uploaded PYQ papers
// are intentionally kept — their uploadedBy reference simply renders as
// "System"/"User" in the UIs.
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user id' });
      return;
    }

    if (String(id) === String(req.user.id)) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }

    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (target.role === 'super-admin') {
      res.status(403).json({
        success: false,
        message: 'Super-admin accounts cannot be deleted. Demote the account first.',
      });
      return;
    }

    await Promise.all([
      Report.deleteMany({ reportedBy: id }),
      Bug.deleteMany({ reportedBy: id }),
      PointsLog.deleteMany({ userId: id }),
    ]);
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Deleted ${target.email}. Their reports and points history were removed; uploaded papers were kept.`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
};
