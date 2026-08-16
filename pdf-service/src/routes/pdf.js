import { Router } from 'express';
import { viewPDF, downloadPDF } from '../controllers/pdfController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { pdfLimiter } from '../middleware/rateLimit.js';
import { pdfViewSchema } from '../middleware/validation.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.get('/view/:id', pdfLimiter, authenticateJWT, validate(pdfViewSchema), viewPDF);
router.get('/download/:id', pdfLimiter, authenticateJWT, validate(pdfViewSchema), downloadPDF);

export default router;