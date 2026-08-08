'use client';

import { motion } from 'framer-motion';
import { GlowCard } from '@/components/ui/glow-card';

interface SubjectCardProps {
  icon: string;
  name: string;
  description: string;
  gradient: string;
  questionCount?: number;
  onClick: () => void;
  selected?: boolean;
}

export function SubjectCard({ icon, name, description, gradient, questionCount, onClick, selected }: SubjectCardProps) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClick}>
      <GlowCard
        className={`cursor-pointer transition-all duration-300 ${
          selected ? 'ring-2 ring-indigo-500 border-indigo-300' : ''
        }`}
      >
        <div className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          {questionCount !== undefined && (
            <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {questionCount} questions
            </span>
          )}
        </div>
      </GlowCard>
    </motion.div>
  );
}