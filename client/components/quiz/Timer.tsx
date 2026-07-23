'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  duration: number; // ms
  isRunning: boolean;
  questionIndex: number; // changes each question to force reset
  onTimeUp?: () => void;
}

export function Timer({ duration, isRunning, questionIndex, onTimeUp }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const seconds = Math.ceil(remaining / 1000);
  const fraction = remaining / duration;

  // Reset timer when question changes (questionIndex changes)
  useEffect(() => {
    setRemaining(duration);
  }, [questionIndex, duration]);

  // Countdown interval
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          clearInterval(interval);
          onTimeUpRef.current?.();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, questionIndex]); // questionIndex dependency ensures restart

  const getColor = () => {
    if (fraction > 0.5) return 'text-green-500';
    if (fraction > 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrokeColor = () => {
    if (fraction > 0.5) return '#22c55e';
    if (fraction > 0.3) return '#eab308';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle
          cx="48" cy="48" r="40"
          fill="none" stroke="currentColor" strokeWidth="4"
          className="text-gray-200"
        />
        <motion.circle
          cx="48" cy="48" r="40"
          fill="none" stroke={getStrokeColor()}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={`${questionIndex}-${seconds}`}
          initial={{ scale: 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-bold tabular-nums ${getColor()}`}
        >
          {seconds}s
        </motion.span>
      </div>
    </div>
  );
}