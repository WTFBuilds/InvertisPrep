import Question from '../models/Question.js';
import QuizMatch from '../models/QuizMatch.js';

const QUESTION_TIME = 10000; // 10 seconds
const REVEAL_DELAY = 3000; // 3 seconds to show result
const COUNTDOWN_DURATION = 3; // 3-2-1 countdown
const REJOIN_WINDOW = 20000; // 20 seconds to reconnect
const QUESTIONS_PER_MATCH = 10;

// Active matches in memory: matchId → match state
const activeMatches = new Map();

// Rejoin timers: matchId → timeout ID
const rejoinTimers = new Map();

/**
 * Calculate score for a single answer
 * Correct + speed bonus, wrong = 0
 */
function calculateScore(isCorrect, timeTaken) {
  if (!isCorrect) return 0;
  const timeRemaining = Math.max(0, QUESTION_TIME - timeTaken);
  const fraction = timeRemaining / QUESTION_TIME;
  if (fraction >= 0.7) return 150;   // ≤ 3s remaining
  if (fraction >= 0.4) return 130;   // ≤ 6s remaining
  if (fraction >= 0.2) return 115;   // ≤ 8s remaining
  return 105;                         // answered in time
}

/**
 * Start a quiz match — pick questions, countdown, then start
 */
export async function startQuiz(io, matchId) {
  const state = activeMatches.get(matchId);
  if (!state) {
    console.log(`[Quiz] No active state for match ${matchId}`);
    return;
  }

  console.log(`[Quiz] Starting quiz for match ${matchId}, status: ${state.status}`);

  const match = await QuizMatch.findById(matchId);
  if (!match) return;

  // Fetch random questions
  const questions = await Question.aggregate([
    { $match: { subject: match.subject } },
    { $sample: { size: QUESTIONS_PER_MATCH } },
  ]);

  if (questions.length < QUESTIONS_PER_MATCH) {
    console.error(`Not enough questions for subject: ${match.subject}`);
    io.to(`match:${matchId}`).emit('error', { message: 'Not enough questions available' });
    return;
  }

  match.questions = questions.map((q) => q._id);
  match.status = 'countdown';
  match.startedAt = new Date();
  await match.save();

  state.questions = questions;
  state.currentQuestion = 0;
  state.status = 'countdown';

  // Send questions metadata (without answers) to both players
  const questionPreview = questions.map((q, i) => ({
    index: i,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
  }));

  // Countdown: 3, 2, 1, GO
  const room = `match:${matchId}`;
  const startData = {
    matchId,
    questions: questionPreview,
    countdown: COUNTDOWN_DURATION,
  };
  io.to(room).emit('quiz-start', startData);

  // Also emit directly to each player's socket
  for (const p of match.players) {
    const socketId = state.playerSockets.get(p.user.toString());
    if (socketId) io.to(socketId).emit('quiz-start', startData);
  }

  // Wait for countdown, then send first question
  setTimeout(() => {
    state.status = 'playing';
    sendQuestion(io, matchId, 0);
  }, COUNTDOWN_DURATION * 1000 + 500); // +500ms buffer
}

/**
 * Send a specific question to both players
 */
function sendQuestion(io, matchId, questionIndex) {
  const state = activeMatches.get(matchId);
  if (!state || questionIndex >= QUESTIONS_PER_MATCH) {
    console.log(`[Quiz] No state or end of questions for match ${matchId}`);
    endQuiz(io, matchId);
    return;
  }

  const question = state.questions[questionIndex];
  state.currentQuestion = questionIndex;
  state.questionStartTime = Date.now();
  state.answersReceived = new Set();

  const room = `match:${matchId}`;
  const questionData = {
    index: questionIndex,
    total: QUESTIONS_PER_MATCH,
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    timeLimit: QUESTION_TIME,
  };
  console.log(`[Quiz] Sending Q${questionIndex + 1} to match ${matchId}`);
  io.to(room).emit('question', questionData);

  // Also emit directly to each player's socket
  for (const [uid, socketId] of state.playerSockets) {
    io.to(socketId).emit('question', questionData);
  }

  // Start server-side timer
  state.questionTimer = setTimeout(() => {
    handleTimeout(io, matchId, questionIndex);
  }, QUESTION_TIME);
}

/**
 * Handle a player's answer submission
 */
