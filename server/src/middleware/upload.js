import multer from 'multer';
import path from 'path';

// Read a positive number from env (MB), falling back to `fallback`
const envMb = (key, fallback) => {
  const val = parseFloat(process.env[key]);
  return Number.isFinite(val) && val > 0 ? val * 1024 * 1024 : fallback * 1024 * 1024;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for PDF only
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Multer instance — max PDF size in MB from env (default 10MB)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: envMb('MAX_PDF_SIZE_MB', 10),
  },
});

// File filter for images only
const imageFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'));
  }
};

// Multer instance for image uploads — max image size in MB from env (default 5MB)
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: envMb('MAX_IMAGE_SIZE_MB', 5),
  },
});
