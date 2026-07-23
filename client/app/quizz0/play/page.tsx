'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Swords, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';

function MatchmakingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = (searchParams.get('subject') as QuizSubject) || 'cs';
  const { joinQueue, leaveQueue, quizState, isConnected } = useQuizSocket();
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const countdownStarted = useRef(false);
  const redirectRef = useRef<string | null>(null);

  const subjectInfo = SUBJECTS.find((s) => s.id === subject);

  // Join queue on mount
  useEffect(() => {
    if (isConnected) {
      joinQueue(subject);
    }
    return () => leaveQueue();
  }, [isConnected, subject, joinQueue, leaveQueue]);

  // Handle match found → countdown (runs once, won't restart on re-renders)
  useEffect(() => {
    if (countdownStarted.current) return;
    if (quizState.status !== 'countdown' || !quizState.matchId) return;

    countdownStarted.current = true;
    redirectRef.current = `/quizz0/match/${quizState.matchId}`;
    setShowCountdown(true);

    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        // Redirect after brief pause
        setTimeout(() => {
          if (redirectRef.current) {
            router.push(redirectRef.current);
          }
        }, 500);
      }
    }, 1000);

    // Don't return cleanup — let it run to completion even if quizState changes
  }, [quizState.status, quizState.matchId, router]);

  // Handle errors
  useEffect(() => {
    if (quizState.status === 'cancelled') {
      router.push('/quizz0');
    }
  }, [quizState.status, router]);

  const handleCancel = useCallback(() => {
    leaveQueue();
    router.push('/quizz0');
  }, [leaveQueue, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      <Spotlight
        className="absolute inset-0"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50.11%)"
        spread={100}
      />

      {/* ─── Searching State ───────────────────────────────── */}
      {!showCountdown && (
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md w-full"
          >
            {/* Subject badge */}
            <Badge
              variant="secondary"
              className="mb-8 bg-white/10 text-white border-white/20"
            >
              {subjectInfo?.icon} {subjectInfo?.name}
            </Badge>

            {/* Searching animation */}
            <div className="relative mb-8">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-indigo-500/20"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-purple-500/20"
              />
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Swords className="h-12 w-12 text-white" />
              </div>
            </div>

            <motion.h1
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-bold text-white mb-3"
            >
              Finding Opponent...
            </motion.h1>
            <p className="text-gray-400 mb-8">
              Matching you with another {subjectInfo?.name} player
            </p>

            {/* Opponent slots */}
            <div className="flex items-center justify-center gap-8 mb-10">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center mb-2">
                  <span className="text-2xl">👤</span>
                </div>
                <span className="text-xs text-indigo-400 font-medium">You</span>
              </div>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-2xl text-gray-600 font-bold"
              >
                VS
              </motion.span>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl text-gray-600"
                  >
                    ?
                  </motion.span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Opponent</span>
              </div>
            </div>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </motion.div>
        </div>
      )}

      {/* ─── Countdown Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-gray-400 mb-4"
              >
                Match Found!
              </motion.p>

              <div className="flex items-center gap-8 mb-8">
                {quizState.players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-center"
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                      i === 0 ? 'bg-indigo-500/20 border-2 border-indigo-500' : 'bg-purple-500/20 border-2 border-purple-500'
                    }`}>
                      <span className="text-3xl">
                        {p.picture ? <img src={p.picture} alt={p.name} className="w-full h-full rounded-full object-cover" /> : '👤'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-8xl font-bold text-white"
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MatchmakingContent />
    </Suspense>
  );
}