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
    console.log(`🔍 [DEBUG sendQuestion] No state or end of questions for match ${matchId} (questionIndex=${questionIndex}) — calling endQuiz`);
    endQuiz(io, matchId);
    return;
  }

  const question = state.questions[questionIndex];
  state.currentQuestion = questionIndex;
  state.questionStartTime = Date.now();
  state.answersReceived = new Set();
  state.revealPending = false;

  const room = `match:${matchId}`;
  const questionData = {
    matchId,
    index: questionIndex,
    total: QUESTIONS_PER_MATCH,
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    timeLimit: QUESTION_TIME,
  };
  console.log(`🔍 [DEBUG sendQuestion] Sending Q${questionIndex + 1}/${QUESTIONS_PER_MATCH} to match ${matchId}`);
  console.log(`🔍 [DEBUG sendQuestion] Players in room: ${[...state.playerSockets.entries()].map(([uid, sid]) => `${uid}@${sid}`).join(', ')}`);
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
  try {
    const state = activeMatches.get(matchId);
    console.log(`🔍 [DEBUG handleAnswer] userId=${userId}, matchId=${matchId}, Q${questionIndex}, choice=${chosenIndex}, state.status=${state?.status}`);
    if (!state || state.status !== 'playing') {
      console.log(`⚠️ [DEBUG handleAnswer] REJECTED — state missing or not playing. matchId=${matchId}, state=${JSON.stringify({ status: state?.status })}`);
      return;
    }
    if (state.currentQuestion !== questionIndex) {
      console.log(`⚠️ [DEBUG handleAnswer] REJECTED — stale questionIndex. expected=${state.currentQuestion}, got=${questionIndex}`);
      return;
    }
    if (state.answersReceived.has(userId)) {
      console.log(`⚠️ [DEBUG handleAnswer] REJECTED — ${userId} already answered`);
      return;
    }

    const timeTaken = Date.now() - state.questionStartTime;
    const question = state.questions[questionIndex];
    const isCorrect = chosenIndex === question.correctIndex;
    const score = calculateScore(isCorrect, timeTaken);

    console.log(`🔍 [DEBUG handleAnswer] correctIndex=${question.correctIndex}, chosenIndex=${chosenIndex}, isCorrect=${isCorrect}, timeTaken=${timeTaken}ms, score=${score}`);

    // Store answer in memory (before async DB call)
    state.answersReceived.add(userId);
    state.playerAnswers.set(userId, { questionIndex, chosenIndex, isCorrect, timeTaken, score });

    // ── DB Update: findById → modify → save ──────────────────
    const match = await QuizMatch.findById(matchId);
    if (!match) {
      console.error(`[Quiz] DB update FAILED — match ${matchId} not found in DB`);
      io.to(state.playerSockets.get(userId)).emit('answer-confirmed', {
        questionIndex, chosenIndex, isCorrect, score, totalScore: 0,
      });
      return;
    }

    const player = match.players.find((p) => p.user.toString() === userId);
    if (!player) {
      console.error(`[Quiz] DB update FAILED — player ${userId} not found in match ${matchId}. Players: ${match.players.map(p => p.user.toString()).join(', ')}`);
      io.to(state.playerSockets.get(userId)).emit('answer-confirmed', {
        questionIndex, chosenIndex, isCorrect, score, totalScore: 0,
      });
      return;
    }

    // Push answer and update score directly on the subdocument
    player.answers.push({ questionIndex, chosenIndex, isCorrect, timeTaken });
    player.score += score;
    player.correctCount += isCorrect ? 1 : 0;

    await match.save();
    console.log(`[Quiz] DB saved OK: ${userId} → Q${questionIndex}, correct=${isCorrect}, +${score}pts, total=${player.score}, answers=${player.answers.length}`);

    // Notify the player who answered
    io.to(state.playerSockets.get(userId)).emit('answer-confirmed', {
      questionIndex, chosenIndex, isCorrect, score, totalScore: player.score,
    });

    // Notify opponent that this player has answered
    const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
    if (opponentId && state.playerSockets.has(opponentId)) {
      io.to(state.playerSockets.get(opponentId)).emit('opponent-answered', { questionIndex });
    }

    // Check if both players have answered — use revealPending lock to prevent double-fire
    if (state.answersReceived.size === 2 && !state.revealPending) {
      state.revealPending = true;
      clearTimeout(state.questionTimer);

      // Tell both clients to stop their timers immediately
      for (const [, socketId] of state.playerSockets) {
        io.to(socketId).emit('both-answered');
      }

      await revealResults(io, matchId, questionIndex);
    }
  } catch (err) {
    console.error(`[Quiz] ERROR in handleAnswer for ${userId} in match ${matchId}:`, err);
  }
}

