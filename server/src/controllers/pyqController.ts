import { Request, Response } from 'express';
import { PYQPaper } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SearchPapersQuery } from '../types/index.js';

/**
 * @route   GET /api/pyq/search
 * @desc    Search PYQ papers with filters
 * @access  Public
 */
export const searchPapers = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      departmentId,
      branchId,
      semester,
      sessionId,
      search,
      page = 1,
      limit = 20,
    } = req.query as SearchPapersQuery;

    // Build query
    const query: any = { isActive: true };

    if (departmentId) query.departmentId = departmentId;
    if (branchId) query.branchId = branchId;
    if (semester) query.semester = parseInt(semester.toString());
    if (sessionId) query.sessionId = sessionId;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [papers, total] = await Promise.all([
      PYQPaper.find(query)
        .select('-searchText -__v')
        .populate('uploadedBy', 'name')
        .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
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
 * @route   GET /api/pyq/:id
 * @desc    Get single paper by ID
 * @access  Public
 */
export const getPaperById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const paper = await PYQPaper.findById(id)
      .select('-searchText -__v')
      .populate('uploadedBy', 'name');

    if (!paper || !paper.isActive) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    // Increment views
    paper.views += 1;
    await paper.save();

    res.json({ 
      success: true,
      paper 
    });
  }
);

/**
 * @route   POST /api/pyq/:id/download
 * @desc    Track download and return download URL
 * @access  Public
 */
export const trackDownload = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const paper = await PYQPaper.findById(id);

    if (!paper || !paper.isActive) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    // Increment download counter
    paper.downloads += 1;
    await paper.save();

    res.json({
      success: true,
      downloadUrl: paper.cloudinaryUrl,
      fileName: `${paper.subjectName}_${paper.examType}_${paper.sessionId}.pdf`,
    });
  }
);
