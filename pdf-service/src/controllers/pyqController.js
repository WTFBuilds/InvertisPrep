import mongoose from 'mongoose';
import { PDFDocument } from '../models/PDFDocument.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';
import { logActivity, hasRecentEvent, VIEW_DEDUPE_MS, DOWNLOAD_DEDUPE_MS, SEARCH_DEDUPE_MS } from '../services/activityService.js';
import fs from 'fs/promises';

// Points logic is simplified for PDF service or call main server if needed
// For now we'll just skip points or assume main server handles it via webhook
const awardPoints = async (userId, points, type, description) => {
  console.log(`[Points] Should award ${points} points to ${userId} for ${type}: ${description}`);
};

// The caller id may surface as `_id` (optional-user attach, fresh DB lookup)
// or `id` (legacy Redis cache entries) — normalize so activity attribution
// can't be silently dropped when the field a controller reads is missing.
const callerId = (req) => req?.user?._id || req?.user?.id || null;

// Sanitize the multi-branch tags sent by the upload form (JSON string from
// FormData, a comma-separated list, or an array) — strings only, deduped,
// primary branch excluded, capped at 20.
const parseAdditionalBranchIds = (raw, primaryBranchId) => {
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(',').map((s) => s.trim());
    }
  }
  if (!Array.isArray(list)) return [];
  return [
    ...new Set(
      list
        .filter((id) => typeof id === 'string' && id.trim() && id !== primaryBranchId)
        .map((id) => id.trim()),
    ),
  ].slice(0, 20);
};

