import express from 'express';
import { getEvents, getEventById, getAllEventsAdmin, createEvent, updateEvent, deleteEvent, uploadEventImage } from '../controllers/eventController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────
router.get('/', getEvents); // published only

// ── Admin console (must be registered before /:id) ─────────────────────
router.get('/manage/all', authenticateJWT, requirePermission('events.view'), getAllEventsAdmin);

router.get('/:id', getEventById); // published only
router.post('/', authenticateJWT, requirePermission('events.manage'), createEvent);
router.put('/:id', authenticateJWT, requirePermission('events.manage'), updateEvent);
router.delete('/:id', authenticateJWT, requirePermission('events.manage'), deleteEvent);
router.post('/upload-image', authenticateJWT, requirePermission('events.manage'), uploadLimiter, uploadImage.single('image'), uploadEventImage);

export default router;
