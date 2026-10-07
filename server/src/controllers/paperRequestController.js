import mongoose from 'mongoose';
import { PaperRequest } from '../models/PaperRequest.js';
import { User } from '../models/User.js';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    const validExamType = ['any', 'mid-term', 'end-term'].includes(examType)
      ? examType
      : 'any';

    const parsedYear = year ? parseInt(year, 10) : undefined;
    if (parsedYear && (parsedYear < 2000 || parsedYear > 2100)) {
      res.status(400).json({ success: false, message: 'Enter a valid year' });
      return;
    }

    const request = await PaperRequest.create({
      departmentId,
      branchId,
      subjectName: subjectName.trim().slice(0, 120),
      subjectCode: typeof subjectCode === 'string' ? subjectCode.trim().slice(0, 40) : undefined,
      examType: validExamType,
      year: parsedYear,
      note: typeof note === 'string' ? note.trim().slice(0, 500) : undefined,
      requestedBy: req.user.id,
    });

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
