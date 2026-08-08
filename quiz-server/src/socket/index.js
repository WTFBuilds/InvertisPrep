import QuizMatch from '../models/QuizMatch.js';
import {
  joinQueue,
  leaveAllQueues,
  findMatch,
  createRoom,
  joinRoom,
  getRoom,
  setRoomMatchId,
  deleteRoom,
  getQueueSize,
} from './matchmaking.js';
import {
  startQuiz,
  handleAnswer,
  handleDisconnect,
  handleRejoin,
  initMatchState,
  getActiveMatch,
  activeMatches,
} from './quizEngine.js';

const QUESTION_TIME = 10000;
const QUESTIONS_PER_MATCH = 10;

const VALID_SUBJECTS = ['cs', 'java', 'frontend', 'dsa'];

// Track which user is in which match
const userMatches = new Map(); // userId → matchId

export function registerQuizHandlers(io) {
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`🔍 [DEBUG index.js] User connected: ${socket.user.name} (${socket.id}) userId=${userId}`);

    // ─── Auto-rejoin active match ──────────────────────────
    // When client redirects to match page, new socket joins the room
    const existingMatchId = userMatches.get(userId);
    if (existingMatchId) {
      console.log(`🔍 [DEBUG index.js] Auto-rejoin: user ${userId} has existing match ${existingMatchId}`);
      const state = getActiveMatch(existingMatchId);
      if (state) {
        state.playerSockets.set(userId, socket.id);
        socket.join(`match:${existingMatchId}`);
        console.log(`🔍 [DEBUG index.js] [Rejoin] ${socket.user.name} rejoined match ${existingMatchId}, status=${state.status}`);

        // Re-send current question to rejoining player
        if (state.status === 'playing' && state.questions[state.currentQuestion]) {
          const question = state.questions[state.currentQuestion];
          const remaining = Math.max(0, QUESTION_TIME - (Date.now() - state.questionStartTime));
          socket.emit('question', {
            matchId: existingMatchId,
            index: state.currentQuestion,
            total: QUESTIONS_PER_MATCH,
            question: question.question,
            options: question.options,
            difficulty: question.difficulty,
            timeLimit: remaining,
            reconnected: true,
          });
          // Notify opponent
          const opponentId = [...state.playerSockets.keys()].find((id) => id !== userId);
          if (opponentId) {
            io.to(state.playerSockets.get(opponentId))?.emit('opponent-reconnected');
          }
        } else if (state.status === 'countdown') {
          socket.emit('quiz-start', { matchId: existingMatchId, questions: [], countdown: 1 });
        } else if (state.status === 'finished' && state.finalResult) {
          console.log(`🔍 [DEBUG index.js] [Rejoin] Match already finished, sending results to ${socket.user.name}`);
          socket.emit('quiz-end', state.finalResult);
          // Clean up stale userMatches entry
          userMatches.delete(userId);
        }
      } else {
        // Active state gone (match ended & cleaned up) — remove stale entry
        console.log(`🔍 [DEBUG index.js] No active state for ${existingMatchId}, cleaning userMatches`);
        userMatches.delete(userId);
      }
    }

    // ─── Queue Management ────────────────────────────────────
    socket.on('join-queue', async ({ subject }) => {
      console.log(`🔍 [DEBUG index.js] [Queue] ${socket.user.name} joining queue for ${subject}`);
      if (!VALID_SUBJECTS.includes(subject)) {
        socket.emit('error', { message: 'Invalid subject' });
        return;
      }

      joinQueue(socket, subject);
      socket.emit('queue-joined', { subject, position: getQueueSize(subject) });

      // Try to find a match
      const match = findMatch(subject);
      if (match) {
        console.log(`🔍 [DEBUG index.js] [Queue] Match found: ${match[0].userName} vs ${match[1].userName}`);
        await createAndStartMatch(io, match[0], match[1], subject, 'auto');
      } else {
        console.log(`🔍 [DEBUG index.js] [Queue] No match yet. Queue size: ${getQueueSize(subject)}`);
      }
    });

    socket.on('leave-queue', () => {
      leaveAllQueues(socket.id);
      socket.emit('queue-left');
    });

    // ─── Room Management ─────────────────────────────────────
    socket.on('create-room', ({ subject }) => {
      if (!VALID_SUBJECTS.includes(subject)) {
        socket.emit('error', { message: 'Invalid subject' });
        return;
      }

      const code = createRoom(socket, subject);
      socket.emit('room-created', {
        roomCode: code,
        subject,
        player: { id: userId, name: socket.user.name, picture: socket.user.picture },
      });
    });

    socket.on('join-room', async ({ roomCode }) => {
      const result = joinRoom(socket, roomCode.toUpperCase());
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      const room = getRoom(roomCode.toUpperCase());

      // Notify host that guest joined
      socket.to(`room:${roomCode.toUpperCase()}`).emit('player-joined', {
        player: { id: userId, name: socket.user.name, picture: socket.user.picture },
      });

      socket.emit('room-joined', {
        roomCode: roomCode.toUpperCase(),
        subject: room.subject,
        host: room.host,
        guest: room.guest,
      });
    });

    socket.on('player-ready', async ({ roomCode, matchId: existingMatchId }) => {
      const matchId = existingMatchId;
      const state = getActiveMatch(matchId);

      if (state) {
        // Auto-match: both players already in state, mark ready
        const match = await QuizMatch.findById(matchId);
        if (match && match.players.length === 2) {
          socket.emit('ready-confirmed');
          // Check if other player also ready
          const otherPlayerReady = [...state.playerSockets.keys()].some(
            (id) => id !== userId && state.readyPlayers?.has(id)
          );

          if (!state.readyPlayers) state.readyPlayers = new Set();
          state.readyPlayers.add(userId);

          if (state.readyPlayers.size === 2) {
            match.status = 'playing';
            await match.save();
            await startQuiz(io, matchId);
          }
        }
      }
    });

    socket.on('start-room-match', async ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room || room.host.userId !== userId) {
        socket.emit('error', { message: 'Only host can start the match' });
        return;
      }

      if (!room.guest) {
        socket.emit('error', { message: 'Waiting for opponent' });
        return;
      }

      await createAndStartMatch(io, room.host, room.guest, room.subject, 'room');
    });

    // ─── Quiz Gameplay ───────────────────────────────────────
    socket.on('submit-answer', async ({ matchId, questionIndex, chosenIndex }) => {
      console.log(`🔍 [DEBUG index.js] submit-answer: matchId=${matchId}, questionIndex=${questionIndex}, chosenIndex=${chosenIndex}, userId=${userId}`);
      try {
        await handleAnswer(io, matchId, userId, questionIndex, chosenIndex);
      } catch (err) {
        console.error(`❌ [DEBUG index.js] Error handling answer from ${userId}:`, err);
      }
    });

    // ─── Reconnection ────────────────────────────────────────
    socket.on('rejoin-match', ({ matchId }) => {
      console.log(`🔍 [DEBUG index.js] rejoin-match: matchId=${matchId}, userId=${userId}`);
      const success = handleRejoin(io, socket, matchId, userId);
      if (success) {
        socket.emit('rejoin-success', { matchId });
      } else {
        socket.emit('error', { message: 'Could not rejoin match' });
      }
    });

    // ─── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔍 [DEBUG index.js] User disconnected: ${socket.user.name} (${socket.id}) userId=${userId}`);

      // Clean up queues
      leaveAllQueues(socket.id);

      // Check if in active match
      const matchId = userMatches.get(userId);
      if (matchId) {
        const state = getActiveMatch(matchId);
        if (state && state.status === 'playing') {
          console.log(`🔍 [DEBUG index.js] Disconnect during active match ${matchId}, handling...`);
          handleDisconnect(io, userId, matchId);
        } else {
          // Match ended or no active state — clean up userMatches
          console.log(`🔍 [DEBUG index.js] Match ${matchId} not playing or no state, cleaning userMatches`);
          userMatches.delete(userId);
        }
      }
    });
  });
}