export async function handleAnswer(io, matchId, userId, questionIndex, chosenIndex) {
  const state = activeMatches.get(matchId);
  console.log(`[Quiz] Answer from ${userId}: Q${questionIndex}, choice=${chosenIndex}, state=${state?.status}`);
  if (!state || state.status !== 'playing') return;
  if (state.currentQuestion !== questionIndex) return;
  if (state.answersReceived.has(userId)) return; // already answered

  const timeTaken = Date.now() - state.questionStartTime;
  const question = state.questions[questionIndex];
  const isCorrect = chosenIndex === question.correctIndex;
  const score = calculateScore(isCorrect, timeTaken);

  // Store answer in memory
  state.answersReceived.add(userId);
  state.playerAnswers.set(userId, { questionIndex, chosenIndex, isCorrect, timeTaken, score });

  // Atomic DB update — no race condition
  const update = {
    $push: { [`players.$.answers`]: { questionIndex, chosenIndex, isCorrect, timeTaken } },
    $inc: { [`players.$.score`]: score, [`players.$.correctCount`]: isCorrect ? 1 : 0 },
  };
  await QuizMatch.findOneAndUpdate(
    { _id: matchId, 'players.user': userId },
    update,
  );

  // Read back for accurate totalScore
  const match = await QuizMatch.findById(matchId);
  const player = match.players.find((p) => p.user.toString() === userId);
  console.log(`[Quiz] Answer saved: ${userId} → Q${questionIndex}, correct=${isCorrect}, +${score}pts, total=${player?.score}`);

  // Notify the player who answered
  io.to(state.playerSockets.get(userId)).emit('answer-confirmed', {
    questionIndex, chosenIndex, isCorrect, score, totalScore: player?.score || 0,
  });

  // Notify opponent that this player has answered
  const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
  if (opponentId && state.playerSockets.has(opponentId)) {
    io.to(state.playerSockets.get(opponentId)).emit('opponent-answered', { questionIndex });
  }

  // Check if both players have answered
  if (state.answersReceived.size === 2) {
    clearTimeout(state.questionTimer);
    await revealResults(io, matchId, questionIndex);
  }
}

/**
 * Handle timeout — no answer submitted in time
 */
async function handleTimeout(io, matchId, questionIndex) {
  const state = activeMatches.get(matchId);
  if (!state || state.status !== 'playing') return;

  // Mark unanswered players as timeout
  for (const [userId, socketId] of state.playerSockets) {
    if (!state.answersReceived.has(userId)) {
      state.answersReceived.add(userId);
      state.playerAnswers.set(userId, {
        questionIndex, chosenIndex: -1, isCorrect: false, timeTaken: QUESTION_TIME, score: 0,
      });

      // Atomic DB update — no race condition
      await QuizMatch.findOneAndUpdate(
        { _id: matchId, 'players.user': userId },
        {
          $push: { 'players.$.answers': { questionIndex, chosenIndex: -1, isCorrect: false, timeTaken: QUESTION_TIME } },
        },
      );

      io.to(socketId).emit('answer-confirmed', {
        questionIndex, chosenIndex: -1, isCorrect: false, score: 0, totalScore: 0, timedOut: true,
      });
    }
  }

  await revealResults(io, matchId, questionIndex);
}

/**
 * Reveal the results of a question to both players
 */
async function revealResults(io, matchId, questionIndex) {
  const state = activeMatches.get(matchId);
  if (!state) return;

  const question = state.questions[questionIndex];
  const match = await QuizMatch.findById(matchId);

  const playerResults = match.players.map((p) => ({
    id: p.user.toString(),
    chosenIndex: state.playerAnswers.get(p.user.toString())?.chosenIndex ?? -1,
    isCorrect: state.playerAnswers.get(p.user.toString())?.isCorrect ?? false,
    score: state.playerAnswers.get(p.user.toString())?.score ?? 0,
    totalScore: p.score,
    correctCount: p.correctCount,
  }));

  const resultData = {
    index: questionIndex,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    players: playerResults,
  };

  // Emit to room
  io.to(`match:${matchId}`).emit('question-result', resultData);

  // Also emit directly to each player's socket (fallback for stale room membership)
  for (const p of match.players) {
    const socketId = state.playerSockets.get(p.user.toString());
    if (socketId) io.to(socketId).emit('question-result', resultData);
  }

  // After reveal delay, move to next question or end quiz
  setTimeout(async () => {
    if (questionIndex + 1 >= QUESTIONS_PER_MATCH) {
      await endQuiz(io, matchId);
    } else {
      sendQuestion(io, matchId, questionIndex + 1);
    }
  }, REVEAL_DELAY);
}

/**
 * End the quiz — calculate final results
 */
