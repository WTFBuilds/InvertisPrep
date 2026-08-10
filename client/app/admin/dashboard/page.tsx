'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bug,
  CalendarDays,
  Clock,
  FileText,
  Flag,
  ShieldCheck,
  Trophy,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminUserApi,
  bugApi,
  eventApi,
  leaderboardApi,
  pyqApi,
  reportApi,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUser, APIResponse, InvertisEvent, PYQPaper, Report, UserStats } from '@/types';
import { UserDetailDialog } from '@/components/admin/user-detail-dialog';

interface LeaderEntry {
  rank: number;
  userId: string;
  points: number;
  name: string;
  email: string;
  picture: string | null;
  course: string;
}

interface BugItem {
  _id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  wrong_file: 'Wrong file',
  poor_quality: 'Poor quality',
  wrong_metadata: 'Wrong metadata',
  other: 'Other',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const deptName = (d: PYQPaper['departmentId']) =>
  typeof d === 'string' ? d : d.displayName || d.name;
const branchName = (b: PYQPaper['branchId']) => (typeof b === 'string' ? b : b.name);

export default function AdminDashboard() {
  const { user } = useAuth();

  // SRT has no user management access — hide user-related stats and fetches
  const isSrt = user?.role === 'srt';

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [paperTotal, setPaperTotal] = useState(0);
  const [unverifiedPapers, setUnverifiedPapers] = useState<PYQPaper[]>([]);
  const [unverifiedTotal, setUnverifiedTotal] = useState(0);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [openBugs, setOpenBugs] = useState<BugItem[]>([]);
  const [events, setEvents] = useState<InvertisEvent[]>([]);
  const [newestUsers, setNewestUsers] = useState<AdminUser[]>([]);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      let failed = false;

      // SRT has no user management access — skip adminUserApi calls (they'd 403)
      const [u, p, un, r, b, e, nu, lb] = await Promise.all([
        isSrt
          ? Promise.resolve(null)
          : adminUserApi.stats().catch(() => {
              failed = true;
              return null;
            }),
        pyqApi.getAll({ page: 1, limit: 100 }).catch(() => {
          failed = true;
          return null;
        }),
        pyqApi.getAll({ page: 1, limit: 5, verified: 'false' }).catch(() => {
          failed = true;
          return null;
        }),
        reportApi.getAll('pending').catch(() => {
          failed = true;
          return null;
        }),
        bugApi.getAll('pending').catch(() => {
          failed = true;
          return null;
        }),
        eventApi.getAll().catch(() => {
          failed = true;
          return null;
        }),
        isSrt
          ? Promise.resolve(null)
          : adminUserApi.list({ sort: 'newest', limit: 5 }).catch(() => {
              failed = true;
              return null;
            }),
        leaderboardApi.getRankings('all_time').catch(() => {
          failed = true;
          return null;
        }),
      ]);

      if (failed) setWarning('Some dashboard data could not be loaded. Showing what is available.');

      if (u?.success && u.data) setUserStats(u.data);
      if (p?.success && Array.isArray(p.data)) {
        setPapers(p.data);
        const paged = p as APIResponse<PYQPaper[]> & { total?: number };
        setPaperTotal(typeof paged.total === 'number' ? paged.total : p.data.length);
      }
      if (un?.success && Array.isArray(un.data)) {
        setUnverifiedPapers(un.data);
        const pagedUn = un as APIResponse<PYQPaper[]> & { total?: number };
        setUnverifiedTotal(typeof pagedUn.total === 'number' ? pagedUn.total : un.data.length);
      }
      if (r?.success && Array.isArray(r.data)) setPendingReports(r.data);
      if (b?.success && Array.isArray(b.data)) setOpenBugs(b.data);
      if (e?.success && Array.isArray(e.data)) setEvents(e.data);
      if (nu?.success && Array.isArray(nu.data)) setNewestUsers(nu.data);
      if (lb?.success && Array.isArray(lb.data)) setLeaders(lb.data as LeaderEntry[]);

      setLoading(false);
    };