/**
 * Create a QuizMatch document and start the quiz
 */
async function createAndStartMatch(io, player1, player2, subject, mode) {
  try {
    console.log(`🔍 [DEBUG index.js] [createAndStartMatch] Creating match: ${player1.userName} vs ${player2.userName} (${subject}, ${mode})`);
    console.log(`🔍 [DEBUG index.js] [createAndStartMatch] player1: id=${player1.userId}, socketId=${player1.socketId}, name=${player1.userName}`);
    console.log(`🔍 [DEBUG index.js] [createAndStartMatch] player2: id=${player2.userId}, socketId=${player2.socketId}, name=${player2.userName}`);
    
    const match = await QuizMatch.create({
      players: [
        { user: player1.userId },
        { user: player2.userId },
      ],
      subject,
      mode,
      status: 'waiting',
    });

    const matchId = match._id.toString();

    // Track which users are in this match
    userMatches.set(player1.userId, matchId);
    userMatches.set(player2.userId, matchId);

    // Initialize in-memory state
    initMatchState(matchId, player1, player2);

    // Join both sockets to match room
    const s1 = io.sockets.sockets.get(player1.socketId);
    const s2 = io.sockets.sockets.get(player2.socketId);
    if (s1) s1.join(`match:${matchId}`);
    if (s2) s2.join(`match:${matchId}`);

    // Notify both players
    console.log(`🔍 [DEBUG index.js] [createAndStartMatch] Emitting match-found to match:${matchId}`);
    io.to(`match:${matchId}`).emit('match-found', {
      matchId,
      subject,
      mode,
      players: [
        { id: player1.userId, name: player1.userName, picture: player1.userPicture },
        { id: player2.userId, name: player2.userName, picture: player2.userPicture },
      ],
    });

    // Auto-start after short delay
    console.log(`🔍 [DEBUG index.js] [createAndStartMatch] Scheduling quiz start for match ${matchId} in 2s`);
    setTimeout(() => {
      console.log(`🔍 [DEBUG index.js] [createAndStartMatch] Timer fired, calling startQuiz for ${matchId}`);
      startQuiz(io, matchId);
    }, 2000);
  } catch (error) {
    console.error('❌ [DEBUG index.js] Error creating match:', error);
    io.to(player1.socketId).emit('error', { message: 'Failed to create match' });
    io.to(player2.socketId).emit('error', { message: 'Failed to create match' });
  }
}