async function endQuiz(io, matchId) {
  const state = activeMatches.get(matchId);
  if (!state) return;

  const match = await QuizMatch.findById(matchId);
  if (!match) return;

  match.status = 'finished';
  match.finishedAt = new Date();

  // Determine winner
  const [p1, p2] = match.players;
  if (p1.score > p2.score) {
    match.winner = p1.user;
  } else if (p2.score > p1.score) {
    match.winner = p2.user;
  } // null = draw

  await match.save();

  const result = {
    matchId,
    status: 'finished',
    subject: match.subject,
    players: match.players.map((p) => ({
      id: p.user.toString(),
      name: state.playerNames.get(p.user.toString()),
      picture: state.playerPictures.get(p.user.toString()),
      score: p.score,
      correctCount: p.correctCount,
      answers: p.answers,
    })),
    winner: match.winner?.toString() || null,
    isDraw: match.winner === null && p1.score === p2.score,
    finishedAt: match.finishedAt,
  };

  io.to(`match:${matchId}`).emit('quiz-end', result);

  // Also emit directly to each player's current socket (in case they redirected)
  for (const player of match.players) {
    const uid = player.user.toString();
    const socketId = state.playerSockets.get(uid);
    if (socketId) {
      io.to(socketId).emit('quiz-end', result);
    }
  }

  // Store final result so rejoining clients can retrieve it
  state.finalResult = result;
  state.status = 'finished';

  // Cleanup after delay (give clients time to receive the event)
  setTimeout(() => {
    activeMatches.delete(matchId);
    clearTimeout(rejoinTimers.get(matchId));
    rejoinTimers.delete(matchId);
  }, 30000);
}

/**
 * Handle player disconnect during quiz
 */
export function handleDisconnect(io, userId, matchId) {
  const state = activeMatches.get(matchId);
  if (!state || state.status !== 'playing') return;

  state.disconnectedPlayer = userId;

  // Pause the question timer
  clearTimeout(state.questionTimer);

  // Notify opponent
  const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
  if (opponentId && state.playerSockets.has(opponentId)) {
    io.to(state.playerSockets.get(opponentId)).emit('opponent-disconnected', {
      rejoinWindow: REJOIN_WINDOW,
    });
  }

  // Start rejoin timer
  const timer = setTimeout(async () => {
    // Opponent didn't rejoin — other player wins by default
    const match = await QuizMatch.findById(matchId);
    if (match && match.status === 'playing') {
      const winnerId = opponentId;
      match.status = 'finished';
      match.finishedAt = new Date();
      match.winner = winnerId;
      await match.save();

      io.to(`match:${matchId}`).emit('quiz-end', {
        matchId,
        status: 'finished',
        subject: match.subject,
        players: match.players.map((p) => ({
          id: p.user.toString(),
          score: p.score,
          correctCount: p.correctCount,
        })),
        winner: winnerId,
        disconnectedPlayer: userId,
        finishedAt: match.finishedAt,
      });

      activeMatches.delete(matchId);
      rejoinTimers.delete(matchId);
    }
  }, REJOIN_WINDOW);

  rejoinTimers.set(matchId, timer);
}

/**
 * Handle player reconnection
 */
export function handleRejoin(io, socket, matchId, userId) {
  const state = activeMatches.get(matchId);
  if (!state) return false;
  if (state.disconnectedPlayer !== userId) return false;

  // Clear the forfeit timer
  clearTimeout(rejoinTimers.get(matchId));
  rejoinTimers.delete(matchId);

  // Update socket mapping
  state.playerSockets.set(userId, socket.id);
  socket.join(`match:${matchId}`);
  state.disconnectedPlayer = null;

  // Notify opponent
  const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
  if (opponentId && state.playerSockets.has(opponentId)) {
    io.to(state.playerSockets.get(opponentId)).emit('opponent-reconnected');
  }

  // Re-send current question to rejoining player
  const question = state.questions[state.currentQuestion];
  socket.emit('question', {
    index: state.currentQuestion,
    total: QUESTIONS_PER_MATCH,
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    timeLimit: QUESTION_TIME - (Date.now() - state.questionStartTime), // remaining time
    reconnected: true,
  });

  // Restart timer with remaining time
  const remaining = Math.max(0, QUESTION_TIME - (Date.now() - state.questionStartTime));
  if (remaining > 0) {
    state.questionTimer = setTimeout(() => {
      handleTimeout(io, matchId, state.currentQuestion);
    }, remaining);
  }

  return true;
}

/**
 * Create and initialize a new match in memory
 */
export function initMatchState(matchId, player1, player2) {
  const playerSockets = new Map();
  const playerNames = new Map();
  const playerPictures = new Map();

  playerSockets.set(player1.userId, player1.socketId);
  playerSockets.set(player2.userId, player2.socketId);
  playerNames.set(player1.userId, player1.userName);
  playerNames.set(player2.userId, player2.userName);
  playerPictures.set(player1.userId, player1.userPicture);
  playerPictures.set(player2.userId, player2.userPicture);

  activeMatches.set(matchId, {
    playerSockets,
    playerNames,
    playerPictures,
    questions: [],
    currentQuestion: 0,
    questionStartTime: 0,
    questionTimer: null,
    answersReceived: new Set(),
    playerAnswers: new Map(),
    status: 'waiting',
    disconnectedPlayer: null,
  });
}

export function getActiveMatch(matchId) {
  return activeMatches.get(matchId);
}

export { activeMatches };