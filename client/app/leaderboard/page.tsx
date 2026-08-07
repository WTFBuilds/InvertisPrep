'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Sparkles, Star, Award, 
  BookOpen, Users, CheckCircle2, Target, Flame, 
  Shield, Zap, ChevronRight, Search, Landmark 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardApi, departmentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 animate-pulse">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          setDepartments(res.data.map(d => ({ id: d.id, displayName: d.displayName })));
        }
      } catch (err) {
        console.error('Failed to load departments, using fallbacks', err);
        // Standard Invertis university departments fallback
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

  const filteredRankings = rankings.filter(entry => 
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.course && entry.course.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-400/20';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-300/20';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-700/20';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-400 drop-shadow animate-pulse" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-300 drop-shadow" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700 drop-shadow" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  const getBadgeColorClasses = (color: 'white' | 'pink' | 'indigo', completed: boolean) => {
    if (!completed) {
      return 'bg-slate-50 border border-slate-200/60 text-slate-400 opacity-60';
    }
    switch (color) {
      case 'pink':
        return 'bg-pink-50 border border-pink-200 text-pink-600 dark:bg-pink-950/20 dark:border-pink-900/50 dark:text-pink-400';
      case 'indigo':
        return 'bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400';
      case 'white':
      default:
        return 'bg-white border border-slate-300 text-slate-700 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* ─── Main Content Layout ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── Sidebar / Sticky Current User Summary ──────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white relative">
                <div className="absolute right-4 top-4 opacity-10">
                  <Landmark className="h-28 w-28" />
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <Avatar className="h-16 w-16 border-2 border-white/20 shadow-md">
                    {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
                    <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                      {user?.name?.slice(0, 2).toUpperCase() || 'IP'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-extrabold text-lg truncate leading-tight">{user?.name}</p>
                    <p className="text-xs text-indigo-100/80 mt-1 truncate">{user?.email}</p>
                    <p className="text-xs font-semibold bg-white/20 rounded-full px-2.5 py-0.5 inline-block mt-2">
                      {user?.course || 'Student'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-4 relative z-10">
                  <div>
                    <span className="text-xs text-indigo-100/60 block">All-Time Rank</span>
                    <span className="text-3xl font-black tracking-tight">
                      {loadingStats ? '...' : `#${myStats?.allTimeRank || '-'}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-100/60 block">Weekly Rank</span>
                    <span className="text-3xl font-black tracking-tight text-pink-300">
                      {loadingStats ? '...' : `#${myStats?.weeklyRank || '-'}`}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6 bg-white dark:bg-slate-950">
                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Star className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-xl font-bold block leading-none">{loadingStats ? '...' : myStats?.points || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Pts</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Flame className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                    <span className="text-xl font-bold block leading-none">{loadingStats ? '...' : myStats?.weeklyPoints || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Weekly</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Award className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-xl font-bold block leading-none">
                      {loadingStats ? '...' : myStats?.badges.filter(b => b.completed).length || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Badges</span>
                  </div>
                </div>

                {/* Progress toward next milestone */}
                {myStats && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Next Milestone</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {myStats.badges.find(b => !b.completed)?.name || 'All Completed!'}
                      </span>
                    </h3>
                    {myStats.badges.find(b => !b.completed) && (() => {
                      const nextBadge = myStats.badges.find(b => !b.completed)!;
                      const progressPct = Math.min(100, Math.max(0, (nextBadge.current / nextBadge.target) * 100));
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600 dark:text-slate-400">{nextBadge.requirement}</span>
                            <span>{nextBadge.current} / {nextBadge.target}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Milestones & Badges Showcase */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Badges & Badges Earned
                  </h3>
                  
                  {loadingStats ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : myStats?.badges.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No achievements yet. Start climbing!</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {myStats?.badges.map((badge) => (
                        <div 
                          key={badge.id} 
                          title={`${badge.name}: ${badge.description} (${badge.completed ? 'Unlocked' : 'Locked'})`}
                          className={`h-11 rounded-lg flex items-center justify-center text-lg relative transition-all ${
                            getBadgeColorClasses(badge.color, badge.completed)
                          }`}
                        >
                          <span>{badge.icon}</span>
                          {badge.completed && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 text-[8px] leading-none">
                              ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Rankings & Main Board ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none bg-white dark:bg-slate-950">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900">
                
                {/* Header inside Card */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Rankings</h2>
                    <p className="text-sm text-slate-500">Live rankings of top contributors</p>
                  </div>

                  {/* Weekly vs. All Time Tabs */}
                  <Tabs 
                    defaultValue="all_time" 
                    value={boardType} 
                    onValueChange={(val) => setBoardType(val as 'all_time' | 'weekly')}
                    className="w-auto"
                  >
                    <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                      <TabsTrigger value="all_time" className="rounded-md px-3.5 py-1 text-xs font-semibold">
                        🏆 All-Time
                      </TabsTrigger>
                      <TabsTrigger value="weekly" className="rounded-md px-3.5 py-1 text-xs font-semibold">
                        🔥 Weekly
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Filters Row */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Department Select dropdown */}
                  <select 
                    value={selectedDept} 
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="all">🎓 All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
                      ))}
                    </motion.div>
                  ) : filteredRankings.length === 0 ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-12 text-center text-slate-400"
                    >
                      <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No rankings found</h3>
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
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                              isMe 
                                ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900' 
                                : 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 shadow-sm hover:shadow'
                            }`}
                          >
                            {/* Rank Indicator */}
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getRankBadgeStyle(entry.rank)}`}>
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                              {entry.picture && <AvatarImage src={entry.picture} alt={entry.name} />}
                              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-bold text-sm">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* Student Details */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm truncate flex items-center gap-1.5 ${
                                isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-200'
                              }`}>
                                {entry.name}
                                {isMe && (
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                                    YOU
                                  </span>
                                )}
                              </p>
                              
                              <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-2">
                                <span>{entry.course || 'Student'}</span>
                                {entry.followersCount > 0 && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span>{entry.followersCount} followers</span>
                                  </>
                                )}
                              </p>
                            </div>

                            {/* Score Display */}
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                                {entry.points.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold block uppercase leading-none">
                                pts
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Badges Explanation Cards */}
            <Card className="border border-slate-200/60 dark:border-slate-800 shadow-md bg-white dark:bg-slate-950 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-indigo-500 fill-indigo-500" />
                  Available Milestone Badges
                </h3>
                <p className="text-xs text-slate-500 mt-1">Unlock custom badges as you rank up and support the Invertis community</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border border-pink-100 bg-pink-50/20 dark:border-pink-900/30 dark:bg-pink-950/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-pink-500 text-white text-xs">📚</span>
                    <span className="font-bold text-sm text-pink-700 dark:text-pink-400">Pink: Points Milestones</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Earned by accumulating total points on your profile: Scholars (500 pts), Legends (2,500 pts), and beyond!
                  </p>
                </div>

                <div className="p-4 border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500 text-white text-xs">⚔️</span>
                    <span className="font-bold text-sm text-indigo-700 dark:text-indigo-400">Indigo: Arena Milestones</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Earned by participating and dominating quiz battles: Quiz Warriors (10 wins), Quiz Gladiators (25 wins).
                  </p>
                </div>

                <div className="p-4 border border-slate-200 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-900/10 rounded-xl space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-300 dark:bg-slate-950 dark:border-slate-700 text-white text-xs">📝</span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">White Outline: Contributions</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Earned by helping other students by uploading verified question papers, syllabus, or building community followers.
                  </p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
