import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';

// Top-up pack definitions — server-side source of truth
export const PACKS = {
  starter: { coins: 200,  rupees: 19.99, label: 'Starter' },
  plus:    { coins: 600,  rupees: 49.99, label: 'Plus'    },
  pro:     { coins: 1400, rupees: 99.99, label: 'Pro'     },
};

// GET /api/wallet/balance
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('qcoins freeDownloadsLeft');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        qcoins: user.qcoins ?? 0,
        freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
      },
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

// POST /api/wallet/topup   body: { packId: 'starter' | 'plus' | 'pro' }
export const topup = async (req, res) => {
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

    user.qcoins = (user.qcoins ?? 0) + pack.coins;
    await user.save();

    const tx = await Transaction.create({
      userId:       user._id,
      type:         'credit',
      category:     'topup',
      coins:        pack.coins,
      rupees:       pack.rupees,
      description:  `${pack.label} pack — ${pack.coins} QCoins purchased for ₹${pack.rupees}`,
      balanceAfter: user.qcoins,
    });

    res.json({
      success: true,
      message: `${pack.coins} QCoins added to your wallet!`,
      data: {
        qcoins:      user.qcoins,
        freeDownloadsLeft: user.freeDownloadsLeft ?? 2,
        transaction: tx,
      },
    });
  } catch (err) {
    console.error('[wallet] topup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/wallet/spend-download   body: { resumeId, method: 'coins' | 'free' }
export const spendDownload = async (req, res) => {
  try {
    const { resumeId, method } = req.body;

    if (!resumeId || !['coins', 'free'].includes(method)) {
      res.status(400).json({ success: false, message: 'resumeId and method (coins|free) are required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (method === 'free') {
      if ((user.freeDownloadsLeft ?? 0) <= 0) {
        res.status(400).json({ success: false, message: 'No free downloads remaining' });
        return;
      }
      user.freeDownloadsLeft -= 1;
      await user.save();

      await Transaction.create({
        userId:       user._id,
        type:         'debit',
        category:     'resume_download',
        coins:        0,
        description:  'Watermark-free PDF — free trial used',
        resumeId,
        balanceAfter: user.qcoins ?? 0,
      });

      res.json({
        success: true,
        message: 'Free download used',
        data: { qcoins: user.qcoins ?? 0, freeDownloadsLeft: user.freeDownloadsLeft },
      });
      return;
    }

    // method === 'coins'
    const COST = 200;
    if ((user.qcoins ?? 0) < COST) {
      res.status(400).json({ success: false, message: 'Insufficient QCoins' });
      return;
    }

    user.qcoins -= COST;
    await user.save();

    await Transaction.create({
      userId:       user._id,
      type:         'debit',
      category:     'resume_download',
      coins:        COST,
      description:  'Watermark-free PDF — 200 QCoins spent',
      resumeId,
      balanceAfter: user.qcoins,
    });

    res.json({
      success: true,
      message: '200 QCoins spent for watermark-free PDF',
      data: { qcoins: user.qcoins, freeDownloadsLeft: user.freeDownloadsLeft ?? 0 },
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
