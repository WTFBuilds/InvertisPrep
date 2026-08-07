'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface ScoreBoardProps {
  myName: string;
  myPicture?: string;
  myScore: number;
  opponentName: string;
  opponentPicture?: string;
  opponentScore: number;
  questionNumber: number;
  totalQuestions: number;
}

export function ScoreBoard({
  myName,
  myPicture,
  myScore,
  opponentName,
  opponentPicture,
  opponentScore,
  questionNumber,
  totalQuestions,
}: ScoreBoardProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Question {questionNumber}/{totalQuestions}</span>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Score comparison */}
      <div className="flex items-center justify-between gap-4">
        {/* My score */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {myPicture ? (
              <img src={myPicture} alt={myName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">You</p>
            <motion.p
              key={myScore}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-gray-900 tabular-nums"
            >
              {myScore}
            </motion.p>
          </div>
        </div>

        {/* VS */}
        <span className="text-xs font-bold text-gray-400">VS</span>

        {/* Opponent score */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right min-w-0">
            <p className="text-xs text-gray-500 truncate">{opponentName}</p>
            <motion.p
              key={opponentScore}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-gray-900 tabular-nums"
            >
              {opponentScore}
            </motion.p>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {opponentPicture ? (
              <img src={opponentPicture} alt={opponentName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-purple-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}