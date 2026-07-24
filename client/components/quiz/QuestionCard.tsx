'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  options: string[];
  selectedAnswer: number | null;
  correctIndex?: number;
  showResult?: boolean;
  disabled?: boolean;
  onSelect: (index: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionCard({
  question,
  options,
  selectedAnswer,
  correctIndex,
  showResult = false,
  disabled = false,
  onSelect,
}: QuestionCardProps) {
  const getOptionState = (index: number) => {
    if (!showResult) {
      if (selectedAnswer === index) return 'selected';
      return 'default';
    }
    // Show result
    if (index === correctIndex) return 'correct';
    if (index === selectedAnswer && index !== correctIndex) return 'wrong';
    return 'faded';
  };

  const stateClasses = {
    default: 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer',
    selected: 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200',
    correct: 'bg-green-50 border-green-500 ring-2 ring-green-200',
    wrong: 'bg-red-50 border-red-500 ring-2 ring-red-200',
    faded: 'bg-gray-50 border-gray-100 opacity-50',
  };

  return (
    <div className="w-full">
      {/* Question */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 leading-relaxed"
      >
        {question}
      </motion.h2>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          const state = getOptionState(idx);
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => !disabled && onSelect(idx)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                stateClasses[state]
              } ${disabled && state === 'default' ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                state === 'correct' ? 'bg-green-500 text-white' :
                state === 'wrong' ? 'bg-red-500 text-white' :
                state === 'selected' ? 'bg-indigo-500 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {showResult && state === 'correct' ? <Check className="h-4 w-4" /> :
                 showResult && state === 'wrong' ? <X className="h-4 w-4" /> :
                 OPTION_LABELS[idx]}
              </span>
              <span className={`text-[15px] font-medium ${
                state === 'correct' ? 'text-green-700' :
                state === 'wrong' ? 'text-red-700' :
                state === 'selected' ? 'text-indigo-700' :
                state === 'faded' ? 'text-gray-400' :
                'text-gray-700'
              }`}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}