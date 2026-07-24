import { Router } from 'express';
import mongoose from 'mongoose';
import QuizMatch from '../models/QuizMatch.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// ─── Leaderboard ────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const { subject } = req.query;

    const matchFilter = { status: 'finished' };
    if (subject && ['cs', 'java', 'frontend', 'dsa'].includes(subject)) {
      matchFilter.subject = subject;
    }

    const matches = await QuizMatch.find(matchFilter).lean();

    // Aggregate scores per user
    const stats = {};
    for (const match of matches) {
      for (const player of match.players) {
        const uid = player.user.toString();
        if (!stats[uid]) {
          stats[uid] = { userId: uid, totalScore: 0, wins: 0, losses: 0, draws: 0, matchesPlayed: 0, correctTotal: 0, questionsTotal: 0 };
        }
        stats[uid].totalScore += player.score;
        stats[uid].matchesPlayed += 1;
        stats[uid].correctTotal += player.correctCount;
        stats[uid].questionsTotal += player.answers.length;

        if (match.winner?.toString() === uid) {
          stats[uid].wins += 1;
        } else if (match.winner === null && player.score === match.players.find((p) => p.user.toString() !== uid)?.score) {
          stats[uid].draws += 1;
        } else {
          stats[uid].losses += 1;
        }
      }
    }

    const leaderboard = Object.values(stats)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50);

    // Fetch user details
    const User = mongoose.model('User');
    const userIds = leaderboard.map((e) => e.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name picture email').lean();
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enriched = leaderboard.map((entry, i) => ({
      rank: i + 1,
      ...entry,
      winRate: entry.matchesPlayed > 0 ? Math.round((entry.wins / entry.matchesPlayed) * 100) : 0,
      accuracy: entry.questionsTotal > 0 ? Math.round((entry.correctTotal / entry.questionsTotal) * 100) : 0,
      user: userMap[entry.userId] || { name: 'Unknown', picture: null },
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Match History ──────────────────────────────────────────
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, subject } = req.query;
    const userId = req.user.id;

    const filter = { status: 'finished', 'players.user': userId };
    if (subject && ['cs', 'java', 'frontend', 'dsa'].includes(subject)) {
      filter.subject = subject;
    }

    const total = await QuizMatch.countDocuments(filter);
    const matches = await QuizMatch.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('players.user', 'name picture')
      .populate('winner', 'name picture')
      .lean();

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Match Details ──────────────────────────────────────────
router.get('/match/:id', authenticateJWT, async (req, res) => {
  try {
    console.log(`🔍 [DEBUG quiz.js] GET /match/${req.params.id}`);

    let match = await QuizMatch.findById(req.params.id)
      .populate('players.user', 'name picture')
      .populate('winner', 'name picture')
      .populate('questions')
      .lean();

    if (!match) {
      console.warn(`⚠️ [DEBUG quiz.js] Match ${req.params.id} not found`);
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    console.log(`🔍 [DEBUG quiz.js] Match found: status=${match.status}, mode=${match.mode}`);
    console.log(`🔍 [DEBUG quiz.js] winner (raw):`, match.winner);
    match.players.forEach((p, i) => {
      console.log(`🔍 [DEBUG quiz.js] Player ${i}: user=${p.user?._id || p.user}, score=${p.score}, correctCount=${p.correctCount}, answers=${p.answers?.length}`);
    });

    // Fallback: if populate left user as null, try to fill from raw data
    if (match.players.some((p) => !p.user)) {
      console.log(`🔍 [DEBUG quiz.js] Some players have null user, re-fetching without populate`);
      match = await QuizMatch.findById(req.params.id)
        .populate('questions')
        .lean();
      // Attach names from the raw player data if available
      for (const player of match.players) {
        if (!player.user) {
          player.user = { _id: player.user, name: 'Unknown', picture: null };
        }
      }
    }

    res.json({ success: true, data: match });
  } catch (error) {
    console.error('❌ [DEBUG quiz.js] Match detail error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── User Stats ─────────────────────────────────────────────
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await QuizMatch.find({
      status: 'finished',
      'players.user': userId,
    }).lean();

    let totalScore = 0, wins = 0, losses = 0, draws = 0;
    let correctTotal = 0, questionsTotal = 0;
    const subjectStats = {};

    for (const match of matches) {
      const player = match.players.find((p) => p.user.toString() === userId);
      if (!player) continue;

      totalScore += player.score;
      correctTotal += player.correctCount;
      questionsTotal += player.answers.length;

      const sub = match.subject;
      if (!subjectStats[sub]) {
        subjectStats[sub] = { score: 0, wins: 0, matches: 0 };
      }
      subjectStats[sub].score += player.score;
      subjectStats[sub].matches += 1;

      if (match.winner?.toString() === userId) {
        wins += 1;
        subjectStats[sub].wins += 1;
      } else if (match.winner === null) {
        draws += 1;
      } else {
        losses += 1;
      }
    }

    res.json({
      success: true,
      data: {
        totalScore,
        wins,
        losses,
        draws,
        matchesPlayed: matches.length,
        winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
        accuracy: questionsTotal > 0 ? Math.round((correctTotal / questionsTotal) * 100) : 0,
        avgScore: matches.length > 0 ? Math.round(totalScore / matches.length) : 0,
        subjectStats,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Admin: Add Question ────────────────────────────────────
router.post('/questions', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { subject, question, options, correctIndex, difficulty, explanation } = req.body;

    if (!subject || !question || !options || options.length !== 4 || correctIndex == null || !explanation) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const Question = (await import('../models/Question.js')).default;
    const q = await Question.create({
      subject, question, options, correctIndex, difficulty: difficulty || 'medium', explanation,
    });

    res.status(201).json({ success: true, data: q });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Admin: Delete Question ─────────────────────────────────
router.delete('/questions/:id', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const Question = (await import('../models/Question.js')).default;
    await Question.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;