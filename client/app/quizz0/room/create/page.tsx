'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Link, Users, Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { WaitingSpinner } from '@/components/quiz/WaitingSpinner';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = (searchParams.get('subject') as QuizSubject) || 'cs';
  const { user } = useAuth();
  const { createRoom, startRoomMatch, quizState, isConnected } = useQuizSocket();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  const hasOpponent = quizState.players.length >= 2;

  // Create room on mount
  useEffect(() => {
    if (isConnected && !quizState.roomCode) {
      createRoom(subject);
    }
  }, [isConnected, subject, createRoom, quizState.roomCode]);

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

  const handleCopyCode = () => {
    if (quizState.roomCode) {
      navigator.clipboard.writeText(quizState.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/quizz0/room/${quizState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (quizState.roomCode) {
      startRoomMatch(quizState.roomCode);
    }
  };

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

          {/* Subject badge */}
          <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20">
            {subjectInfo?.icon} {subjectInfo?.name}
          </Badge>

          <h1 className="text-2xl font-bold text-white mb-2">Create Room</h1>
          <p className="text-gray-400 mb-8">Share the code with your friend to invite them</p>

          {/* Room Code */}
          {quizState.roomCode && (
            <Card className="bg-white/5 border-white/10 p-6 mb-6">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Room Code</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-mono font-bold text-white tracking-[0.3em]">
                  {quizState.roomCode}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  Copy Code
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Link className="h-4 w-4 mr-1.5" />
                  Share Link
                </Button>
              </div>
            </Card>
          )}

          {/* Player slots */}
          <div className="flex items-center gap-4 mb-6">
            {/* Host (you) */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center mb-2 overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <p className="text-xs text-indigo-400 font-medium">{user?.name || 'You'} (Host)</p>
            </div>

            <span className="text-xl text-gray-600 font-bold">VS</span>

            {/* Guest slot */}
            <div className="flex-1 text-center">
              {hasOpponent ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center mb-2 overflow-hidden"
                >
                  {quizState.players[1]?.picture ? (
                    <img src={quizState.players[1].picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </motion.div>
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              )}
              <p className={`text-xs font-medium ${hasOpponent ? 'text-purple-400' : 'text-gray-500'}`}>
                {hasOpponent ? quizState.players[1]?.name : 'Waiting...'}
              </p>
            </div>
          </div>

          {/* Waiting or Start */}
          {!hasOpponent ? (
            <WaitingSpinner text="Waiting for opponent to join..." />
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-base font-semibold"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Match
              </Button>
            </motion.div>
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

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateRoomContent />
    </Suspense>
  );
}