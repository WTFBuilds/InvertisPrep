'use client';

import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import type { PlayerAnswer, QuizPlayer } from '@/lib/quizTypes';

interface ResultBreakdownProps {
  players: QuizPlayer[];
  questions: { question: string; options: string[]; correctIndex: number }[];
}

export function ResultBreakdown({ players, questions }: ResultBreakdownProps) {
  if (!players.length || !questions.length) return null;

  const myAnswers = players[0]?.answers || [];

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const answer = myAnswers[idx];
        const isCorrect = answer?.isCorrect;
        const choseTimeout = answer?.chosenIndex === -1;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-xl border-2 ${
              isCorrect ? 'bg-green-50 border-green-200' :
              choseTimeout ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCorrect ? 'bg-green-500 text-white' :
                choseTimeout ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {isCorrect ? <Check className="h-4 w-4" /> :
                 choseTimeout ? <Clock className="h-4 w-4" /> :
                 <X className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  Q{idx + 1}. {q.question}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {!choseTimeout && (
                    <span className={`px-2 py-0.5 rounded-md font-medium ${
                      isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      Your answer: {q.options[answer?.chosenIndex]}
                    </span>
                  )}
                  {!isCorrect && (
                    <span className="px-2 py-0.5 rounded-md bg-green-200 text-green-800 font-medium">
                      Correct: {q.options[q.correctIndex]}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-medium">
                    +{answer?.score || 0} pts
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}