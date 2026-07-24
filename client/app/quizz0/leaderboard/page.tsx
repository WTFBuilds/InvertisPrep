'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Medal, Crown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';
import { useAuth } from '@/contexts/AuthContext';

const QUIZ_SERVER = process.env.NEXT_PUBLIC_QUIZ_SERVER_URL || 'http://localhost:5001';

const quizFetcher = async (url: string) => {
  const res = await fetch(`${QUIZ_SERVER}${url}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalScore: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  winRate: number;
  accuracy: number;
  user: { name: string; picture?: string; email?: string };
}

const TABS = [
  { value: 'all', label: '🏆 Overall' },
  { value: 'cs', label: '💻 CS' },
  { value: 'java', label: '☕ Java' },
  { value: 'frontend', label: '🎨 Frontend' },
  { value: 'dsa', label: '🧮 DSA' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const subjectParam = activeTab !== 'all' ? `?subject=${activeTab}` : '';
  const { data, isLoading } = useSWR<{ success: boolean; data: LeaderboardEntry[] }>(
    `/api/quiz/leaderboard${subjectParam}`,
    quizFetcher,
    { revalidateOnFocus: false }
  );

  const leaderboard = data?.data || [];
  const myRank = leaderboard.find((e) => e.userId === user?.id);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-200';
      case 2: return 'bg-gray-50 border-gray-300 ring-1 ring-gray-200';
      case 3: return 'bg-orange-50 border-orange-300 ring-1 ring-orange-200';
      default: return 'bg-white border-gray-100';
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-orange-400" />;
      default: return <span className="text-sm font-bold text-gray-400 w-5 text-center">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm">
            <a href="/quizz0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-sm text-gray-500">Top quiz champions</p>
          </div>
        </div>

        {/* My rank card */}
        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    #{myRank.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-white/70">
                      {myRank.totalScore.toLocaleString()} pts • {myRank.wins}W / {myRank.losses}L • {myRank.winRate}% win rate
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-white/70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Leaderboard */}
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-sm">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rankings yet</h3>
                <p className="text-gray-500">Be the first to play and claim the top spot!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card className={`p-4 border ${getRankStyle(entry.rank)} ${isMe ? 'ring-2 ring-indigo-500' : ''}`}>
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="w-8 flex-shrink-0 flex justify-center">
                            {getRankBadge(entry.rank)}
                          </div>

                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {entry.user?.picture ? (
                              <img src={entry.user.picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-gray-500">
                                {entry.user?.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>

                          {/* Name + stats */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${isMe ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {entry.user?.name || 'Unknown'}
                              {isMe && <span className="text-xs ml-1 text-indigo-400">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.wins}W / {entry.losses}L / {entry.draws}D • {entry.winRate}% win rate • {entry.accuracy}% accuracy
                            </p>
                          </div>

                          {/* Score */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-gray-900 tabular-nums">
                              {entry.totalScore.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">pts</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}