// Upload PYQ (admin only)
export const uploadPYQ = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const {
      departmentId,
      branchId,
      additionalBranchIds,
      sessionId,
      semester,
      subjectName,
      subjectCode,
      examType,
      year,
    } = req.body;

    // Validate required fields
    if (!departmentId || !branchId || !sessionId || !semester || !subjectName || !examType || !year) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Upload to Cloudinary
    const { cloudinaryUrl, cloudinaryPublicId, fileSize } = await uploadPDF(req.file.path, {
      subjectCode,
      examType,
    });

    // Create title
    const title = `${subjectName} ${examType} ${year}`;

    // Create PDFDocument (PYQ) document
    const pyq = await PDFDocument.create({
      title,
      subjectName,
      subjectCode: subjectCode || undefined,
      departmentId,
      branchId,
      additionalBranchIds: parseAdditionalBranchIds(additionalBranchIds, branchId),
      sessionId,
      semester: parseInt(semester.toString()),
      examType,
      year: parseInt(year.toString()),
      cloudinaryUrl,
      cloudinaryPublicId,
      fileName: req.file.originalname,
      fileSize,
      uploadedBy: req.user.id,
      verified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (error) {
    console.error('Upload PYQ error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};

// Get filtered PYQs (public)
export const getPYQs = async (req, res) => {
  try {
    // Coerce query params to plain strings — blocks operator injection
    // (e.g. ?departmentId[$ne]=x turning the filter into a Mongo operator)
    const asString = (v) => (typeof v === 'string' && v.length > 0 ? v : undefined);
    const departmentId = asString(req.query.departmentId);
    const branchId = asString(req.query.branchId);
    const sessionId = asString(req.query.sessionId);
    const semester = asString(req.query.semester);
    const examType = asString(req.query.examType);
    const subjectCode = asString(req.query.subjectCode);
    const search = asString(req.query.search);

    const escapeRegex = (string) => {
      if (typeof string !== 'string') return '';
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    // Separator-tolerant pattern: matches the query's alphanumerics in order
    // allowing any punctuation/spaces between them, so "BAS301", "BAS 301"
    // and "BAS-301" all match each other (and "b.tech" ↔ "btech").
    const loosePattern = (string) => {
      if (typeof string !== 'string') return '';
      const chars = string.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!chars) return '';
      return chars.split('').map(escapeRegex).join('[^a-z0-9]*');
    };

    // Build dynamic filter
    const filter = { verified: true, isActive: true };
    if (departmentId) filter.departmentId = departmentId;
    if (branchId) {
      // A paper is visible under a branch when it is its primary branch or
      // one of its additional branches (multi-branch uploads). Wrapped in
      // $and so it never collides with the $or the search filter sets below.
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ branchId }, { additionalBranchIds: branchId }] },
      ];
    }
    if (sessionId) filter.sessionId = sessionId;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;

    if (subjectCode) {
      const pattern = loosePattern(subjectCode);
      if (pattern) filter.subjectCode = new RegExp(pattern, 'i');
    }

    if (search) {
      const pattern = loosePattern(search);
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        filter.$or = [{ subjectName: regex }, { subjectCode: regex }];
      }
    }

    const pyqs = await PDFDocument.find(filter, { cloudinaryUrl: 0, cloudinaryPublicId: 0 })
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('sessionId', 'name startYear endYear')
      .populate('uploadedBy', 'name email picture')
      .sort({ year: -1, downloads: -1 })
      .limit(100)
      .lean();

    // Search analytics — attribute the query to the caller when a token is
    // present (the route is public, so guests are skipped). Deduped so
    // keystroke-level refetches don't flood the trail.
    if (search && callerId(req)) {
      const queryKey = search.trim().toLowerCase().slice(0, 64);
      const seen = await hasRecentEvent({ userId: callerId(req), type: 'search', entityId: queryKey, withinMs: SEARCH_DEDUPE_MS });
      if (!seen) {
        logActivity(
          {
            user: callerId(req),
            type: 'search',
            entityId: queryKey,
            title: search.trim().slice(0, 120),
            path: '/pyq',
          },
          req
        );
      }
    }

    res.json({ success: true, count: pyqs.length, data: pyqs });
  } catch (error) {
    console.error('Get PYQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all PYQs (admin only)
export const getAllPYQs = async (req, res) => {
  try {
    const { page = '1', limit = '100', verified, search } = req.query;
    const pageNum = Math.max(parseInt(page.toString(), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit.toString(), 10) || 100, 1), 1000);

    const skip = (pageNum - 1) * pageSize;
    const filter = { isActive: true };

    if (verified === 'true') filter.verified = true;
    else if (verified === 'false') filter.verified = false;

    // Case/separator-tolerant search across subject name + subject code (and
    // department name) - "BAS 301" matches "BAS301", "math" matches
    // "Mathematics", so the manage-papers search actually finds anything.
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (q) {
        const pattern = q.split('').map(escapeRegex).join('[^a-z0-9]*');
        const regex = new RegExp(pattern, 'i');
        filter.$or = [
          { subjectName: regex },
          { subjectCode: regex },
          { departmentName: regex },
        ];
      }
    }

    const [total, papers] = await Promise.all([
      PDFDocument.countDocuments(filter),
      PDFDocument.find(filter)
        .populate('departmentId', 'name displayName')
        .populate('branchId', 'name')
        .populate('additionalBranchIds', 'name')
        .populate('sessionId', 'name')
        .populate('uploadedBy', 'name email picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);


    res.json({ success: true, count: papers.length, total, page: pageNum, pageSize, data: papers });
  } catch (error) {
    console.error('Get all PYQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Track download
export const trackDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const pyq = await PDFDocument.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true })
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name');

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    // Land the download in the shared activity trail (deduped — a double-click
    // shouldn't read as two downloads).
    const seen = await hasRecentEvent({ userId: callerId(req), type: 'paper_download', entityId: id, withinMs: DOWNLOAD_DEDUPE_MS });
    if (!seen) {
      logActivity(
        {
          user: callerId(req),
          type: 'paper_download',
          entityType: 'paper',
          entityId: id,
          title: pyq.subjectName ? `${pyq.subjectName} · ${pyq.year}` : 'Paper download',
          subjectName: pyq.subjectName,
          departmentName: pyq.departmentId?.displayName || pyq.departmentId?.name || '',
          branchName: pyq.branchId?.name || '',
          path: `/view/${id}`,
          meta: { year: pyq.year },
        },
        req
      );
    }

    res.json({ success: true, downloads: pyq.downloads });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Track view
export const trackView = async (req, res) => {
  try {
    const { id } = req.params;
    const pyq = await PDFDocument.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name');

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    // The per-user "what is he viewing" answer. Deduped on the 30-min window:
    // PDF viewers re-request documents frequently while scrolling.
    const seen = await hasRecentEvent({ userId: callerId(req), type: 'paper_view', entityId: id, withinMs: VIEW_DEDUPE_MS });
    if (!seen) {
      logActivity(
        {
          user: callerId(req),
          type: 'paper_view',
          entityType: 'paper',
          entityId: id,
          title: pyq.subjectName ? `${pyq.subjectName} · ${pyq.year}` : 'Paper view',
          subjectName: pyq.subjectName,
          departmentName: pyq.departmentId?.displayName || pyq.departmentId?.name || '',
          branchName: pyq.branchId?.name || '',
          path: `/view/${id}`,
          meta: { year: pyq.year },
        },
        req
      );
    }

    res.json({ success: true, views: pyq.views });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify PYQ (staff only)
export const verifyPYQ = async (req, res) => {
  try {
    const { id } = req.params;
    const pyqBefore = await PDFDocument.findById(id);
    if (!pyqBefore) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    const wasAlreadyVerified = pyqBefore.verified;

    const pyq = await PDFDocument.findByIdAndUpdate(
      id, 
      { $set: { verified: true } }, 
      { new: true }
    ).populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name');

    if (!wasAlreadyVerified && pyq.uploadedBy) {
      await awardPoints(pyq.uploadedBy, 50, 'upload', `Verified PYQ Upload: ${pyq.title}`);
    }

    res.json({ success: true, data: pyq });
  } catch (error) {
    console.error('Verify PYQ error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// Delete PYQ (admin only)
export const deletePYQ = async (req, res) => {
  try {
    const { id } = req.params;
    const pyq = await PDFDocument.findById(id);

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    if (pyq.cloudinaryPublicId) {
      await deletePDF(pyq.cloudinaryPublicId);
    }

    pyq.isActive = false;
    await pyq.save();

    res.json({ success: true, message: 'PYQ deleted successfully' });
  } catch (error) {
    console.error('Delete PYQ error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete paper' });
  }
};

// Update PYQ metadata (admin only)
export const updatePYQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectName, subjectCode, year, examType, semester, additionalBranchIds } = req.body;

    const pyq = await PDFDocument.findById(id);
    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    if (subjectName) pyq.subjectName = subjectName;
    if (subjectCode) pyq.subjectCode = subjectCode;
    if (year) pyq.year = parseInt(year);
    if (examType) pyq.examType = examType;
    if (semester) pyq.semester = parseInt(semester);
    if (additionalBranchIds !== undefined) {
      pyq.additionalBranchIds = parseAdditionalBranchIds(additionalBranchIds, pyq.branchId);
    }

    pyq.title = `${pyq.subjectName} ${pyq.examType} ${pyq.year}`;
    await pyq.save();

    const updated = await PDFDocument.findById(id)
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name')
      .populate('uploadedBy', 'name email picture');

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update PYQ error:', error);
    res.status(500).json({ success: false, message: 'Failed to update paper' });
  }
};

// Public upload PYQ
export const uploadPYQPublic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    // Rate Limit could be added here via Redis

    const {
      departmentId,
      branchId,
      additionalBranchIds,
      sessionId,
      semester,
      subjectName,
      subjectCode,
      examType,
      year,
    } = req.body;

    if (!departmentId || !branchId || !sessionId || !semester || !subjectName || !examType || !year) {
      try { await fs.unlink(req.file.path); } catch {}
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { cloudinaryUrl, cloudinaryPublicId, fileSize } = await uploadPDF(req.file.path, {
      subjectCode,
      examType,
    });

    const title = `${subjectName} ${examType} ${year}`;

    const pyq = await PDFDocument.create({
      title,
      subjectName,
      subjectCode: subjectCode || undefined,
      departmentId,
      branchId,
      additionalBranchIds: parseAdditionalBranchIds(additionalBranchIds, branchId),
      sessionId,
      semester: parseInt(semester.toString()),
      examType,
      year: parseInt(year.toString()),
      cloudinaryUrl,
      cloudinaryPublicId,
      fileName: req.file.originalname,
      fileSize,
      uploadedBy: req.user.id,
      verified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (error) {
    console.error('Public Upload PYQ error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};

// Get daily upload count
export const getDailyUploadCount = async (req, res) => {
  try {
    const dailyLimit = 10;
    // Staff accounts (including custom roles) upload for the platform, not for
    // themselves, so the per-user daily limit doesn't apply to them.
    if (['admin', 'super-admin', 'srt', 'staff'].includes(req.user.role)) {
      return res.json({ success: true, data: { count: 0, limit: dailyLimit, isExempt: true } });
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const startOfDayIST = new Date(now.getTime() + istOffset);
    startOfDayIST.setUTCHours(0, 0, 0, 0);
    const startOfDayUTC = new Date(startOfDayIST.getTime() - istOffset);

    const count = await PDFDocument.countDocuments({
      uploadedBy: new mongoose.Types.ObjectId(req.user.id),
      createdAt: { $gte: startOfDayUTC },
    });

    res.json({ success: true, data: { count, limit: dailyLimit, isExempt: false } });
  } catch (error) {
    console.error('Get daily upload count error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving upload count' });
  }
};