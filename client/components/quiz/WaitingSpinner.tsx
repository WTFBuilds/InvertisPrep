'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface WaitingSpinnerProps {
  text?: string;
}

export function WaitingSpinner({ text = 'Waiting for opponent...' }: WaitingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-500"
        />
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-sm text-gray-500 font-medium"
      >
        {text}
      </motion.p>
    </div>
  );
}