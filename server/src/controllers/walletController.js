import crypto from 'crypto';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Payment } from '../models/Payment.js';
import { getRazorpay } from '../config/razorpay.js';

// Top-up pack definitions — server-side source of truth
export const PACKS = {
  starter: { coins: 200,  rupees: 19.99, label: 'Starter' },
  plus:    { coins: 600,  rupees: 49.99, label: 'Plus'    },
  pro:     { coins: 1400, rupees: 99.99, label: 'Pro'     },
};

// Single watermark-free PDF download, paid directly (no QCoins).
export const RESUME_PASS = { id: 'resume_pass', coins: 0, rupees: 19.99, label: 'Resume PDF pass' };

const timingSafeEqualHex = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Atomically flip a Payment out of 'created' — whichever caller (checkout
// verify or webhook) wins the claim is the only one that credits coins.
const claimPayment = (orderId, patch) =>
  Payment.findOneAndUpdate(
    { razorpayOrderId: orderId, status: { $ne: 'paid' } },
    { $set: patch },
    { new: true }
  );

const creditCoinsForPayment = async (payment) => {
  const pack = PACKS[payment.packId];
  const user = await User.findByIdAndUpdate(
    payment.userId,
    { $inc: { qcoins: payment.coins } },
    { new: true }
  ).select('qcoins freeDownloadsLeft downloadPasses');

  await Transaction.create({
    userId:       payment.userId,
    type:         'credit',
    category:     'topup',
    coins:        payment.coins,
    rupees:       payment.amount,
    description:  `${pack.label} pack — ${pack.coins} QCoins purchased for ₹${payment.amount}`,
    balanceAfter: user.qcoins,
  });

  return user;
};

// Credit one watermark-free download pass. Only ever called after a
// Razorpay signature check (checkout verify or signed webhook).
const creditResumePass = async (payment) => {
  const user = await User.findByIdAndUpdate(
    payment.userId,
    { $inc: { downloadPasses: 1 } },
    { new: true }
  ).select('qcoins freeDownloadsLeft downloadPasses');

  await Transaction.create({
    userId:       payment.userId,
    type:         'credit',
    category:     'topup',
    coins:        0,
    rupees:       payment.amount,
    description:  'Resume PDF pass — 1 watermark-free download purchased for ₹19.99',
    balanceAfter: user.qcoins,
  });

  return user;
};

const balanceShape = (user) => ({
  qcoins: user.qcoins ?? 0,
  freeDownloadsLeft: user.role === 'super-admin' ? 999999 : (user.freeDownloadsLeft ?? 2),
  downloadPasses: user.downloadPasses ?? 0,
  isSuperAdmin: user.role === 'super-admin',
});


// GET /api/wallet/balance
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('qcoins freeDownloadsLeft downloadPasses role');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: balanceShape(user),
    });
  } catch (err) {
    console.error('[wallet] getBalance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/wallet/transactions?page=1&limit=20&type=all
export const getTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  ?? '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '20', 10)));
    const type  = req.query.type; // 'credit' | 'debit' | undefined (all)

    const filter = { userId: req.user.id };
    if (type === 'credit' || type === 'debit') filter.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[wallet] getTransactions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/wallet/orders   body: { packId: 'starter' | 'plus' | 'pro' }
// Creates a Razorpay order for the pack. Coins are NOT credited here —
// only after the payment is verified (checkout signature or webhook).
export const createTopupOrder = async (req, res) => {
  try {
    const { packId } = req.body;
    const pack = PACKS[packId];
    if (!pack) {
      res.status(400).json({ success: false, message: 'Invalid pack ID' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const amountPaise = Math.round(pack.rupees * 100);
    const receipt = `qc_${user._id.toString().slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);

    const order = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId: user._id.toString(), packId, coins: String(pack.coins) },
    });

    await Payment.create({
      userId:       user._id,
      packId,
      coins:        pack.coins,
      amount:       pack.rupees,
      currency:     'INR',
      razorpayOrderId: order.id,
      status:       'created',
    });

    res.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
        pack:     { id: packId, coins: pack.coins, rupees: pack.rupees, label: pack.label },
      },
    });
  } catch (err) {
    if (err.statusCode === 503) {
      res.status(503).json({ success: false, message: err.message });
      return;
    }
    console.error('[wallet] createTopupOrder error:', err);
    res.status(500).json({ success: false, message: 'Could not create payment order' });
  }
};

// POST /api/wallet/resume-pass-order
// Creates a ₹19.99 Razorpay order for ONE watermark-free resume PDF.
// Nothing is granted here — the pass is only added after the Razorpay
// signature is verified server-side (checkout handler or webhook).
export const createResumePassOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const amountPaise = Math.round(RESUME_PASS.rupees * 100);
    const receipt = `rp_${user._id.toString().slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);

    const order = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId: user._id.toString(), packId: RESUME_PASS.id },
    });

    await Payment.create({
      userId:       user._id,
      packId:       RESUME_PASS.id,
      coins:        0,
      amount:       RESUME_PASS.rupees,
      currency:     'INR',
      razorpayOrderId: order.id,
      status:       'created',
    });

    res.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
        pack:     { id: RESUME_PASS.id, coins: 0, rupees: RESUME_PASS.rupees, label: RESUME_PASS.label },
      },
    });
  } catch (err) {
    if (err.statusCode === 503) {
      res.status(503).json({ success: false, message: err.message });
      return;
    }
    console.error('[wallet] createResumePassOrder error:', err);
    res.status(500).json({ success: false, message: 'Could not create payment order' });
  }
};

