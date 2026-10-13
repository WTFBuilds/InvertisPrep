import mongoose from 'mongoose';
import { PaperRequest } from '../models/PaperRequest.js';
import { PYQPaper } from '../models/PYQPaper.js';
import { sendPaperRequestAck, sendPaperRequestFulfilled } from '../services/mailService.js';
import { logActivity } from '../services/activityService.js';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Separator-tolerant, case-insensitive matcher for subject codes: matches the
// code's alphanumerics in order, allowing any spaces/punctuation between them.
// "BAS301", "BAS 301" and "BAS-301" then all match the same paper.
const looseCodeRegex = (str) => {
  const chars = String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!chars) return null;
  return new RegExp(`^${chars.split('').map(escapeRegExp).join('[^a-z0-9]*')}$`, 'i');
};

const EXAM_TERMS = ['mid-term', 'end-term'];

// Look for an existing verified paper that matches the exact paper a student
// is about to request. A subject-code hit alone is NOT enough — the paper is
// only "already there" when the code AND year line up, and:
//   • a specific term was chosen → that same term must exist;
//   • "any" was chosen → both the mid-term AND end-term must exist, otherwise
//     the student may still be missing one of the two and should be able to
//     request it.
export const checkExistingPaper = async (req, res) => {
  try {
    const asString = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    const subjectCode = asString(req.query.subjectCode);
    const examType = asString(req.query.examType);
    const year = asString(req.query.year);
    const departmentId = asString(req.query.departmentId);

    if (!subjectCode) {
      res.status(400).json({ success: false, message: 'Subject code is required to check' });
      return;
    }

    const codeRegex = looseCodeRegex(subjectCode);
    if (!codeRegex) {
      res.status(400).json({ success: false, message: 'Enter a valid subject code' });
      return;
    }

    const baseFilter = {
      verified: true,
      isActive: true,
      subjectCode: codeRegex,
    };
    // Year is required on a paper, so without one we can't identify an exact paper.
    const parsedYear = year ? parseInt(year, 10) : undefined;
    if (parsedYear) baseFilter.year = parsedYear;
    if (departmentId) baseFilter.departmentId = departmentId;

    // Which terms already exist for this code (+year/department).
    const matches = await PYQPaper.find(
      baseFilter,
      { cloudinaryUrl: 0, cloudinaryPublicId: 0 }
    )
      .populate('departmentId', 'name displayName id icon')
      .populate('branchId', 'name')
      .populate('sessionId', 'name startYear endYear')
      .sort({ year: -1 })
      .lean();

    const existingExamTypes = [...new Set(matches.map((p) => p.examType))];

    if (examType && examType !== 'any') {
      // Specific term: blocked iff that exact term already exists.
      const match = matches.find((p) => p.examType === examType) || null;
      if (match) {
        res.json({
          success: true,
          exists: true,
          alreadyRequested: false,
          data: match,
          existingExamTypes,
        });
        return;
      }
    } else {
      const hasBothTerms = EXAM_TERMS.every((t) => existingExamTypes.includes(t));
      if (hasBothTerms) {
        res.json({
          success: true,
          exists: true,
          alreadyRequested: false,
          data: matches[0] || null,
          existingExamTypes,
        });
        return;
      }
    }

    // Check if another student has already requested this exact paper and it is pending
    let pendingRequest = null;
    if (parsedYear) {
      const requestFilter = {
        status: 'pending',
        subjectCode: codeRegex,
        year: parsedYear,
      };
      if (departmentId) requestFilter.departmentId = departmentId;
      if (examType && examType !== 'any') {
        requestFilter.$or = [{ examType }, { examType: 'any' }];
      }

      pendingRequest = await PaperRequest.findOne(requestFilter)
        .populate('requestedBy', 'name email picture')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (pendingRequest) {
      res.json({
        success: true,
        exists: false,
        alreadyRequested: true,
        data: null,
        existingRequest: pendingRequest,
        existingExamTypes,
      });
      return;
    }

    res.json({
      success: true,
      exists: false,
      alreadyRequested: false,
      data: null,
      existingExamTypes,
    });
  } catch (error) {
    console.error('Check existing paper error:', error);
    res.status(500).json({ success: false, message: 'Server error while checking for the paper' });
  }
};

// Students (any logged-in user) request a paper they couldn't find.
export const createRequest = async (req, res) => {
  try {
    const {
      departmentId,
      branchId,
      subjectName,
      subjectCode,
      examType,
      year,
      note,
    } = req.body;

    if (
      !departmentId || !branchId ||
      typeof subjectName !== 'string' || !subjectName.trim()
    ) {
      res.status(400).json({ success: false, message: 'Department, branch and subject name are required' });
      return;
    }

    if (typeof subjectCode !== 'string' || !subjectCode.trim()) {
      res.status(400).json({ success: false, message: 'Subject code is required' });
      return;
    }

    const validExamType = ['any', 'mid-term', 'end-term'].includes(examType)
      ? examType
      : 'any';

    const parsedYear = year === 0 || year ? parseInt(year, 10) : NaN;
    if (Number.isNaN(parsedYear)) {
      res.status(400).json({ success: false, message: 'Year is required' });
      return;
    }
    if (parsedYear < 2000 || parsedYear > 2100) {
      res.status(400).json({ success: false, message: 'Enter a valid year (2000–2100)' });
      return;
    }

    // Don't accept a request for a paper we already have. Match the exact
    // paper by subject code (separator-insensitive) + year, and:
    //   • specific term chosen → block only if that same term exists;
    //   • "any" chosen → block only if BOTH terms exist (otherwise the student
    //     may still be missing one of the two and should be able to request it).
    const codeRegex = looseCodeRegex(subjectCode.trim());
    const existingFilter = {
      verified: true,
      isActive: true,
      subjectCode: codeRegex,
      year: parsedYear,
    };

    let alreadyHaveIt = false;
    let existingPaperId = null;
    if (validExamType !== 'any') {
      const hit = await PYQPaper.findOne(
        { ...existingFilter, examType: validExamType },
        { _id: 1 },
      ).lean();
      if (hit) {
        alreadyHaveIt = true;
        existingPaperId = hit._id;
      }
    } else {
      const terms = await PYQPaper.distinct('examType', existingFilter);
      if (EXAM_TERMS.every((t) => terms.includes(t))) {
        alreadyHaveIt = true;
        const hit = await PYQPaper.findOne(existingFilter, { _id: 1 }).lean();
        existingPaperId = hit?._id ?? null;
      }
    }

    if (alreadyHaveIt) {
      res.status(409).json({
        success: false,
        code: 'PAPER_EXISTS',
        message: 'This paper already exists on InvertisPrep.',
        paperId: existingPaperId,
      });
      return;
    }

    // Check if another student has already requested this paper (matching department, code, year, examType)
    const duplicateRequestFilter = {
      status: 'pending',
      subjectCode: codeRegex,
      year: parsedYear,
    };
    if (departmentId) duplicateRequestFilter.departmentId = departmentId;
    if (validExamType !== 'any') {
      duplicateRequestFilter.$or = [{ examType: validExamType }, { examType: 'any' }];
    }

    const existingPendingRequest = await PaperRequest.findOne(duplicateRequestFilter)
      .populate('requestedBy', 'name email picture')
      .sort({ createdAt: -1 })
      .lean();

    if (existingPendingRequest) {
      const isSameUser = String(existingPendingRequest.requestedBy?._id || existingPendingRequest.requestedBy?.id || existingPendingRequest.requestedBy) === String(req.user.id || req.user._id);
      const requesterName = isSameUser ? 'You' : (existingPendingRequest.requestedBy?.name || 'Another student');
      res.status(409).json({
        success: false,
        code: 'REQUEST_EXISTS',
        message: isSameUser
          ? 'You have already submitted a request for this paper! Our team is working on it.'
          : `This paper has already been requested by ${requesterName}. Our team is working on it!`,
        existingRequest: existingPendingRequest,
      });
      return;
    }

    const request = await PaperRequest.create({
      departmentId,
      branchId,
      subjectName: subjectName.trim().slice(0, 120),
      subjectCode: subjectCode.trim().slice(0, 40),
      examType: validExamType,
      year: parsedYear,
      note: typeof note === 'string' ? note.trim().slice(0, 500) : undefined,
      requestedBy: req.user.id,
    });

    // Acknowledgement email — "we got your request, here's what you asked for".
    // Toggled from the admin Mail section; never blocks the response.
    sendPaperRequestAck(req.user, request).catch((err) =>
      console.error('[mail] paper-request ack failed:', err?.message)
    );

    logActivity(
      {
        user: req.user.id,
        type: 'request_create',
        entityType: 'paper-request',
        entityId: request._id,
        title: `${request.subjectName}${request.subjectCode ? ` (${request.subjectCode})` : ''} · ${request.year}`,
        path: '/pyq',
        meta: { examType: request.examType, year: request.year },
      },
      req
    );

    res.status(201).json({
      success: true,
      message: 'Request submitted! Our team will look for this paper.',
      data: request,
    });
  } catch (error) {
    console.error('Create paper request error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting request' });
  }
};

