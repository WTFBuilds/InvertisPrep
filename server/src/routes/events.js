import express from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, uploadEventImage } from '../controllers/eventController.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticateJWT, isAdmin, createEvent);
router.put('/:id', authenticateJWT, isAdmin, updateEvent);
router.delete('/:id', authenticateJWT, isAdmin, deleteEvent);
router.post('/upload-image', authenticateJWT, isAdmin, uploadLimiter, uploadImage.single('image'), uploadEventImage);

export default router;