/**
 * Handle timeout — no answer submitted in time
 */
async function handleTimeout(io, matchId, questionIndex) {
  try {
    const state = activeMatches.get(matchId);
    if (!state || state.status !== 'playing') return;

    // Find the match document once for all timeout updates
    const match = await QuizMatch.findById(matchId);
    if (!match) {
      console.error(`[Quiz] handleTimeout: match ${matchId} not found in DB`);
      return;
    }

    // Mark unanswered players as timeout
    for (const [userId, socketId] of state.playerSockets) {
      if (!state.answersReceived.has(userId)) {
        state.answersReceived.add(userId);
        state.playerAnswers.set(userId, {
          questionIndex, chosenIndex: -1, isCorrect: false, timeTaken: QUESTION_TIME, score: 0,
        });

        // Update DB directly
        const player = match.players.find((p) => p.user.toString() === userId);
        if (player) {
          player.answers.push({ questionIndex, chosenIndex: -1, isCorrect: false, timeTaken: QUESTION_TIME });
          // score stays the same (0 for timeout)
          await match.save();
          console.log(`[Quiz] Timeout saved OK: ${userId} → Q${questionIndex}, total=${player.score}`);
        } else {
          console.error(`[Quiz] handleTimeout: player ${userId} not found in match ${matchId}`);
        }

        io.to(socketId).emit('answer-confirmed', {
          questionIndex, chosenIndex: -1, isCorrect: false, score: 0,
          totalScore: player?.score || 0, timedOut: true,
        });
      }
    }

    // Use revealPending lock to prevent double-fire with handleAnswer
    if (!state.revealPending) {
      state.revealPending = true;
      clearTimeout(state.questionTimer);
      await revealResults(io, matchId, questionIndex);
    }
  } catch (err) {
    console.error(`[Quiz] ERROR in handleTimeout for match ${matchId}:`, err);
  }
}

/**
 * Reveal the results of a question to both players
 */
