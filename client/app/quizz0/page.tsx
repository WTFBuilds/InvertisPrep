'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, History, ArrowRight, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { SubjectCard } from '@/components/quiz/SubjectCard';
import { useQuizSocket } from '@/contexts/QuizSocketContext';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function QuizzoLandingPage() {
  const router = useRouter();
  const { isConnected } = useQuizSocket();
  const [selectedSubject, setSelectedSubject] = useState<QuizSubject | null>(null);

  const handleQuickMatch = () => {
    if (!selectedSubject) return;
    router.push(`/quizz0/play?subject=${selectedSubject}`);
  };

  const handlePlayWithFriend = () => {
    if (!selectedSubject) return;
    router.push(`/quizz0/room/create?subject=${selectedSubject}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-24 sm:py-32">
        <Spotlight
          className="absolute inset-0"
          gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50.11%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50.11%)"
          gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)"
          spread={100}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Badge
              variant="secondary"
              className="mb-6 bg-white/10 text-indigo-300 border-indigo-500/30 backdrop-blur-sm"
            >
              <Swords className="h-3 w-3 mr-1.5" />
              1v1 Battle Arena
            </Badge>
          </motion.div>

          <TextGenerateEffect
            words="Challenge Your Knowledge"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Pick a subject, find an opponent, and battle it out in real-time
            10-question MCQ rounds. Faster answers earn more points.
          </motion.p>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected to quiz server' : 'Connecting...'}
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── Subject Selection ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Arena</h2>
            <p className="text-gray-500">Select a subject to battle in</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SUBJECTS.map((subject) => (
              <motion.div key={subject.id} variants={item}>
                <SubjectCard
                  icon={subject.icon}
                  name={subject.name}
                  description={subject.description}
                  gradient={subject.color}
                  selected={selectedSubject === subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          {selectedSubject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
            >
              <BackgroundGradient className="rounded-xl w-full">
                <Button
                  onClick={handleQuickMatch}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-base font-semibold shadow-lg shadow-indigo-500/25"
                  size="lg"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Match
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </BackgroundGradient>

              <Button
                onClick={handlePlayWithFriend}
                variant="outline"
                size="lg"
                className="border-gray-200 py-6 text-base font-semibold"
              >
                <Users className="h-5 w-5 mr-2" />
                Play with Friend
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500">Simple rules, intense battles</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Pick a Subject', desc: 'Choose from CS, Java, Frontend, or DSA. Get matched with an opponent instantly.', color: 'from-blue-500 to-indigo-600' },
            { icon: Swords, title: 'Battle It Out', desc: '10 questions, 10 seconds each. Both players answer before the next question appears.', color: 'from-purple-500 to-pink-600' },
            { icon: Trophy, title: 'Score Points', desc: 'Correct + fast = more points (up to 150 per question). Highest total score wins!', color: 'from-amber-500 to-orange-600' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center p-6"
            >
              <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Quick Links ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-gray-200">
            <a href="/quizz0/leaderboard">
              <Trophy className="h-4 w-4 mr-1.5" />
              Leaderboard
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-gray-200">
            <a href="/quizz0/history">
              <History className="h-4 w-4 mr-1.5" />
              Match History
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}