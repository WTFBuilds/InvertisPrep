'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, History, Star, Target, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { SUBJECTS } from '@/lib/quizTypes';

const QUIZ_SERVER = process.env.NEXT_PUBLIC_QUIZ_SERVER_URL || 'http://localhost:5001';

interface PlayerData {
  user: { _id: string; name: string; picture?: string };
  score: number;
  correctCount: number;
  answers: { questionIndex: number; chosenIndex: number; isCorrect: boolean; timeTaken: number }[];
}

interface MatchData {
  _id: string;
  subject: string;
  mode: string;
  status: string;
  players: PlayerData[];
  winner: { _id: string; name: string; picture?: string } | null;
  startedAt: string;
  finishedAt: string;
  questions: { _id: string; question: string; options: string[]; correctIndex: number; explanation: string }[];
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user } = useAuth();
  const { resetQuiz } = useQuizSocket();

  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch match data from quiz server REST API
  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 [DEBUG ResultsPage] Fetching match data for', matchId);
        const res = await fetch(`${QUIZ_SERVER}/api/quiz/match/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log('🔍 [DEBUG ResultsPage] API response:', data.success ? 'success' : 'failure', data.message || '');
        if (data.success) {
          setMatch(data.data);
          console.log('🔍 [DEBUG ResultsPage] Match loaded:', JSON.stringify({
            matchId: data.data._id,
            winner: data.data.winner,
            status: data.data.status,
            players: data.data.players.map((p: PlayerData) => ({
              id: p.user?._id,
              name: p.user?.name,
              score: p.score,
              correctCount: p.correctCount,
              answers: p.answers?.length
            }))
          }));
        } else {
          setError(data.message || 'Match not found');
        }
      } catch (err) {
        console.error('🔍 [DEBUG ResultsPage] Fetch error:', err);
        setError('Failed to load match results');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  const myId = user?.id;
  const me = match?.players.find((p) => p.user && (p.user._id === myId || p.user._id?.toString() === myId));
  const opponent = match?.players.find((p) => p.user && p.user._id !== myId && p.user._id?.toString() !== myId);
  const winnerId = (match?.winner as any)?._id || (match?.winner as any);
  const isWinner = winnerId && (winnerId === myId || winnerId?.toString() === myId);
  const isDraw = !match?.winner;

  // Debug logging for winner determination
  if (match) {
    console.log('🔍 [DEBUG ResultsPage] ──── WINNER DETERMINATION ────');
    console.log('🔍 [DEBUG ResultsPage] myId:', myId);
    console.log('🔍 [DEBUG ResultsPage] me:', me?.user?._id, 'score:', me?.score, 'correct:', me?.correctCount);
    console.log('🔍 [DEBUG ResultsPage] opponent:', opponent?.user?._id, 'score:', opponent?.score, 'correct:', opponent?.correctCount);
    console.log('🔍 [DEBUG ResultsPage] match.winner (raw):', match.winner);
    console.log('🔍 [DEBUG ResultsPage] winnerId (extracted):', winnerId);
    console.log('🔍 [DEBUG ResultsPage] isWinner:', isWinner, '| isDraw:', isDraw);
  }
  const subjectInfo = SUBJECTS.find((s) => s.id === match?.subject);

  // Calculate stats
  const accuracy = me ? Math.round((me.correctCount / (me.answers?.length || 1)) * 100) : 0;
  const avgTime = me?.answers?.length
    ? Math.round(me.answers.reduce((sum, a) => sum + a.timeTaken, 0) / me.answers.length / 1000 * 10) / 10
    : 0;
  const bestStreak = me?.answers?.reduce(
    (acc, a) => {
      if (a.isCorrect) acc.current += 1;
      acc.best = Math.max(acc.best, acc.current);
      if (!a.isCorrect) acc.current = 0;
      return acc;
    },
    { current: 0, best: 0 }
  ).best || 0;

  const handlePlayAgain = () => {
    resetQuiz();
    router.push('/quizz0');
  };

  const handleRematch = () => {
    resetQuiz();
    if (match?.subject) {
      router.push(`/quizz0/play?subject=${match.subject}`);
    } else {
      router.push('/quizz0');
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Card className="p-8 max-w-md mx-4 text-center border-0 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">Could not load results</p>
          <p className="text-gray-500 text-sm mb-6">{error || 'Match not found'}</p>
          <Button onClick={handlePlayAgain} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            Back to Quizzo
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ─── Winner Banner ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-16 sm:py-20">
        <Spotlight
          className="absolute inset-0"
          gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50.11%)"
          spread={100}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
            className="mb-6"
          >
            {isDraw ? (
              <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                <span className="text-4xl">🤝</span>
              </div>
            ) : isWinner ? (
              <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="h-10 w-10 text-yellow-500" />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-500/20 border-2 border-gray-500 flex items-center justify-center">
                <span className="text-4xl">😤</span>
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-2"
          >
            {isDraw ? "It's a Draw!" : isWinner ? 'You Won!' : 'You Lost'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 mb-8"
          >
            {subjectInfo?.icon} {subjectInfo?.name} Battle
          </motion.p>

          {/* Score Comparison — correct answers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 max-w-md mx-auto"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">You</p>
              <p className={`text-4xl font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                {me?.correctCount || 0}<span className="text-lg text-gray-400">/10</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{me?.score || 0} pts</p>
            </div>
            <span className="text-gray-600 text-lg font-medium">—</span>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{opponent?.user?.name || 'Opponent'}</p>
              <p className={`text-4xl font-bold ${!isWinner && !isDraw ? 'text-yellow-400' : 'text-white'}`}>
                {opponent?.correctCount || 0}<span className="text-lg text-gray-400">/10</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{opponent?.score || 0} pts</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-green-500' },
            { label: 'Correct', value: `${me?.correctCount || 0}/${me?.answers?.length || 0}`, icon: Star, color: 'text-indigo-500' },
            { label: 'Avg Speed', value: `${avgTime}s`, icon: Clock, color: 'text-purple-500' },
            { label: 'Best Streak', value: `${bestStreak}`, icon: Zap, color: 'text-amber-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <Card className="border-0 shadow-lg text-center">
                <CardContent className="p-4">
                  <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Per-Question Breakdown ────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Question Breakdown</h2>
        {me?.answers && (
          <div className="space-y-3">
            {me.answers.map((answer, idx) => {
              const question = match.questions[answer.questionIndex];
              const isCorrect = answer.isCorrect;
              const choseTimeout = answer.chosenIndex === -1;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                    isCorrect
                      ? 'bg-green-50 border-green-200'
                      : choseTimeout
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    isCorrect ? 'bg-green-500' :
                    choseTimeout ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {question?.question || `Question ${idx + 1}`}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {!choseTimeout && question?.options && (
                        <span className={`px-2 py-0.5 rounded-md font-medium ${
                          isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          Your answer: {question.options[answer.chosenIndex]}
                        </span>
                      )}
                      {!isCorrect && question?.options && (
                        <span className="px-2 py-0.5 rounded-md bg-green-200 text-green-800 font-medium">
                          Correct: {question.options[question.correctIndex]}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-medium">
                        {answer.isCorrect ? `+${calculatePoints(answer.timeTaken)}` : '+0'} pts
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                        {(answer.timeTaken / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Actions ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <BackgroundGradient className="rounded-xl">
            <Button
              onClick={handleRematch}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-base"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Rematch
            </Button>
          </BackgroundGradient>

          <Button
            onClick={handlePlayAgain}
            variant="outline"
            className="border-gray-200 px-8 py-6 text-base"
          >
            <Home className="h-5 w-5 mr-2" />
            Play Again
          </Button>

          <Button
            onClick={() => router.push('/quizz0/history')}
            variant="outline"
            className="border-gray-200 px-8 py-6 text-base"
          >
            <History className="h-5 w-5 mr-2" />
            History
          </Button>
        </div>
      </section>
    </div>
  );
}

function calculatePoints(timeTaken: number): number {
  const timeRemaining = Math.max(0, 10000 - timeTaken);
  const fraction = timeRemaining / 10000;
  if (fraction >= 0.7) return 150;
  if (fraction >= 0.4) return 130;
  if (fraction >= 0.2) return 115;
  return 105;
}