async function revealResults(io, matchId, questionIndex) {
  const state = activeMatches.get(matchId);
  if (!state) {
    console.warn(`⚠️ [DEBUG revealResults] No state for match ${matchId}`);
    return;
  }

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

  console.log(`🔍 [DEBUG revealResults] Q${questionIndex + 1} in match ${matchId}`);
  console.log(`🔍 [DEBUG revealResults] Correct answer index: ${question.correctIndex}`);
  playerResults.forEach((pr) => {
    console.log(`🔍 [DEBUG revealResults] Player ${pr.id}: chosen=${pr.chosenIndex}, correct=${pr.isCorrect}, score=${pr.score}, totalScore=${pr.totalScore}, correctCount=${pr.correctCount}`);
  });

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
  try {
    const state = activeMatches.get(matchId);
    console.log(`🔍 [DEBUG endQuiz] matchId=${matchId}, state exists=${!!state}, state.status=${state?.status}`);

    if (!state) {
      console.warn(`⚠️ [DEBUG endQuiz] No active state found for match ${matchId} — aborting`);
      return;
    }

    // Prevent double endQuiz calls
    if (state.status === 'finished') {
      console.warn(`⚠️ [DEBUG endQuiz] Match ${matchId} already finished — skipping duplicate call`);
      return;
    }

    const match = await QuizMatch.findById(matchId);
    if (!match) {
      console.error(`❌ [DEBUG endQuiz] Match ${matchId} not found in DB`);
      return;
    }

    console.log(`🔍 [DEBUG endQuiz] DB match found. status=${match.status}, players=${match.players.length}, mode=${match.mode}`);

    match.status = 'finished';
    match.finishedAt = new Date();

    // ── Determine winner by correct answers ────────────────────
    const [p1, p2] = match.players;

    console.log(`🔍 [DEBUG endQuiz] ──── PLAYER SCORES ────`);
    console.log(`🔍 [DEBUG endQuiz] P1: user=${p1.user}, score=${p1.score}, correctCount=${p1.correctCount}, answers=${p1.answers.length}`);
    console.log(`🔍 [DEBUG endQuiz] P2: user=${p2.user}, score=${p2.score}, correctCount=${p2.correctCount}, answers=${p2.answers.length}`);
    console.log(`🔍 [DEBUG endQuiz] In-memory playerSockets: ${[...state.playerSockets.keys()].join(', ')}`);
    console.log(`🔍 [DEBUG endQuiz] In-memory playerNames: ${[...state.playerNames.entries()].map(([k,v]) => `${k}=${v}`).join(', ')}`);

    // Dump every answer for both players
    console.log(`🔍 [DEBUG endQuiz] P1 answers:`, JSON.stringify(p1.answers));
    console.log(`🔍 [DEBUG endQuiz] P2 answers:`, JSON.stringify(p2.answers));

    // 1) Primary: most correct answers wins
    // 2) Tiebreaker: higher score (speed bonus) wins
    // 3) Still tied: draw
    if (p1.correctCount > p2.correctCount) {
      match.winner = p1.user;
      console.log(`🏆 [DEBUG endQuiz] Winner decided: P1 (${p1.user}) — more correct answers (${p1.correctCount} > ${p2.correctCount})`);
    } else if (p2.correctCount > p1.correctCount) {
      match.winner = p2.user;
      console.log(`🏆 [DEBUG endQuiz] Winner decided: P2 (${p2.user}) — more correct answers (${p2.correctCount} > ${p1.correctCount})`);
    } else if (p1.score > p2.score) {
      match.winner = p1.user;
      console.log(`🏆 [DEBUG endQuiz] Winner decided: P1 (${p1.user}) — tiebreaker by score (${p1.score} > ${p2.score})`);
    } else if (p2.score > p1.score) {
      match.winner = p2.user;
      console.log(`🏆 [DEBUG endQuiz] Winner decided: P2 (${p2.user}) — tiebreaker by score (${p2.score} > ${p1.score})`);
    } else {
      match.winner = null; // draw
      console.log(`🤝 [DEBUG endQuiz] DRAW — same correctCount=${p1.correctCount} and same score=${p1.score}`);
    }

    const isDraw = match.winner === null;

    console.log(`🔍 [DEBUG endQuiz] Saving match to DB with winner=${match.winner}, status=finished`);
    await match.save();
    console.log(`✅ [DEBUG endQuiz] Match saved to DB successfully`);

    // Verify what was saved
    const savedMatch = await QuizMatch.findById(matchId).lean();
    console.log(`🔍 [DEBUG endQuiz] Re-read from DB: winner=${savedMatch?.winner}, status=${savedMatch?.status}`);
    console.log(`🔍 [DEBUG endQuiz] Re-read P1: score=${savedMatch?.players?.[0]?.score}, correctCount=${savedMatch?.players?.[0]?.correctCount}`);
    console.log(`🔍 [DEBUG endQuiz] Re-read P2: score=${savedMatch?.players?.[1]?.score}, correctCount=${savedMatch?.players?.[1]?.correctCount}`);

    console.log(`[Quiz] Match ${matchId} finished: P1=${p1.user}(${p1.correctCount}/${p1.answers.length}, ${p1.score}pts) vs P2=${p2.user}(${p2.correctCount}/${p2.answers.length}, ${p2.score}pts) → winner=${match.winner || 'draw'}`);

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
      isDraw,
      finishedAt: match.finishedAt,
    };

    console.log(`🔍 [DEBUG endQuiz] Emitting quiz-end to room match:${matchId}`);
    console.log(`🔍 [DEBUG endQuiz] Result payload:`, JSON.stringify({ ...result, players: result.players.map(p => ({ ...p, answers: `[${p.answers.length} answers]` })) }));
    io.to(`match:${matchId}`).emit('quiz-end', result);

    // Also emit directly to each player's current socket (in case they redirected)
    for (const player of match.players) {
      const uid = player.user.toString();
      const socketId = state.playerSockets.get(uid);
      if (socketId) {
        console.log(`🔍 [DEBUG endQuiz] Emitting quiz-end directly to socket ${socketId} for player ${uid}`);
        io.to(socketId).emit('quiz-end', result);
      } else {
        console.warn(`⚠️ [DEBUG endQuiz] No socket found for player ${uid} — cannot emit directly`);
      }
    }

    // Store final result so rejoining clients can retrieve it
    state.finalResult = result;
    state.status = 'finished';

    console.log(`🔍 [DEBUG endQuiz] Match ${matchId} complete. Cleaning up in 30s...`);

    // Cleanup after delay (give clients time to receive the event)
    setTimeout(() => {
      activeMatches.delete(matchId);
      clearTimeout(rejoinTimers.get(matchId));
      rejoinTimers.delete(matchId);
      console.log(`🧹 [DEBUG endQuiz] Cleaned up match ${matchId} from activeMatches`);
    }, 30000);
  } catch (err) {
    console.error(`❌ [DEBUG endQuiz] Error in endQuiz for match ${matchId}:`, err);
  }
}

