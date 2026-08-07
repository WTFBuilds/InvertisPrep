'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { History, Trophy, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SUBJECTS, QuizSubject } from '@/lib/quizTypes';
import { useAuth } from '@/contexts/AuthContext';

const QUIZ_SERVER = process.env.NEXT_PUBLIC_QUIZ_SERVER_URL || 'http://localhost:5001';

// Custom fetcher that hits the quiz server directly
const quizFetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${QUIZ_SERVER}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface MatchHistoryItem {
  _id: string;
  subject: QuizSubject;
  mode: string;
  status: string;
  players: {
    user: { name: string; picture?: string };
    score: number;
    correctCount: number;
  }[];
  winner?: { name: string };
  createdAt: string;
}

const SUBJECT_FILTERS = [
  { value: '', label: 'All' },
  { value: 'cs', label: '💻 CS' },
  { value: 'java', label: '☕ Java' },
  { value: 'frontend', label: '🎨 Frontend' },
  { value: 'dsa', label: '🧮 DSA' },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({ page: String(page), limit: '20' });
  if (subjectFilter) queryParams.set('subject', subjectFilter);

  const { data, isLoading } = useSWR<{ success: boolean; data: { matches: MatchHistoryItem[]; pagination: any } }>(
    `/api/quiz/history?${queryParams}`,
    quizFetcher,
    { revalidateOnFocus: false }
  );

  const matches = data?.data?.matches || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <a href="/quizz0">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </a>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
          </div>
        </div>

        {/* Subject Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SUBJECT_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={subjectFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSubjectFilter(filter.value); setPage(1); }}
              className={subjectFilter === filter.value
                ? 'bg-indigo-500 text-white'
                : 'border-gray-200 text-gray-600'
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-500 mb-6">Play your first match to see history here.</p>
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <a href="/quizz0">Start Playing</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((match, idx) => {
              const subjectInfo = SUBJECTS.find((s) => s.id === match.subject);
              const me = match.players.find((p) => p.user?.name === user?.name || (p.user as any)?._id === user?.id);
              const opponent = match.players.find((p) => p.user?.name !== user?.name && (p.user as any)?._id !== user?.id);
              const winnerId = (match.winner as any)?._id || (match.winner as any);
              const isWinner = winnerId === user?.id || winnerId?.toString() === user?.id;
              const isDraw = !match.winner && me?.score === opponent?.score;

              return (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* Subject icon */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subjectInfo?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-lg flex-shrink-0`}>
                        {subjectInfo?.icon || '?'}
                      </div>

                      {/* Match info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            vs {opponent?.user?.name || 'Opponent'}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              isDraw ? 'bg-yellow-50 text-yellow-700' :
                              isWinner ? 'bg-green-50 text-green-700' :
                              'bg-red-50 text-red-700'
                            }`}
                          >
                            {isDraw ? 'Draw' : isWinner ? 'Won' : 'Lost'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(match.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' • '}
                          {match.mode === 'auto' ? 'Quick Match' : 'Room'}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">{me?.score || 0}</p>
                        <p className="text-xs text-gray-500">
                          {me?.correctCount || 0}/10 correct
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {pagination.pages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}