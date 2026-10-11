import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getBalance,
  getTransactions,
  createTopupOrder,
  verifyTopup,
  spendDownload,
  getPacks,
  razorpayWebhook,
} from '../controllers/walletController.js';

const router = Router();

// Razorpay server-to-server webhook — unauthenticated, verified by the
// x-razorpay-signature HMAC inside the controller. Must be registered
// before the JWT middleware below.
router.post('/webhook', razorpayWebhook);

// All other wallet routes require authentication
router.use(authenticateJWT);

router.get('/balance',      getBalance);
router.get('/transactions', getTransactions);
router.get('/packs',        getPacks);
router.post('/orders',         createTopupOrder);
router.post('/verify',         verifyTopup);
router.post('/spend-download', spendDownload);

export default router;