// Staff listing — SRT, admin and super-admin can see who requested what.
export const listRequests = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status === 'pending' || status === 'fulfilled' || status === 'rejected') {
      filter.status = status;
    }
    if (search && String(search).trim()) {
      const q = escapeRegExp(String(search).trim());
      filter.$or = [
        { subjectName: { $regex: q, $options: 'i' } },
        { subjectCode: { $regex: q, $options: 'i' } },
      ];
    }

    const requests = await PaperRequest.find(filter)
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('requestedBy', 'name email picture')
      .populate('reviewedBy', 'name email')
      .sort({ status: 1, createdAt: -1 }) // pending first, newest on top
      .limit(300)
      .lean();

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('List paper requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin + super-admin triage a request.
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'fulfilled', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid request id' });
      return;
    }

    const updated = await PaperRequest.findByIdAndUpdate(
      id,
      { $set: { status, reviewedBy: req.user.id } },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Fulfillment email — "your paper is ready". Only when marking fulfilled,
    // and only to the requester. Toggled from the admin Mail section; never
    // blocks the status change.
    if (status === 'fulfilled' && updated.requestedBy) {
      const { User } = await import('../models/User.js');
      const requester = await User.findById(updated.requestedBy).select('email name').lean();
      if (requester) {
        sendPaperRequestFulfilled(requester, updated).catch((err) =>
          console.error('[mail] paper-request fulfilled failed:', err?.message)
        );
      }
    }

    res.json({ success: true, message: `Request marked ${status}`, data: updated });
  } catch (error) {
    console.error('Update paper request status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating request' });
  }
};

