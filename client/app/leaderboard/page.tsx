'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Medal, Crown, Star, Award, Users,
  CheckCircle2, Flame, ChevronRight, Search, Landmark,
  Sparkles, ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardApi, departmentApi } from '@/lib/api';
import { optimizeAvatar } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  userId: string;
  points: number;
  name: string;
  email: string;
  picture?: string;
  course?: string;
  followersCount: number;
  rank: number;
}

interface UserStats {
  points: number;
  weeklyPoints: number;
  allTimeRank: number;
  weeklyRank: number;
  stats: {
    verifiedUploads: number;
    quizWins: number;
    followers: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: 'white' | 'pink' | 'indigo';
    requirement: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  return <LeaderboardContent />;
}

function LeaderboardContent() {
  const { user } = useAuth();
  const [boardType, setBoardType] = useState<'all_time' | 'weekly'>('all_time');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [departments, setDepartments] = useState<{ id: string; displayName: string }[]>([]);

  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Load departments
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await departmentApi.getAll();
        if (res.success && res.data) {
          setDepartments(res.data.map((d) => ({ id: d.id, displayName: d.displayName })));
        }
      } catch (err) {
        console.error('Failed to load departments, using fallbacks', err);
        setDepartments([
          { id: 'mca', displayName: 'MCA' },
          { id: 'bca', displayName: 'BCA' },
          { id: 'btech', displayName: 'B.Tech CS' },
          { id: 'mba', displayName: 'MBA' },
          { id: 'bba', displayName: 'BBA' },
          { id: 'pharmacy', displayName: 'Pharmacy' },
        ]);
      }
    }
    loadDepts();
  }, []);

  // Load Rankings
  useEffect(() => {
    async function fetchRankings() {
      setLoadingList(true);
      try {
        const deptParam = selectedDept === 'all' ? undefined : selectedDept;
        const res = await leaderboardApi.getRankings(boardType, deptParam);
        if (res.success && res.data) {
          setRankings(res.data);
        }
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setLoadingList(false);
      }
    }
    fetchRankings();
  }, [boardType, selectedDept]);

  // Load My Stats & Badges
  useEffect(() => {
    async function fetchMyStats() {
      if (!user) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
        const res = await leaderboardApi.getMyStats();
        if (res.success && res.data) {
          setMyStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching personal stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchMyStats();
  }, [user]);

  const filteredRankings = rankings.filter((entry) =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.course && entry.course.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-400 text-white shadow-md shadow-amber-400/30';
      case 2:
        return 'bg-slate-300 text-white shadow-md shadow-slate-300/30';
      case 3:
        return 'bg-amber-600 text-white shadow-md shadow-amber-600/30';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-white drop-shadow" />;
      case 2:
        return <Medal className="h-5 w-5 text-white drop-shadow" />;
      case 3:
        return <Medal className="h-5 w-5 text-white drop-shadow" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  const getBadgeColorClasses = (color: 'white' | 'pink' | 'indigo', completed: boolean) => {
    if (!completed) {
      return 'border border-slate-200 bg-slate-50 text-slate-300';
    }
    switch (color) {
      case 'pink':
        return 'border border-pink-200 bg-pink-50 text-pink-600';
      case 'indigo':
        return 'border border-indigo-200 bg-indigo-50 text-indigo-600';
      case 'white':
      default:
        return 'border border-slate-300 bg-white text-slate-700 shadow-sm';
    }
  };

  const nextBadge = myStats?.badges.find((b) => !b.completed);

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-10">
        {/* ── page header ── */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Community</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            <Trophy className="h-8 w-8 text-amber-400" />
            Leaderboard
          </h1>
          <p className="mt-2 text-slate-500">Live rankings of the most helpful contributors on InvertisPrep.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── sidebar / current user summary ── */}
          <div className="space-y-6 lg:col-span-1">
            <GlowCard className="sticky top-24 overflow-hidden rounded-2xl border-slate-200 bg-white">
              {/* identity */}
              <div className="relative px-6 pb-5 pt-6">
                <Landmark className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 text-slate-100" />
                <div className="relative flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-200 shadow-sm">
                    {user?.picture && (
                      <AvatarImage
                        src={optimizeAvatar(user.picture)}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-slate-900 text-xl font-bold text-white">
                      {user?.name?.slice(0, 2).toUpperCase() || 'IP'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold leading-tight text-slate-900">{user?.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email}</p>
                    <Badge variant="secondary" className="mt-2">{user?.course || 'Student'}</Badge>
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">All-Time Rank</p>
                    <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-slate-900">
                      {loadingStats ? '…' : `#${myStats?.allTimeRank || '-'}`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Weekly Rank</p>
                    <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-indigo-600">
                      {loadingStats ? '…' : `#${myStats?.weeklyRank || '-'}`}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="mx-6 w-auto" />

              {/* score breakdown */}
              <div className="grid grid-cols-3 gap-2 px-6 pt-5 text-center">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Star className="mx-auto mb-1 h-4 w-4 text-indigo-500" />
                  <span className="block text-xl font-bold leading-none tabular-nums text-slate-900">
                    {loadingStats ? '…' : myStats?.points || 0}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Pts</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Flame className="mx-auto mb-1 h-4 w-4 text-pink-500" />
                  <span className="block text-xl font-bold leading-none tabular-nums text-slate-900">
                    {loadingStats ? '…' : myStats?.weeklyPoints || 0}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weekly</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Award className="mx-auto mb-1 h-4 w-4 text-amber-500" />
                  <span className="block text-xl font-bold leading-none tabular-nums text-slate-900">
                    {loadingStats ? '…' : myStats?.badges.filter((b) => b.completed).length || 0}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Badges</span>
                </div>
              </div>

              {/* progress toward next milestone */}
              <div className="px-6 pt-6">
                <h3 className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Next Milestone</span>
                  <span className="font-bold normal-case tracking-normal text-indigo-600">
                    {nextBadge?.name || 'All Completed!'}
                  </span>
                </h3>
                {nextBadge && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{nextBadge.requirement}</span>
                      <span className="tabular-nums text-slate-500">{nextBadge.current} / {nextBadge.target}</span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(0, (nextBadge.current / nextBadge.target) * 100))}
                      className="h-2 bg-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* badges showcase */}
              <div className="px-6 pb-6 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">My Badges</h3>
                {loadingStats ? (
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-11 w-11 rounded-lg" />)}
                  </div>
                ) : myStats?.badges.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No achievements yet. Start climbing!</p>
                ) : (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {myStats?.badges.map((badge) => (
                      <div
                        key={badge.id}
                        title={`${badge.name}: ${badge.description} (${badge.completed ? 'Unlocked' : 'Locked'})`}
                        className={`relative flex h-11 items-center justify-center rounded-lg text-lg transition-all ${getBadgeColorClasses(badge.color, badge.completed)}`}
                      >
                        <span className={badge.completed ? '' : 'grayscale opacity-60'}>{badge.icon}</span>
                        {badge.completed && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] leading-none text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlowCard>
          </div>

          {/* ── rankings & main board ── */}
          <div className="space-y-6 lg:col-span-2">
            <GlowCard className="rounded-2xl border-slate-200 bg-white">
              {/* header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Rankings</h2>
                  <p className="text-sm text-slate-500">Live rankings of top contributors</p>
                </div>

                <Tabs
                  defaultValue="all_time"
                  value={boardType}
                  onValueChange={(val) => setBoardType(val as 'all_time' | 'weekly')}
                  className="w-auto"
                >
                  <TabsList className="rounded-lg bg-slate-100 p-1">
                    <TabsTrigger value="all_time" className="rounded-md px-3.5 py-1 text-xs font-semibold">
                      <Trophy className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> All-Time
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="rounded-md px-3.5 py-1 text-xs font-semibold">
                      <Flame className="mr-1.5 h-3.5 w-3.5 text-pink-500" /> Weekly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* filters */}
              <div className="grid gap-3 border-b border-slate-100 p-6 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">🎓 All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.displayName}</option>
                  ))}
                </select>
              </div>

              {/* list */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {loadingList ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                    </motion.div>
                  ) : filteredRankings.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-12 text-center"
                    >
                      <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                      <h3 className="mb-1 text-lg font-bold text-slate-900">No rankings found</h3>
                      <p className="text-sm text-slate-500">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Be the first to upload/participate and rank up!'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {filteredRankings.map((entry, index) => {
                        const isMe = entry.userId === user?.id;
                        return (
                          <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                            className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                              isMe
                                ? 'border-indigo-200 bg-indigo-50/60 shadow-sm'
                                : 'border-slate-100 bg-white shadow-sm hover:border-slate-200 hover:shadow'
                            }`}
                          >
                            {/* rank indicator */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getRankBadgeStyle(entry.rank)}`}>
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* avatar */}
                            <Avatar className="h-10 w-10 shrink-0 border border-slate-100 shadow-sm">
                              {entry.picture && (
                                <AvatarImage
                                  src={optimizeAvatar(entry.picture)}
                                  alt={entry.name}
                                  referrerPolicy="no-referrer"
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback className="bg-slate-900 text-sm font-bold text-white">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* details */}
                            <div className="min-w-0 flex-1">
                              <p className={`flex items-center gap-1.5 truncate text-sm font-semibold ${
                                isMe ? 'text-indigo-600' : 'text-slate-900'
                              }`}>
                                {entry.name}
                                {isMe && (
                                  <Badge variant="indigo" className="px-1.5 py-0 text-[9px]">YOU</Badge>
                                )}
                              </p>
                              <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-slate-500">
                                <span>{entry.course || 'Student'}</span>
                                {entry.followersCount > 0 && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {entry.followersCount}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>

                            {/* score */}
                            <div className="shrink-0 text-right">
                              <span className="block text-lg font-black tabular-nums tracking-tight text-slate-900">
                                {entry.points.toLocaleString()}
                              </span>
                              <span className="block text-[10px] font-bold uppercase leading-none text-slate-400">pts</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlowCard>

            {/* badges explanation */}
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6">
              <div className="mb-4">
                <h3 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-slate-900">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  Available Milestone Badges
                </h3>
                <p className="mt-1 text-xs text-slate-500">Unlock custom badges as you rank up and support the Invertis community</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-pink-500 p-1.5 text-xs text-white">📚</span>
                    <span className="text-sm font-bold text-pink-700">Points Milestones</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Earned by accumulating total points on your profile: Scholars (500 pts), Legends (2,500 pts), and beyond!
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-500 p-1.5 text-xs text-white">⚔️</span>
                    <span className="text-sm font-bold text-indigo-700">Arena Milestones</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Earned by participating and dominating quiz battles: Quiz Warriors (10 wins), Quiz Gladiators (25 wins).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-slate-300 bg-slate-900 p-1.5 text-xs text-white">📝</span>
                    <span className="text-sm font-bold text-slate-700">Contributions</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Earned by helping other students by uploading verified question papers, syllabus, or building community followers.
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* footnote link */}
            <div className="flex justify-center">
              <Button variant="ghost" className="font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                <ShieldCheck className="mr-2 h-4 w-4" />
                How are points calculated?
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
