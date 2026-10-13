'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  QuizSubject,
  MatchStatus,
  QuizQuestion,
  QuestionResult,
  MatchFoundPayload,
  QuizMatchResult,
  PlayerAnswer,
} from '@/lib/quizTypes';

type QuizSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface QuizState {
  matchId: string | null;
  subject: QuizSubject | null;
  status: MatchStatus;
  mode: 'auto' | 'room' | null;
  currentQuestion: QuizQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  myScore: number;
  opponentScore: number;
  myCorrectCount: number;
  opponentCorrectCount: number;
  players: { id: string; name: string; picture?: string }[];
  result: QuizMatchResult | null;
  lastAnswer: PlayerAnswer | null;
  lastResult: QuestionResult | null;
  opponentAnswered: boolean;
  bothAnswered: boolean;
  roomCode: string | null;
  opponentDisconnected: boolean;
  rejoinTimer: number;
}

interface QuizSocketContextType {
  socket: QuizSocket | null;
  isConnected: boolean;
  quizState: QuizState;
  joinQueue: (subject: QuizSubject) => void;
  leaveQueue: () => void;
  createRoom: (subject: QuizSubject) => void;
  joinRoom: (roomCode: string) => void;
  startRoomMatch: (roomCode: string) => void;
  submitAnswer: (questionIndex: number, chosenIndex: number, matchIdOverride?: string) => void;
  rejoinMatch: (matchId: string) => void;
  resetQuiz: () => void;
}

const initialState: QuizState = {
  matchId: null,
  subject: null,
  status: 'waiting',
  mode: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 10,
  myScore: 0,
  opponentScore: 0,
  myCorrectCount: 0,
  opponentCorrectCount: 0,
  players: [],
  result: null,
  lastAnswer: null,
  lastResult: null,
  opponentAnswered: false,
  bothAnswered: false,
  roomCode: null,
  opponentDisconnected: false,
  rejoinTimer: 0,
};

const QuizSocketContext = createContext<QuizSocketContextType | null>(null);

const QUIZ_SERVER_URL = process.env.NEXT_PUBLIC_QUIZ_SERVER_URL || 'http://localhost:5001';

