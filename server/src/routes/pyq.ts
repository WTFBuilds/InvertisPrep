import express from 'express';
import {
  searchPapers,
  getPaperById,
  trackDownload,
} from '../controllers/pyqController.js';

const router = express.Router();

// GET /api/pyq/search - Search papers with filters
router.get('/search', searchPapers);

// GET /api/pyq/:id - Get single paper
router.get('/:id', getPaperById);

// POST /api/pyq/:id/download - Track download
router.post('/:id/download', trackDownload);

export default router;
