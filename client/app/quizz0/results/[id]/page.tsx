'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, History, Star, Target, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { ResultBreakdown } from '@/components/quiz/ResultBreakdown';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, QuizMatchResult } from '@/lib/quizTypes';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user } = useAuth();
  const { quizState, resetQuiz } = useQuizSocket();
  const [result, setResult] = useState<QuizMatchResult | null>(quizState.result);

  const myId = user?.id;
  const me = result?.players.find((p) => p.id === myId);
  const opponent = result?.players.find((p) => p.id !== myId);
  const isWinner = result?.winner === myId;
  const isDraw = result?.isDraw;
  const subjectInfo = SUBJECTS.find((s) => s.id === result?.subject);

  // Calculate stats
  const accuracy = me ? Math.round((me.correctCount / (me.answers?.length || 1)) * 100) : 0;
  const avgTime = me?.answers?.length
    ? Math.round(me.answers.reduce((sum, a) => sum + a.timeTaken, 0) / me.answers.length / 1000 * 10) / 10
    : 0;
  const bestStreak = me?.answers?.reduce(
    (acc, a) => {
      if (a.isCorrect) acc.current += 1;
      acc.current = a.isCorrect ? acc.current : 0;
      acc.best = Math.max(acc.best, acc.current);
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
    if (result?.subject) {
      router.push(`/quizz0/play?subject=${result.subject}`);
    } else {
      router.push('/quizz0');
    }
  };

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

          {/* Score Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 max-w-md mx-auto"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">You</p>
              <p className={`text-4xl font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                {me?.score || 0}
              </p>
            </div>
            <span className="text-gray-600 text-lg font-medium">—</span>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{opponent?.name || 'Opponent'}</p>
              <p className={`text-4xl font-bold ${!isWinner && !isDraw ? 'text-yellow-400' : 'text-white'}`}>
                {opponent?.score || 0}
              </p>
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

      {/* ─── Breakdown ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Question Breakdown</h2>
        {/* We don't have full question data in the result, so we show answer details */}
        {me?.answers && (
          <div className="space-y-3">
            {me.answers.map((answer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  answer.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : answer.chosenIndex === -1
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                  answer.isCorrect ? 'bg-green-500' :
                  answer.chosenIndex === -1 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {answer.isCorrect ? 'Correct' :
                     answer.chosenIndex === -1 ? 'Timed Out' :
                     'Wrong'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Time: {(answer.timeTaken / 1000).toFixed(1)}s
                  </p>
                </div>
                <span className={`text-sm font-bold ${
                  answer.score > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  +{answer.score}
                </span>
              </motion.div>
            ))}
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