/**
 * Handle player disconnect during quiz
 */
export function handleDisconnect(io, userId, matchId) {
  const state = activeMatches.get(matchId);
  console.log(`🔍 [DEBUG handleDisconnect] userId=${userId}, matchId=${matchId}, state exists=${!!state}, status=${state?.status}`);

  if (!state || state.status !== 'playing') {
    console.log(`⚠️ [DEBUG handleDisconnect] Ignoring disconnect — state missing or not playing`);
    return;
  }

  state.disconnectedPlayer = userId;

  // Pause the question timer
  clearTimeout(state.questionTimer);

  // Notify opponent
  const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
  console.log(`🔍 [DEBUG handleDisconnect] Disconnected: ${userId}, Opponent: ${opponentId}, Rejoin window: ${REJOIN_WINDOW}ms`);

  if (opponentId && state.playerSockets.has(opponentId)) {
    io.to(state.playerSockets.get(opponentId)).emit('opponent-disconnected', {
      rejoinWindow: REJOIN_WINDOW,
    });
  }

  // Start rejoin timer
  const timer = setTimeout(async () => {
    // Opponent didn't rejoin — other player wins by default
    console.log(`🔍 [DEBUG handleDisconnect] Rejoin timer expired for match ${matchId}. Awarding win to ${opponentId}`);
    const match = await QuizMatch.findById(matchId);
    if (match && match.status === 'playing') {
      const winnerId = opponentId;
      match.status = 'finished';
      match.finishedAt = new Date();
      match.winner = winnerId;
      await match.save();

      console.log(`🏆 [DEBUG handleDisconnect] Forfeit win: ${winnerId} wins because ${userId} did not rejoin`);

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
    matchId,
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
    revealPending: false,
    status: 'waiting',
    disconnectedPlayer: null,
  });
}

export function getActiveMatch(matchId) {
  return activeMatches.get(matchId);
}

export { activeMatches };