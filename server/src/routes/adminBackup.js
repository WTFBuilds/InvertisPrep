import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, isSuperAdmin } from '../middleware/auth.js';
import {
  getStats,
  startBackupToUri,
  exportBackup,
  importChunk,
  importParse,
  importConfirm,
  getJobStatus,
} from '../controllers/adminBackupController.js';

const router = Router();

// Import files arrive as small sequential chunks (see importChunk) so hosting
// proxies with small request-body limits don't reject the upload.
const chunkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Everything here is super-admin only — a restore can wipe the live database.
router.get('/stats', authenticateJWT, isSuperAdmin, getStats);
router.get('/export', authenticateJWT, isSuperAdmin, exportBackup);
router.post('/to-uri', authenticateJWT, isSuperAdmin, startBackupToUri);

router.post('/import/chunk', authenticateJWT, isSuperAdmin, chunkUpload.single('chunk'), importChunk);
router.post('/import/parse', authenticateJWT, isSuperAdmin, importParse);
router.post('/import/confirm', authenticateJWT, isSuperAdmin, importConfirm);

router.get('/jobs/:id', authenticateJWT, isSuperAdmin, getJobStatus);

export default router;
