'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { WaitingSpinner } from '@/components/quiz/WaitingSpinner';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';

export default function JoinRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = (params.code as string)?.toUpperCase();
  const { user } = useAuth();
  const { joinRoom, quizState, isConnected } = useQuizSocket();
  const [countdown, setCountdown] = useState(3);
  const [joined, setJoined] = useState(false);

  const subjectInfo = SUBJECTS.find((s) => s.id === quizState.subject);

  // Join room on mount
  useEffect(() => {
    if (isConnected && roomCode && !joined) {
      joinRoom(roomCode);
      setJoined(true);
    }
  }, [isConnected, roomCode, joinRoom, joined]);

  // Handle match start → countdown
  useEffect(() => {
    if (quizState.status === 'countdown' && quizState.matchId) {
      let count = 3;
      setCountdown(count);

      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/quizz0/match/${quizState.matchId}`);
          }, 500);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quizState.status, quizState.matchId, router]);

  const hasOpponent = quizState.players.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      <Spotlight
        className="absolute inset-0"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50.11%)"
        spread={100}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {/* Back button */}
          <Button
            onClick={() => router.push('/quizz0')}
            variant="ghost"
            className="text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {quizState.subject && (
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20">
              {subjectInfo?.icon} {subjectInfo?.name}
            </Badge>
          )}

          <h1 className="text-2xl font-bold text-white mb-2">Room: {roomCode}</h1>
          <p className="text-gray-400 mb-8">Waiting for host to start the match...</p>

          {/* Player slots */}
          <div className="flex items-center gap-4 mb-8">
            {quizState.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 text-center"
              >
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 overflow-hidden ${
                  p.id === user?.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : 'bg-purple-500/20 border-2 border-purple-500'
                }`}>
                  {p.picture ? (
                    <img src={p.picture} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <p className={`text-xs font-medium ${
                  p.id === user?.id ? 'text-indigo-400' : 'text-purple-400'
                }`}>
                  {p.name} {p.id === user?.id ? '(You)' : '(Host)'}
                </p>
              </motion.div>
            ))}

            {/* Empty slot if only 1 player */}
            {!hasOpponent && (
              <>
                {quizState.players.length === 0 && (
                  <>
                    <div className="flex-1 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Waiting...</p>
                    </div>
                    <span className="text-xl text-gray-600 font-bold">VS</span>
                    <div className="flex-1 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Waiting...</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {!hasOpponent && (
            <WaitingSpinner text="Waiting for host to start..." />
          )}
        </motion.div>
      </div>

      {/* ─── Countdown Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {quizState.status === 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-8xl font-bold text-white"
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}