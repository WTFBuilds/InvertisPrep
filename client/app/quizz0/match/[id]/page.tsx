'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Timer } from '@/components/quiz/Timer';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { ScoreBoard } from '@/components/quiz/ScoreBoard';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS } from '@/lib/quizTypes';

export default function ActiveQuizPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user } = useAuth();
  const { quizState, submitAnswer, rejoinMatch } = useQuizSocket();

  // Sync matchId from URL into quizState if not already set
  useEffect(() => {
    if (matchId && quizState.matchId !== matchId) {
      console.log(`🔍 [DEBUG MatchPage] Syncing matchId from URL: ${matchId}`);
    }
  }, [matchId, quizState.matchId]);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [phase, setPhase] = useState<'answering' | 'waiting' | 'reveal' | 'next'>('answering');
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  const myId = user?.id;
  const opponent = quizState.players.find((p) => p.id !== myId);

  // Redirect if no match
  useEffect(() => {
    if (quizState.status === 'finished' && quizState.result) {
      console.log('🔍 [DEBUG MatchPage] Status finished + result exists, redirecting to results page');
      router.push(`/quizz0/results/${matchId}`);
    }
  }, [quizState.status, quizState.result, matchId, router]);

  // Reset state on new question
  useEffect(() => {
    if (quizState.currentQuestion) {
      setSelectedAnswer(null);
      setShowResult(false);
      setPhase('answering');
      setLastPointsEarned(0);
    }
  }, [quizState.questionIndex, quizState.currentQuestion]);

  // Handle answer confirmed → waiting phase
  useEffect(() => {
    if (quizState.lastAnswer && !showResult) {
      setPhase('waiting');
      setLastPointsEarned(quizState.lastAnswer.score);
    }
  }, [quizState.lastAnswer]);

  // Handle result reveal
  useEffect(() => {
    // Only show result if it's for the CURRENT question (avoid stale results)
    if (quizState.lastResult && quizState.lastResult.index === quizState.questionIndex) {
      setShowResult(true);
      setPhase('reveal');

      // After reveal, prepare for next question
      const timer = setTimeout(() => {
        setPhase('next');
      }, 2800);

      return () => clearTimeout(timer);
    }
  }, [quizState.lastResult, quizState.questionIndex]);

  const handleSelectAnswer = useCallback((index: number) => {
    if (phase !== 'answering') return;
    console.log(`🔍 [DEBUG MatchPage] Player selected answer: Q${quizState.questionIndex}, choice=${index}, matchId=${matchId}`);
    setSelectedAnswer(index);
    submitAnswer(quizState.questionIndex, index, matchId);
    setPhase('waiting');
  }, [phase, submitAnswer, quizState.questionIndex, matchId]);

  const handleTimeUp = useCallback(() => {
    if (phase === 'answering') {
      console.log(`🔍 [DEBUG MatchPage] Timer expired for Q${quizState.questionIndex}, submitting timeout, matchId=${matchId}`);
      // Submit -1 for timeout
      submitAnswer(quizState.questionIndex, -1, matchId);
      setPhase('waiting');
    }
  }, [phase, submitAnswer, quizState.questionIndex, matchId]);

  const handleRejoin = () => {
    rejoinMatch(matchId);
  };

  const question = quizState.currentQuestion;
  const result = quizState.lastResult;
  const subjectInfo = SUBJECTS.find((s) => s.id === quizState.subject);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* ─── Header ──────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              {subjectInfo?.icon} {subjectInfo?.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Q{quizState.questionIndex + 1}/{quizState.totalQuestions}
            </Badge>
          </div>

          <ScoreBoard
            myName={user?.name || 'You'}
            myPicture={user?.picture}
            myScore={quizState.myScore}
            opponentName={opponent?.name || 'Opponent'}
            opponentPicture={opponent?.picture}
            opponentScore={quizState.opponentScore}
            questionNumber={quizState.questionIndex + 1}
            totalQuestions={quizState.totalQuestions}
          />
        </div>

        {/* ─── Timer ───────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          {question && (
            <Timer
              duration={question.timeLimit > 0 ? question.timeLimit : 10000}
              isRunning={phase === 'answering' && !quizState.bothAnswered}
              questionIndex={quizState.questionIndex}
              onTimeUp={handleTimeUp}
            />
          )}
        </div>

        {/* ─── Question Card ───────────────────────────────── */}
        <Card className="p-6 sm:p-8 border-0 shadow-lg">
          {question && (
            <QuestionCard
              question={question.question}
              options={question.options}
              selectedAnswer={selectedAnswer}
              correctIndex={showResult ? quizState.lastResult?.correctIndex : undefined}
              showResult={showResult}
              disabled={phase !== 'answering'}
              onSelect={handleSelectAnswer}
            />
          )}
        </Card>

        {/* ─── Status Messages ─────────────────────────────── */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {phase === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {quizState.opponentAnswered ? 'Both answered! Revealing...' : 'Waiting for opponent...'}
                </Badge>
                {quizState.lastAnswer && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-sm font-semibold mt-2 ${
                      quizState.lastAnswer.isCorrect ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {quizState.lastAnswer.isCorrect
                      ? `✓ Correct! +${lastPointsEarned} pts`
                      : quizState.lastAnswer.chosenIndex === -1
                      ? '⏱ Time\'s up! +0 pts'
                      : '✗ Wrong! +0 pts'}
                  </motion.p>
                )}
              </motion.div>
            )}

            {showResult && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Result explanation */}
                <Card className="p-4 border-0 bg-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    💡 {result.explanation}
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Disconnect Overlay ──────────────────────────── */}
        <AnimatePresence>
          {quizState.opponentDisconnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
            >
              <Card className="p-8 max-w-sm mx-4 text-center border-0 shadow-2xl">
                <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Opponent Disconnected</h2>
                <p className="text-gray-500 mb-4">Waiting for them to reconnect...</p>
                <div className="text-3xl font-bold text-indigo-600 tabular-nums">
                  {quizState.rejoinTimer}s
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}