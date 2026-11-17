import mongoose from 'mongoose';
import { Report } from '../models/Report.js';
import { PYQPaper } from '../models/PYQPaper.js';
import { logActivity } from '../services/activityService.js';

// Create a new report on a paper
export const createReport = async (req, res) => {
  try {
    const { paperId, reason, description } = req.body;
    const userId = req.user.id;

    if (!paperId || !reason) {
      res.status(400).json({ success: false, message: 'Paper ID and reason are required' });
      return;
    }

    // Verify paper exists
    const paper = await PYQPaper.findById(paperId);
    if (!paper) {
      res.status(404).json({ success: false, message: 'PYQ paper not found' });
      return;
    }

    try {
      const report = await Report.create({
        paperId,
        reportedBy: userId,
        reason,
        description,
      });

      logActivity(
        {
          user: userId,
          type: 'report_create',
          entityType: 'paper',
          entityId: String(paperId),
          title: paper.subjectName ? `Reported: ${paper.subjectName}` : 'Reported a paper',
          meta: { reason },
        },
        req
      );

      res.status(201).json({ success: true, data: report });
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ success: false, message: 'You have already reported this paper' });
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Server error during reporting' });
  }
};

// Get all reports (Admin only)
export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate({
        path: 'paperId',
        select: 'title subjectName subjectCode departmentId branchId semester sessionId examType year uploadedBy',
        populate: [
          { path: 'departmentId', select: 'displayName name' },
          { path: 'branchId', select: 'name' },
          { path: 'sessionId', select: 'name' },
          { path: 'uploadedBy', select: 'name email' }
        ]
      })
      .populate('reportedBy', 'name email picture')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

// Update report status (Admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    report.status = status;
    await report.save();

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating report status' });
  }
};

// ── Student-facing: my reports + reply on the ticket thread ─────────────────

// GET /api/reports/mine — the reporter's own paper reports (support tickets).
export const myReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id ?? req.user.id })
      .populate('paperId', 'subjectName subjectCode departmentId branchId year')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('My reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/reports/:id/reply — staff or the reporter continues the thread.
// Staff = anyone with reports.manage; the reporter may reply to their own.
export const replyToReport = async (req, res) => {
  try {
    const { id } = req.params;
    const body = typeof req.body?.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report id' });
      return;
    }
    if (!body) {
      res.status(400).json({ success: false, message: 'Reply cannot be empty' });
      return;
    }

    const isStaffReply = req.user.permissions === 'all'
      || (Array.isArray(req.user.permissions) && req.user.permissions.includes('reports.manage'));
    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }
    const reporterId = String(report.reportedBy);
    const callerId = String(req.user._id ?? req.user.id);
    if (!isStaffReply && reporterId !== callerId) {
      res.status(403).json({ success: false, message: 'You can only reply to your own reports' });
      return;
    }

    report.messages.push({
      sender: callerId,
      senderRole: req.user.role || 'student',
      body,
    });
    await report.save();

    const populated = await Report.findById(id)
      .populate('paperId', 'subjectName subjectCode departmentId branchId year')
      .populate('messages.sender', 'name email picture role')
      .lean();

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Reply to report error:', error);
    res.status(500).json({ success: false, message: 'Server error while replying' });
  }
};