// POST /api/wallet/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the checkout handler's HMAC signature, then credits coins once.
export const verifyTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Missing Razorpay verification fields' });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      res.status(503).json({ success: false, message: 'Razorpay is not configured.' });
      return;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (!timingSafeEqualHex(expected, razorpay_signature)) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
      return;
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment order not found' });
      return;
    }
    if (String(payment.userId) !== String(req.user.id)) {
      res.status(403).json({ success: false, message: 'This order belongs to another user' });
      return;
    }

    if (payment.status === 'paid') {
      // Webhook already credited — return current balance without double-crediting
      const user = await User.findById(req.user.id).select('qcoins freeDownloadsLeft downloadPasses');
      res.json({
        success: true,
        message: 'Payment already processed',
        data: { ...balanceShape(user), alreadyProcessed: true },
      });
      return;
    }

    const claimed = await claimPayment(razorpay_order_id, {
      status:            'paid',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    if (!claimed) {
      // Lost the race against the webhook — payment is credited, just report balance
      const user = await User.findById(req.user.id).select('qcoins freeDownloadsLeft downloadPasses');
      res.json({
        success: true,
        message: 'Payment already processed',
        data: { ...balanceShape(user), alreadyProcessed: true },
      });
      return;
    }

    // One payment doc → exactly one credit path, so a pass can never
    // be granted twice and QCoins can never be minted from a pass.
    if (claimed.packId === RESUME_PASS.id) {
      const user = await creditResumePass(claimed);
      res.json({
        success: true,
        message: 'Payment successful — your watermark-free download is ready!',
        data: balanceShape(user),
      });
      return;
    }

    const user = await creditCoinsForPayment(claimed);

    res.json({
      success: true,
      message: `${claimed.coins} QCoins added to your wallet!`,
      data: balanceShape(user),
    });
  } catch (err) {
    console.error('[wallet] verifyTopup error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// POST /api/wallet/webhook  — Razorpay server-to-server events.
// Kept unauthenticated: the x-razorpay-signature HMAC over the raw body is
// the authenticator, so this route must be able to read the raw request body.
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!secret) {
      console.error('[wallet] webhook received but RAZORPAY_WEBHOOK_SECRET is not set');
      res.status(503).json({ success: false, message: 'Webhook not configured' });
      return;
    }
    if (!signature || !req.rawBody) {
      res.status(400).json({ success: false, message: 'Missing signature' });
      return;
    }

    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (!timingSafeEqualHex(expected, signature)) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    const event = req.body;
    const entity = event?.payload?.payment?.entity;
    const orderId = event.event === 'order.paid' ? entity?.id : entity?.order_id;

    if ((event.event === 'payment.captured' || event.event === 'order.paid') && orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (!payment) {
        console.warn(`[wallet] webhook for unknown order ${orderId}`);
        res.json({ received: true });
        return;
      }

      if (payment.status === 'paid') {
        res.json({ received: true });
        return;
      }

      const claimed = await claimPayment(orderId, {
        status:            'paid',
        razorpayPaymentId: entity?.id ?? payment.razorpayPaymentId,
        method:            entity?.method ?? null,
      });
      if (claimed) {
        // Same single-credit rule as checkout verify: a pass order
        // grants a download pass, everything else grants QCoins.
        if (claimed.packId === RESUME_PASS.id) await creditResumePass(claimed);
        else await creditCoinsForPayment(claimed);
      }
    } else if (event.event === 'payment.failed' && entity?.order_id) {
      await Payment.updateOne(
        { razorpayOrderId: entity.order_id, status: 'created' },
        { $set: { status: 'failed', failureReason: entity?.error_description ?? 'Payment failed' } }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[wallet] webhook error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// POST /api/wallet/spend-download
// body: { resumeId, method: 'free' | 'coins' | 'pass' }
//
// THE gate for watermark-free downloads. Every method consumes its
// budget with an atomic conditional $inc (condition: budget >= cost),
// so concurrent/duplicate requests can never double-spend — only the
// request whose update actually matched gets success:true and the
// client may proceed to print clean. 'pass' consumes a Razorpay-
// purchased pass that only exists after server-side signature verify.
export const spendDownload = async (req, res) => {
  try {
    const { resumeId, method } = req.body;

    if (!resumeId || !['free', 'coins', 'pass'].includes(method)) {
      res.status(400).json({ success: false, message: 'resumeId and method (free|coins|pass) are required' });
      return;
    }

    const user = await User.findById(req.user.id).select('qcoins freeDownloadsLeft downloadPasses role');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Super-admin bypasses all limits
    if (user.role === 'super-admin') {
      await Transaction.create({
        userId:       user._id,
        type:         'debit',
        category:     'resume_download',
        coins:        0,
        description:  'Watermark-free PDF — super-admin download (no cost)',
        resumeId,
        balanceAfter: user.qcoins ?? 0,
      });
      res.json({ success: true, message: 'Download available', data: { qcoins: user.qcoins ?? 0, freeDownloadsLeft: user.freeDownloadsLeft ?? 0, downloadPasses: user.downloadPasses ?? 0 } });
      return;
    }

    if (method === 'free') {
      // Atomic decrement only if a free download remains
      const spent = await User.findOneAndUpdate(
        { _id: user._id, freeDownloadsLeft: { $gt: 0 } },
        { $inc: { freeDownloadsLeft: -1 } },
        { new: true }
      ).select('qcoins freeDownloadsLeft downloadPasses');
      if (!spent) {
        res.status(400).json({ success: false, message: 'No free downloads remaining' });
        return;
      }

      await Transaction.create({
        userId:       user._id,
        type:         'debit',
        category:     'resume_download',
        coins:        0,
        description:  'Watermark-free PDF — free trial used',
        resumeId,
        balanceAfter: spent.qcoins ?? 0,
      });

      res.json({
        success: true,
        message: 'Free download used',
        data: balanceShape(spent),
      });
      return;
    }

    if (method === 'pass') {
      // Atomic decrement only if a purchased pass remains
      const spent = await User.findOneAndUpdate(
        { _id: user._id, downloadPasses: { $gt: 0 } },
        { $inc: { downloadPasses: -1 } },
        { new: true }
      ).select('qcoins freeDownloadsLeft downloadPasses');
      if (!spent) {
        res.status(400).json({ success: false, message: 'No resume PDF pass. Complete the ₹19.99 payment first.' });
        return;
      }

      await Transaction.create({
        userId:       user._id,
        type:         'debit',
        category:     'resume_download',
        coins:        0,
        description:  'Watermark-free PDF — Resume PDF pass used',
        resumeId,
        balanceAfter: spent.qcoins ?? 0,
      });

      res.json({
        success: true,
        message: 'Resume PDF pass used',
        data: balanceShape(spent),
      });
      return;
    }

    // method === 'coins'
    const COST = 200;
    const spent = await User.findOneAndUpdate(
      { _id: user._id, qcoins: { $gte: COST } },
      { $inc: { qcoins: -COST } },
      { new: true }
    ).select('qcoins freeDownloadsLeft downloadPasses');
    if (!spent) {
      res.status(400).json({ success: false, message: 'Insufficient QCoins' });
      return;
    }

    await Transaction.create({
      userId:       user._id,
      type:         'debit',
      category:     'resume_download',
      coins:        COST,
      description:  'Watermark-free PDF — 200 QCoins spent',
      resumeId,
      balanceAfter: spent.qcoins,
    });

    res.json({
      success: true,
      message: '200 QCoins spent for watermark-free PDF',
      data: balanceShape(spent),
    });
  } catch (err) {
    console.error('[wallet] spendDownload error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/wallet/packs  — lets the client fetch pack info without hardcoding
export const getPacks = (_req, res) => {
  res.json({ success: true, data: PACKS });
};
