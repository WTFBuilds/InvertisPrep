import express from 'express';
import {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  uploadClubImage,
  upsertClubEvent,
  deleteClubEvent,
  registerForEvent,
  getRegistrations,
  getRegistrationStats,
  updateRegistration,
  deleteRegistration,
  createRegistration,
  getClubRegistrationSummary,
} from '../controllers/clubController.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// ── Admin registration routes ────────────────────────────────────────────
// These live under /admin/... and MUST be declared before the `/:id`
// routes below — Express matches in declaration order, so a `/:id` route
// placed first would swallow "/admin/registrations" and try to look up
// a club with the slug "admin".

router.get(
  '/admin/registrations',
  authenticateJWT,
  requirePermission('clubs.view'),
  getRegistrations
);
router.get(
  '/admin/registrations/stats',
  authenticateJWT,
  requirePermission('clubs.view'),
  getRegistrationStats
);
router.get(
  '/admin/registrations/summary',
  authenticateJWT,
  requirePermission('clubs.view'),
  getClubRegistrationSummary
);
router.post(
  '/admin/registrations',
  authenticateJWT,
  requirePermission('clubs.manage'),
  createRegistration
);
router.put(
  '/admin/registrations/:registrationId',
  authenticateJWT,
  requirePermission('clubs.manage'),
  updateRegistration
);
router.delete(
  '/admin/registrations/:registrationId',
  authenticateJWT,
  requirePermission('clubs.manage'),
  deleteRegistration
);

// ── Admin club routes ────────────────────────────────────────────────────

router.post('/', authenticateJWT, requirePermission('clubs.manage'), createClub);
router.put('/:id', authenticateJWT, requirePermission('clubs.manage'), updateClub);
router.delete('/:id', authenticateJWT, requirePermission('clubs.manage'), deleteClub);
router.post(
  '/upload-image',
  authenticateJWT,
  requirePermission('clubs.manage'),
  uploadLimiter,
  uploadImage.single('image'),
  uploadClubImage
);

// Event sub-resource — a club's events are edited individually so a
// change to one does not require resending the whole club document.
router.put('/:id/events', authenticateJWT, requirePermission('clubs.manage'), upsertClubEvent);
router.delete(
  '/:id/events/:eventId',
  authenticateJWT,
  requirePermission('clubs.manage'),
  deleteClubEvent
);

// ── Public ───────────────────────────────────────────────────────────────
// Reading the club list and a single club page is open to everyone.
// The RSVP POST is also public — that is the whole point of it — but it
// is rate limited below so it cannot be abused to flood the database.

router.get('/', getClubs);
router.get('/:id', getClubById);
router.post('/:id/register', registerForEvent);

export default router;
