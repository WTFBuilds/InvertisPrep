import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getBalance,
  getTransactions,
  topup,
  spendDownload,
  getPacks,
} from '../controllers/walletController.js';

const router = Router();

// All wallet routes require authentication
router.use(authenticateJWT);

router.get('/balance',      getBalance);
router.get('/transactions', getTransactions);
router.get('/packs',        getPacks);
router.post('/topup',          topup);
router.post('/spend-download', spendDownload);

export default router;