// Only super-admin can permanently remove a request.
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid request id' });
      return;
    }

    const deleted = await PaperRequest.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    res.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    console.error('Delete paper request error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting request' });
  }
};

// ── Student-facing: my requests + reply on the ticket thread ────────────────

// GET /api/paper-requests/mine — the requesting student's own paper requests.
export const myRequests = async (req, res) => {
  try {
    const requests = await PaperRequest.find({ requestedBy: req.user._id ?? req.user.id })
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('requestedBy', 'name email picture')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('My paper requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/paper-requests/:id/reply — student or staff continues the ticket
// thread. Anyone with requests.manage (staff) may reply to any request; the
// requesting student may reply to their own. Body is validated and capped.
export const replyToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const body = typeof req.body?.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid request id' });
      return;
    }
    if (!body) {
      res.status(400).json({ success: false, message: 'Reply cannot be empty' });
      return;
    }

    // Staff can reply to any request; a student only to their own.
    const isStaffReply = req.user.permissions === 'all'
      || (Array.isArray(req.user.permissions) && req.user.permissions.includes('requests.manage'));
    const request = await PaperRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }
    const requestedById = String(request.requestedBy);
    const callerId = String(req.user._id ?? req.user.id);
    if (!isStaffReply && requestedById !== callerId) {
      res.status(403).json({ success: false, message: 'You can only reply to your own requests' });
      return;
    }

    request.messages.push({
      sender: callerId,
      senderRole: req.user.role || 'student',
      body,
    });
    await request.save();

    const populated = await PaperRequest.findById(id)
      .populate('departmentId', 'name displayName icon')
      .populate('branchId', 'name')
      .populate('requestedBy', 'name email picture')
      .populate('reviewedBy', 'name email')
      .populate('messages.sender', 'name email picture role')
      .lean();

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Reply to paper request error:', error);
    res.status(500).json({ success: false, message: 'Server error while replying' });
  }
};
