import mongoose from 'mongoose';
import { PDFDocument } from '../models/PDFDocument.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';
import fs from 'fs/promises';

// Points logic is simplified for PDF service or call main server if needed
// For now we'll just skip points or assume main server handles it via webhook
const awardPoints = async (userId, points, type, description) => {
  console.log(`[Points] Should award ${points} points to ${userId} for ${type}: ${description}`);
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

    // Build dynamic filter
    const filter = { verified: true, isActive: true };
    if (departmentId) filter.departmentId = departmentId;
    if (branchId) filter.branchId = branchId;
    if (sessionId) filter.sessionId = sessionId;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;
    
    if (subjectCode) {
      filter.subjectCode = new RegExp(escapeRegex(subjectCode), 'i');
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { subjectName: new RegExp(escapedSearch, 'i') },
        { subjectCode: new RegExp(escapedSearch, 'i') }
      ];
    }

    const pyqs = await PDFDocument.find(filter, { cloudinaryUrl: 0, cloudinaryPublicId: 0 })
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('sessionId', 'name startYear endYear')
      .populate('uploadedBy', 'name email picture')
      .sort({ year: -1, downloads: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: pyqs.length, data: pyqs });
  } catch (error) {
    console.error('Get PYQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all PYQs (admin only)
export const getAllPYQs = async (req, res) => {
  try {
    const { page = '1', limit = '100', verified } = req.query;
    const pageNum = Math.max(parseInt(page.toString(), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit.toString(), 10) || 100, 1), 1000);

    const skip = (pageNum - 1) * pageSize;
    const filter = { isActive: true };

    if (verified === 'true') filter.verified = true;
    else if (verified === 'false') filter.verified = false;

    const [total, papers] = await Promise.all([
      PDFDocument.countDocuments(filter),
      PDFDocument.find(filter)
        .populate('departmentId', 'name displayName')
        .populate('branchId', 'name')
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
    const pyq = await PDFDocument.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
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
    const pyq = await PDFDocument.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
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
    const { subjectName, subjectCode, year, examType, semester } = req.body;

    const pyq = await PDFDocument.findById(id);
    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found' });
    }

    if (subjectName) pyq.subjectName = subjectName;
    if (subjectCode) pyq.subjectCode = subjectCode;
    if (year) pyq.year = parseInt(year);
    if (examType) pyq.examType = examType;
    if (semester) pyq.semester = parseInt(semester);

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
    if (['admin', 'super-admin', 'srt'].includes(req.user.role)) {
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