    fetchAll();
  }, []);

  const verifiedCount = papers.filter((p) => p.verified).length;
  const unverified = unverifiedPapers; // server-filtered list (accurate total via unverifiedTotal)
  const activeEvents = events.filter((ev) => ev.registrationOpen);

  const roleLabel =
    user?.role === 'super-admin'
      ? 'Super Admin'
      : user?.role === 'admin'
        ? 'Admin'
        : user?.role === 'srt'
          ? 'SRT'
          : 'Viewer';

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statCards = [
    // SRT has no user management access — no Total Users card for them
    ...(!isSrt
      ? [
          {
            label: 'Total Users',
            value: userStats?.total,
            sub: userStats ? `${userStats.active} active · ${userStats.banned} banned` : '—',
            icon: Users,
            href: '/admin/users',
            tint: 'bg-indigo-100 text-indigo-600',
          },
        ]
      : []),
    {
      label: 'Papers',
      value: paperTotal,
      sub: `${verifiedCount} verified`,
      icon: FileText,
      href: '/admin/papers',
      tint: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Pending Review',
      value: unverifiedTotal,
      sub: 'awaiting verification',
      icon: Clock,
      href: '/admin/papers?verified=unverified',
      tint: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Pending Reports',
      value: pendingReports.length,
      sub: 'need resolution',
      icon: Flag,
      href: '/admin/reports',
      tint: 'bg-rose-100 text-rose-600',
    },
    {
      label: 'Open Bugs',
      value: openBugs.length,
      sub: 'need attention',
      icon: Bug,
      href: '/admin/bugs',
      tint: 'bg-red-100 text-red-600',
    },
    {
      label: 'Active Events',
      value: activeEvents.length,
      sub: `${events.length} total`,
      icon: CalendarDays,
      href: '/admin/events',
      tint: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const quickActions = [
    { label: 'Departments', href: '/admin/departments' },
    { label: 'Branches', href: '/admin/branches' },
    { label: 'Sessions', href: '/admin/sessions' },
    { label: 'Syllabus', href: '/admin/syllabus' },
    { label: 'Bug Reports', href: '/admin/bugs' },
    { label: 'Events', href: '/admin/events' },
  ];

  const rankTint = (rank: number) =>
    rank === 1
      ? 'bg-amber-100 text-amber-700'
      : rank === 2
        ? 'bg-slate-200 text-slate-600'
        : rank === 3
          ? 'bg-orange-100 text-orange-700'
          : 'bg-slate-100 text-slate-500';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening across InvertisPrep today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="gap-1.5 bg-slate-900 py-1 text-white">
            <ShieldCheck className="h-3 w-3" />
            {roleLabel}
          </Badge>
          <Button asChild className="gap-2 rounded-xl">
            <Link href="/admin/upload">
              <Upload className="h-4 w-4" />
              Upload Paper
            </Link>
          </Button>
        </div>
      </div>

      {/* Warning strip */}
      {warning && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700">
          {warning}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="group h-full rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-black leading-none text-slate-900">{s.value}</p>
              )}
              <p className="mt-1.5 text-xs font-bold text-slate-600">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Needs attention */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Needs Attention</h2>
            <p className="text-xs text-slate-500">Items that require your review or action.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Unverified papers */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Unverified Papers</h3>
              </div>
              <Badge className="bg-amber-100 text-amber-700">{unverifiedTotal}</Badge>
            </div>
            <div className="flex-1 space-y-2.5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              {!loading &&
                unverified.slice(0, 5).map((paper) => (
                  <div key={paper._id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {paper.subjectName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {deptName(paper.departmentId)} · {branchName(paper.branchId)} · {paper.year}
                    </p>
                  </div>
                ))}
              {!loading && unverified.length === 0 && (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-2xl">🎉</p>
                  <p className="text-xs font-semibold text-slate-500">All papers verified</p>
                </div>
              )}
            </div>
            <Link
              href="/admin/papers"
              className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
            >
              View all papers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Pending reports */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800">Pending Reports</h3>
              </div>
              <Badge className="bg-rose-100 text-rose-700">{pendingReports.length}</Badge>
            </div>
            <div className="flex-1 space-y-2.5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              {!loading &&
                pendingReports.slice(0, 5).map((report) => (
                  <div key={report._id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {typeof report.paperId === 'string'
                        ? report.paperId
                        : report.paperId?.subjectName || 'Unknown paper'}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {REASON_LABELS[report.reason] || report.reason} · by{' '}
                      {typeof report.reportedBy === 'string'
                        ? 'User'
                        : report.reportedBy?.name || 'User'}
                    </p>
                  </div>
                ))}
              {!loading && pendingReports.length === 0 && (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-2xl">✅</p>
                  <p className="text-xs font-semibold text-slate-500">No pending reports</p>
                </div>
              )}
            </div>
            <Link
              href="/admin/reports"
              className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
            >
              View all reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Open bugs */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-bold text-slate-800">Open Bugs</h3>
              </div>
              <Badge className="bg-red-100 text-red-600">{openBugs.length}</Badge>
            </div>
            <div className="flex-1 space-y-2.5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              {!loading &&
                openBugs.slice(0, 5).map((bug) => (
                  <div key={bug._id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-slate-700">{bug.title}</p>
                    <p className="mt-1">
                      <Badge className={SEVERITY_STYLES[bug.severity] || SEVERITY_STYLES.low}>
                        {bug.severity}
                      </Badge>
                    </p>
                  </div>
                ))}
              {!loading && openBugs.length === 0 && (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-2xl">🛡️</p>
                  <p className="text-xs font-semibold text-slate-500">No open bugs</p>
                </div>
              )}
            </div>
            <Link
              href="/admin/bugs"
              className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
            >
              View all bugs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Newest users (hidden for SRT — no user management access) */}
        {!isSrt && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800">Newest Users</h3>
              </div>
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                ))}
              {!loading &&
                newestUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                    <Avatar className="h-8 w-8">
                      {u.picture && <AvatarImage src={u.picture} alt={u.name} />}
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] font-semibold"
                      onClick={() => {
                        setDetailUserId(u.id);
                        setDetailOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              {!loading && newestUsers.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">No users yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Top Contributors</h3>
            </div>
          </div>
          <div className="space-y-2">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            {!loading &&
              leaders.slice(0, 5).map((entry) => (
                <div key={entry.userId} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${rankTint(entry.rank)}`}
                  >
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{entry.name}</p>
                    <p className="truncate text-xs text-slate-400">{entry.course}</p>
                  </div>
                  <p className="text-sm font-black text-indigo-600">{entry.points} pts</p>
                </div>
              ))}
            {!loading && leaders.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No rankings yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Button key={a.href} asChild variant="outline" size="sm" className="rounded-full border-slate-200 text-xs font-semibold text-slate-600">
              <Link href={a.href}>{a.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {/* User detail dialog (SRT has no user management access) */}
      {!isSrt && (
        <UserDetailDialog
          userId={detailUserId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </div>
  );
}
