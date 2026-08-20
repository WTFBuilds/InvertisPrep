import { Router } from 'express';
import { viewPDF, downloadPDF } from '../controllers/pdfController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Protected route to view PDF with watermark
router.get('/view/:id', authenticateJWT, viewPDF);

// Protected route to download PDF with watermark
router.get('/download/:id', authenticateJWT, downloadPDF);

export default router;
