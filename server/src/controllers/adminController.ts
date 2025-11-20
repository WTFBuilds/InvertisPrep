import { Request, Response } from 'express';
import { PYQPaper, Department, Branch, Session, User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';
import { UploadPaperDTO, UpdatePaperDTO } from '../types/index.js';

/**
 * @route   POST /api/admin/pyq/upload
 * @desc    Upload new PYQ paper
 * @access  Private (Admin)
 */
export const uploadPaper = asyncHandler(
  async (req: Request, res: Response) => {
    // Check if file exists
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }

    const {
      title,
      subjectCode,
      subjectName,
      departmentId,
      branchId,
      semester,
      sessionId,
      examType,
      tags,
    } = req.body as UploadPaperDTO & { tags?: string };

    // Validate required fields
    if (!departmentId || !branchId || !semester || !sessionId || !subjectName || !examType) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['departmentId', 'branchId', 'semester', 'sessionId', 'subjectName', 'examType'],
      });
      return;
    }

    // Verify department, branch, and session exist
    const [department, branch, session] = await Promise.all([
      Department.findById(departmentId),
      Branch.findById(branchId),
      Session.findById(sessionId),
    ]);

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    if (!branch) {
      res.status(404).json({ error: 'Branch not found for this department' });
      return;
    }
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Upload to Cloudinary with proper IDs for folder structure
    const cloudinaryResult = await uploadPDF(
      req.file.path,
      {
        departmentId: department.id, // Use the 'id' field (e.g., 'btech')
        branchId: branch.id,         // Use the 'id' field (e.g., 'cse')
        semester: parseInt(semester.toString()),
        sessionId: session.id,       // Use the 'id' field (e.g., '2023-24-odd')
        subjectCode,
        examType,
      },
      subjectName
    );

    // Create paper document with MongoDB ObjectIds
    const paper = await PYQPaper.create({
      title: title || `${subjectName} ${examType}`,
      subjectCode,
      subjectName,
      departmentId: department._id, // Store MongoDB ObjectId
      branchId: branch._id,         // Store MongoDB ObjectId
      semester: parseInt(semester.toString()),
      sessionId: session._id,       // Store MongoDB ObjectId
      examType,
      cloudinaryUrl: cloudinaryResult.url,
      cloudinaryPublicId: cloudinaryResult.publicId,
      cloudinaryFolder: `invertis/pyq/${department.id}/${branch.id}/${session.id}/sem${semester}`,
      fileSize: cloudinaryResult.fileSize,
      pageCount: cloudinaryResult.pages,
      uploadedBy: req.user!._id,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
    });

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully',
      paper: {
        id: paper._id,
        title: paper.title,
        subjectName: paper.subjectName,
        cloudinaryUrl: paper.cloudinaryUrl,
        createdAt: paper.createdAt,
      },
    });
  }
);

/**
 * @route   PUT /api/admin/pyq/:id
 * @desc    Update paper metadata
 * @access  Private (Admin)
 */
export const updatePaper = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as UpdatePaperDTO;

    // Don't allow updating certain fields
    const allowedUpdates: (keyof UpdatePaperDTO)[] = [
      'title',
      'subjectCode',
      'subjectName',
      'examType',
      'tags',
      'isActive',
    ];

    const updateData: any = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key as keyof UpdatePaperDTO)) {
        updateData[key] = updates[key as keyof UpdatePaperDTO];
      }
    });

    const paper = await PYQPaper.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!paper) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Paper updated successfully',
      paper,
    });
  }
);

/**
 * @route   DELETE /api/admin/pyq/:id
 * @desc    Delete paper
 * @access  Private (Admin)
 */
export const deletePaper = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const paper = await PYQPaper.findById(id);

    if (!paper) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    // Delete from Cloudinary
    await deletePDF(paper.cloudinaryPublicId);

    // Soft delete (set isActive to false)
    paper.isActive = false;
    await paper.save();

    // Or hard delete:
    // await paper.deleteOne();

    res.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  }
);

/**
 * @route   GET /api/admin/papers
 * @desc    Get all papers (for admin management)
 * @access  Private (Admin)
 */
export const getAllPapers = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, departmentId } = req.query;

    const query: any = {};
    if (search) {
      query.$text = { $search: search as string };
    }
    if (departmentId) {
      query.departmentId = departmentId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [papers, total] = await Promise.all([
      PYQPaper.find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PYQPaper.countDocuments(query),
    ]);

    res.json({
      success: true,
      papers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get admin statistics
 * @access  Private (Admin)
 */
export const getStatistics = asyncHandler(
  async (_req: Request, res: Response) => {
    const [
      totalPapers,
      totalDownloads,
      totalUsers,
      totalDepartments,
      totalBranches,
      popularPapers,
      recentUploads,
    ] = await Promise.all([
      PYQPaper.countDocuments({ isActive: true }),
      PYQPaper.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$downloads' } } },
      ]),
      User.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Branch.countDocuments({ isActive: true }),
      PYQPaper.find({ isActive: true })
        .select('title subjectName downloads views')
        .sort({ downloads: -1 })
        .limit(10),
      PYQPaper.find({ isActive: true })
        .select('title subjectName createdAt')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      statistics: {
        totalPapers,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalUsers,
        totalDepartments,
        totalBranches,
        popularPapers,
        recentUploads,
      },
    });
  }
);
