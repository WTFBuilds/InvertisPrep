import { Router } from 'express';
import { uploadPDFDocument } from '../controllers/uploadController.js';
import { authenticateJWT, isStaff } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import multer from 'multer';
import path from 'path';

const envMb = (key, fallback) => {
  const val = parseFloat(process.env[key]);
  return Number.isFinite(val) && val > 0 ? val * 1024 * 1024 : fallback * 1024 * 1024;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: envMb('MAX_PDF_SIZE_MB', 10),
  },
});

const router = Router();

router.post('/upload', authenticateJWT, isStaff, uploadLimiter, upload.single('pdf'), uploadPDFDocument);

export default router;