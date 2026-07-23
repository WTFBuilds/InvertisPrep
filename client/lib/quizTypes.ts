// ─── Subjects ────────────────────────────────────────────────
export type QuizSubject = 'cs' | 'java' | 'frontend' | 'dsa';

export const SUBJECTS: { id: QuizSubject; name: string; icon: string; color: string; description: string }[] = [
  { id: 'cs', name: 'Computer Science', icon: '💻', color: 'from-blue-500 to-cyan-500', description: 'OS, DBMS, Networking, Programming' },
  { id: 'java', name: 'Java', icon: '☕', color: 'from-orange-500 to-red-500', description: 'OOP, Collections, Multithreading, Streams' },
  { id: 'frontend', name: 'Frontend', icon: '🎨', color: 'from-pink-500 to-purple-500', description: 'HTML, CSS, JavaScript, React' },
  { id: 'dsa', name: 'DSA', icon: '🧮', color: 'from-green-500 to-emerald-500', description: 'Arrays, Trees, Graphs, DP, Sorting' },
];

// ─── Match ───────────────────────────────────────────────────
export type MatchStatus = 'waiting' | 'countdown' | 'playing' | 'finished' | 'cancelled';
export type MatchMode = 'auto' | 'room';

export interface PlayerAnswer {
  questionIndex: number;
  chosenIndex: number; // -1 = timeout
  isCorrect: boolean;
  timeTaken: number; // ms
  score: number;
}

export interface QuizPlayer {
  id: string;
  name: string;
  picture?: string;
  score: number;
  correctCount: number;
  answers: PlayerAnswer[];
}

export interface QuizMatchResult {
  matchId: string;
  status: MatchStatus;
  subject: QuizSubject;
  players: QuizPlayer[];
  winner: string | null;
  isDraw?: boolean;
  disconnectedPlayer?: string;
  finishedAt: string;
}

// ─── Question ────────────────────────────────────────────────
export interface QuizQuestion {
  index: number;
  total: number;
  question: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  reconnected?: boolean;
}

export interface QuestionResult {
  index: number;
  correctIndex: number;
  explanation: string;
  players: {
    id: string;
    chosenIndex: number;
    isCorrect: boolean;
    score: number;
    totalScore: number;
    correctCount: number;
  }[];
}

// ─── Match Found ─────────────────────────────────────────────
export interface MatchFoundPayload {
  matchId: string;
  subject: QuizSubject;
  mode: MatchMode;
  players: { id: string; name: string; picture?: string }[];
}

// ─── Socket Events ───────────────────────────────────────────
export interface ServerToClientEvents {
  'queue-joined': (data: { subject: QuizSubject; position: number }) => void;
  'queue-left': () => void;
  'match-found': (data: MatchFoundPayload) => void;
  'room-created': (data: { roomCode: string; subject: QuizSubject; player: { id: string; name: string; picture?: string } }) => void;
  'room-joined': (data: { roomCode: string; subject: QuizSubject; host: any; guest: any }) => void;
  'player-joined': (data: { player: { id: string; name: string; picture?: string } }) => void;
  'ready-confirmed': () => void;
  'quiz-start': (data: { matchId: string; questions: any[]; countdown: number }) => void;
  'question': (data: QuizQuestion) => void;
  'answer-confirmed': (data: { questionIndex: number; chosenIndex: number; isCorrect: boolean; score: number; totalScore: number; timedOut?: boolean }) => void;
  'opponent-answered': (data: { questionIndex: number }) => void;
  'question-result': (data: QuestionResult) => void;
  'quiz-end': (data: QuizMatchResult) => void;
  'opponent-disconnected': (data: { rejoinWindow: number }) => void;
  'opponent-reconnected': () => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-queue': (data: { subject: QuizSubject }) => void;
  'leave-queue': () => void;
  'create-room': (data: { subject: QuizSubject }) => void;
  'join-room': (data: { roomCode: string }) => void;
  'start-room-match': (data: { roomCode: string }) => void;
  'player-ready': (data: { roomCode?: string; matchId?: string }) => void;
  'submit-answer': (data: { matchId: string; questionIndex: number; chosenIndex: number }) => void;
  'rejoin-match': (data: { matchId: string }) => void;
}

// ─── Leaderboard ─────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalScore: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  winRate: number;
  accuracy: number;
  user: { name: string; picture?: string };
}

// ─── User Stats ──────────────────────────────────────────────
export interface UserQuizStats {
  totalScore: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  winRate: number;
  accuracy: number;
  avgScore: number;
  subjectStats: Record<QuizSubject, { score: number; wins: number; matches: number }>;
}