export function QuizSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<QuizSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>(initialState);
  // Ref to always have fresh quizState in event handlers (avoids stale closures)
  const quizStateRef = useRef<QuizState>(initialState);
  const myIdRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with state
  useEffect(() => {
    quizStateRef.current = quizState;
  }, [quizState]);

  useEffect(() => {
    myIdRef.current = user?.id;
  }, [user]);

  // Connect socket on mount
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: QuizSocket = io(QUIZ_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Quiz socket connected');
      setIsConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.warn('Quiz socket connection failed:', err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Quiz socket disconnected:', reason);
      setIsConnected(false);
    });

    // ─── Queue Events ────────────────────────────────
    socket.on('queue-joined', (data) => {
      setQuizState((s) => ({ ...s, subject: data.subject, status: 'waiting' }));
    });

    socket.on('queue-left', () => {
      setQuizState((s) => ({ ...s, status: 'waiting', subject: null }));
    });

    // ─── Match Events ────────────────────────────────
    socket.on('match-found', (data: MatchFoundPayload) => {
      console.log('🔍 [DEBUG Client] match-found:', JSON.stringify(data));
      setQuizState((s) => ({
        ...s,
        matchId: data.matchId,
        subject: data.subject,
        mode: data.mode,
        players: data.players,
        status: 'countdown',
        myScore: 0,
        opponentScore: 0,
        myCorrectCount: 0,
        opponentCorrectCount: 0,
      }));
    });

    // ─── Room Events ─────────────────────────────────
    socket.on('room-created', (data) => {
      console.log('Room created!', data.roomCode);
      setQuizState((s) => ({
        ...s,
        roomCode: data.roomCode,
        subject: data.subject,
        mode: 'room',
        status: 'waiting',
        players: [data.player],
      }));
    });

    socket.on('room-joined', (data) => {
      setQuizState((s) => ({
        ...s,
        roomCode: data.roomCode,
        subject: data.subject,
        mode: 'room',
        status: 'waiting',
        players: [data.host, data.guest].filter(Boolean),
      }));
    });

    socket.on('player-joined', (data) => {
      setQuizState((s) => ({
        ...s,
        players: [...s.players, data.player],
      }));
    });

    // ─── Quiz Events ─────────────────────────────────
    socket.on('quiz-start', (data) => {
      console.log('Quiz starting!', data.matchId);
      setQuizState((s) => ({
        ...s,
        matchId: data.matchId,
        status: 'playing',
        questionIndex: 0,
        totalQuestions: data.questions.length,
      }));
    });

    socket.on('question', (data) => {
      console.log('🔍 [DEBUG Client] question received: Q' + data.index, data.question?.substring(0, 60), 'matchId=' + data.matchId);
      setQuizState((s) => ({
        ...s,
        // Capture matchId from server if provided (fixes rejoin/navigation gap)
        ...(data.matchId ? { matchId: data.matchId } : {}),
        currentQuestion: data,
        questionIndex: data.index,
        status: 'playing',
        lastAnswer: null,
        lastResult: null,
        opponentAnswered: false,
        bothAnswered: false,
        opponentDisconnected: false,
      }));
    });

    socket.on('answer-confirmed', (data) => {
      console.log('🔍 [DEBUG Client] answer-confirmed:', JSON.stringify(data));
      setQuizState((s) => ({
        ...s,
        lastAnswer: {
          questionIndex: data.questionIndex,
          chosenIndex: data.chosenIndex,
          isCorrect: data.isCorrect,
          timeTaken: 0,
          score: data.score,
        },
        myScore: data.totalScore,
        myCorrectCount: data.isCorrect ? s.myCorrectCount + 1 : s.myCorrectCount,
      }));
    });

    socket.on('opponent-answered', () => {
      setQuizState((s) => ({ ...s, opponentAnswered: true }));
    });

    socket.on('both-answered', () => {
      console.log('Both players answered — stopping timers');
      setQuizState((s) => ({ ...s, bothAnswered: true }));
    });

    socket.on('question-result', (data) => {
      const myId = myIdRef.current;
      const me = data.players.find((p) => p.id === myId);
      const opponent = data.players.find((p) => p.id !== myId);
      console.log(`🔍 [DEBUG Client] question-result Q${data.index}: myId=${myId}`);
      console.log(`🔍 [DEBUG Client] me: id=${me?.id}, totalScore=${me?.totalScore}, correctCount=${me?.correctCount}`);
      console.log(`🔍 [DEBUG Client] opponent: id=${opponent?.id}, totalScore=${opponent?.totalScore}, correctCount=${opponent?.correctCount}`);

      setQuizState((s) => ({
        ...s,
        lastResult: data,
        myScore: me?.totalScore ?? s.myScore,
        opponentScore: opponent?.totalScore ?? s.opponentScore,
        myCorrectCount: me?.correctCount ?? s.myCorrectCount,
        opponentCorrectCount: opponent?.correctCount ?? s.opponentCorrectCount,
      }));
    });

    socket.on('quiz-end', (data) => {
      console.log('🔍 [DEBUG Client] ═══════════════════════════════');
      console.log('🔍 [DEBUG Client] ════ QUIZ END RECEIVED ════');
      console.log('🔍 [DEBUG Client] matchId:', data.matchId);
      console.log('🔍 [DEBUG Client] winner:', data.winner);
      console.log('🔍 [DEBUG Client] isDraw:', data.isDraw);
      console.log('🔍 [DEBUG Client] disconnectedPlayer:', data.disconnectedPlayer);
      data.players.forEach((p) => {
        console.log(`🔍 [DEBUG Client] Player: ${p.name || p.id}, score=${p.score}, correctCount=${p.correctCount}, answers=${p.answers?.length}`);
      });
      console.log('🔍 [DEBUG Client] ═══════════════════════════════');
      setQuizState((s) => ({
        ...s,
        status: 'finished',
        result: data,
        opponentDisconnected: false,
      }));
    });

    // ─── Reconnection Events ─────────────────────────
    socket.on('opponent-disconnected', (data) => {
      setQuizState((s) => ({
        ...s,
        opponentDisconnected: true,
        rejoinTimer: data.rejoinWindow / 1000,
      }));

      const interval = setInterval(() => {
        setQuizState((s) => {
          if (s.rejoinTimer <= 1) {
            clearInterval(interval);
            return { ...s, rejoinTimer: 0 };
          }
          return { ...s, rejoinTimer: s.rejoinTimer - 1 };
        });
      }, 1000);
    });

    socket.on('opponent-reconnected', () => {
      setQuizState((s) => ({
        ...s,
        opponentDisconnected: false,
        rejoinTimer: 0,
      }));
    });

    socket.on('error', (data) => {
      console.error('Quiz error:', data.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user]);

  // ─── Actions ───────────────────────────────────────
  const joinQueue = useCallback((subject: QuizSubject) => {
    console.log('Joining queue for:', subject);
    socketRef.current?.emit('join-queue', { subject });
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('leave-queue');
    setQuizState(initialState);
  }, []);

  const createRoom = useCallback((subject: QuizSubject) => {
    socketRef.current?.emit('create-room', { subject });
  }, []);

  const joinRoomAction = useCallback((roomCode: string) => {
    socketRef.current?.emit('join-room', { roomCode });
  }, []);

  const startRoomMatch = useCallback((roomCode: string) => {
    socketRef.current?.emit('start-room-match', { roomCode });
  }, []);

  const submitAnswer = useCallback((questionIndex: number, chosenIndex: number, matchIdOverride?: string) => {
    const matchId = matchIdOverride || quizStateRef.current.matchId;
    console.log(`🔍 [DEBUG Client] submitAnswer: matchId=${matchId} (override=${matchIdOverride}, state=${quizStateRef.current.matchId}), Q${questionIndex}, choice=${chosenIndex}`);
    if (!matchId) {
      console.warn('⚠️ [DEBUG Client] submitAnswer aborted — no matchId (both override and state are null)');
      return;
    }
    socketRef.current?.emit('submit-answer', {
      matchId,
      questionIndex,
      chosenIndex,
    });
  }, []);

  const rejoinMatch = useCallback((matchId: string) => {
    socketRef.current?.emit('rejoin-match', { matchId });
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizState(initialState);
    quizStateRef.current = initialState;
  }, []);

  return (
    <QuizSocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        quizState,
        joinQueue,
        leaveQueue,
        createRoom,
        joinRoom: joinRoomAction,
        startRoomMatch,
        submitAnswer,
        rejoinMatch,
        resetQuiz,
      }}
    >
      {children}
    </QuizSocketContext.Provider>
  );
}

export function useQuizSocket() {
  const ctx = useContext(QuizSocketContext);
  if (!ctx) throw new Error('useQuizSocket must be used within QuizSocketProvider');
  return ctx;
}