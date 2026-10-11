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
  Radio,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, BUILTIN_ROLE_META } from '@/lib/permissions';
import {
  adminActivityApi,
  adminUserApi,
  bugApi,
  eventApi,
  leaderboardApi,
  marketingApi,
  pyqApi,
  reportApi,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniBarChart, timeAgo } from '@/components/admin/activity-shared';
import type {
  AdminUser,
  APIResponse,
  ActivityOverview,
  InvertisEvent,
  MarketingOverview,
  PresenceInfo,
  PYQPaper,
  Report,
  UserStats,
} from '@/types';
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

const deptName = (d: PYQPaper['departmentId']) =>
  typeof d === 'string' ? d : d.displayName || d.name;
const branchName = (b: PYQPaper['branchId']) => (typeof b === 'string' ? b : b.name);

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// One automatic retry after a short delay — covers the seconds when a backend
// is restarting (e.g. during a deploy) so the dashboard never settles on zeros.
const withRetry = async <T,>(fn: () => Promise<T>, delayMs = 1500): Promise<T> => {
  try {
    return await fn();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();

  // Whether this user may see user-management stats — true for admins,
  // super admins and any custom role granted users.view.
  const canViewUsers = hasPermission(user, 'users.view');
  // Monitoring surface. activity.view → live users + full overview;
  // marketing.view → growth overview (no live list, that's monitor-only).
  const canActivity = hasPermission(user, 'activity.view');
  const canMarketing = hasPermission(user, 'marketing.view');
  const canMonitor = canActivity || canMarketing;

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

  // Live monitoring + growth analytics (main-dashboard surface)
  const [overview, setOverview] = useState<ActivityOverview | MarketingOverview | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      let failed = false;

      // SRT has no user management access — skip adminUserApi calls (they'd 403)
      const [u, p, un, r, b, e, nu, lb] = await Promise.all([
        !canViewUsers
          ? Promise.resolve(null)
          : adminUserApi.stats().catch(() => {
              failed = true;
              return null;
            }),
        withRetry(() => pyqApi.getAll({ page: 1, limit: 100 })).catch(() => {
          failed = true;
          return null;
        }),
        withRetry(() => pyqApi.getAll({ page: 1, limit: 5, verified: 'false' })).catch(() => {
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
        !canViewUsers
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

  // Live + growth analytics. activity.view → both panels; marketing.view →
  // growth only. Auto-refreshes so the dashboard genuinely feels live.
  useEffect(() => {
    if (!canMonitor) return;
    const load = async () => {
      const [ov, on] = await Promise.all([
        canActivity
          ? adminActivityApi.overview(30).catch(() => null)
          : marketingApi.overview().catch(() => null),
        canActivity ? adminActivityApi.online().catch(() => null) : Promise.resolve(null),
      ]);
      if (ov?.success && ov.data) setOverview(ov.data);
      if (on?.success && Array.isArray(on.data)) setOnlineUsers(on.data);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [canMonitor, canActivity]);

  const verifiedCount = papers.filter((p) => p.verified).length;
  const unverified = unverifiedPapers; // server-filtered list (accurate total via unverifiedTotal)
  const activeEvents = events.filter((ev) => ev.registrationOpen);

  const monitorHref = canActivity ? '/admin/activity' : '/admin/marketing';
  const onlineNow = overview?.onlineNow ?? onlineUsers.length;

  const roleLabel =
    user?.role === 'staff'
      ? user?.roleMeta?.label || 'Custom Role'
      : BUILTIN_ROLE_META[user?.role || '']?.label || 'Viewer';

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statCards = [
    // Users + live users — the headline pair on the main dash
    ...(canViewUsers
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
    ...(canMonitor
      ? [
          {
            label: 'Online Now',
            value: onlineNow,
            sub: 'on the platform right now',
            icon: Radio,
            href: monitorHref,
            tint: 'bg-emerald-100 text-emerald-600',
          },
          {
            label: 'Active Today',
            value: overview?.activeToday,
            sub: `${overview?.activeWeek ?? '—'} active this week`,
            icon: UserCheck,
            href: monitorHref,
            tint: 'bg-sky-100 text-sky-600',
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

  const signupChart = (overview?.signupSeries ?? []).map((p) => ({ label: p.date, value: p.count }));
  const weeklyChart = (overview?.signupWeeklySeries ?? []).map((p) => ({ label: p.week, value: p.count }));
  const dauChart = (overview?.dauSeries ?? []).map((p) => ({ label: p.date, value: p.count }));

  const growthNumbers = [
    { label: 'Last 24 hrs', value: overview?.new24h, tint: 'text-emerald-600', chip: 'bg-emerald-50 border-emerald-100' },
    { label: 'Last 7 days', value: overview?.newWeek, tint: 'text-sky-600', chip: 'bg-sky-50 border-sky-100' },
    { label: 'Last 30 days', value: (overview as MarketingOverview | null)?.newMonth ?? (overview as ActivityOverview | null)?.new30d, tint: 'text-indigo-600', chip: 'bg-indigo-50 border-indigo-100' },
  ];

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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
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

      {/* Live & growth — the main-dashboard monitoring surface */}
      {canMonitor && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Live users */}
          {canActivity && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-black tracking-tight text-slate-800">Live on InvertisPrep</h2>
                  <Badge className="gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {onlineNow} online
                  </Badge>
                </div>
                <Link
                  href="/admin/activity"
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
                >
                  Activity Monitor <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {overview === null && onlineUsers.length === 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-2xl">🌙</p>
                  <p className="text-xs font-semibold text-slate-400">No one is online right now</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {onlineUsers.slice(0, 9).map((p) => {
                    const u = p.user as { _id?: string; id?: string; name: string; email: string; picture?: string | null } | null;
                    if (!u) return null;
                    const uid = u._id || u.id || '';
                    return (
                      <Link
                        key={uid}
                        href={`/admin/activity/u/${uid}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <ViewableAvatar src={u.picture} name={u.name} className="h-7 w-7" />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-bold text-slate-800">{u.name}</p>
                            <p className="truncate text-[10px] text-slate-400">{timeAgo(p.lastSeenAt)}</p>
                          </div>
                        </div>
                        <p className="mt-1 truncate text-[10px] font-medium text-indigo-600">
                          {p.currentTitle || p.currentPath || 'Just active'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Growth — joined in 24 hrs / 7 days / 30 days */}
          <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${canActivity ? '' : 'lg:col-span-3'}`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-black tracking-tight text-slate-800">User Growth</h2>
              </div>
              <Link
                href="/admin/marketing"
                className="flex items-center gap-1 text-xs font-bold text-slate-700 transition-colors hover:text-indigo-600"
              >
                Marketing <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className={`grid grid-cols-3 gap-2 ${canActivity ? '' : 'sm:max-w-md'}`}>
              {growthNumbers.map((g) => (
                <div key={g.label} className={`rounded-xl border px-3 py-2.5 text-center ${g.chip}`}>
                  {overview === null ? (
                    <Skeleton className="mx-auto h-6 w-10" />
                  ) : (
                    <p className={`text-xl font-black leading-none ${g.tint}`}>{g.value ?? 0}</p>
                  )}
                  <p className="mt-1 text-[10px] font-bold text-slate-500">joined {g.label}</p>
                </div>
              ))}
            </div>

            {overview !== null && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Weekly joins · 8 weeks
                </p>
                <MiniBarChart data={weeklyChart} height={52} barClass="fill-emerald-500" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signup analytics — daily series on the main dash */}
      {canMonitor && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black tracking-tight text-slate-800">New signups · last 30 days</h3>
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-500">
                {overview ? ((overview as MarketingOverview).newMonth ?? (overview as ActivityOverview).new30d) : '—'} total
              </Badge>
            </div>
            {overview === null ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <MiniBarChart data={signupChart} height={72} formatLabel={dayLabel} />
            )}
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              <span>{signupChart.length ? dayLabel(signupChart[0].label) : ''}</span>
              <span>Today</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-black tracking-tight text-slate-800">Daily active users · last 30 days</h3>
            {overview === null ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <MiniBarChart data={dauChart} height={72} barClass="fill-sky-500" formatLabel={dayLabel} />
            )}
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              <span>{dauChart.length ? dayLabel(dauChart[0].label) : ''}</span>
              <span>{overview?.activeMonth ?? '—'} active this month</span>
            </div>
          </div>
        </div>
      )}

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
        {/* Newest users — shown to anyone who can view user management */}
        {canViewUsers && (
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
                    <ViewableAvatar
                      src={u.picture}
                      name={u.name}
                      className="h-8 w-8"
                      fallbackClassName="bg-indigo-100 text-indigo-700"
                    />
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

      {/* User detail dialog (only for users who can view user management) */}
      {canViewUsers && (
        <UserDetailDialog
          userId={detailUserId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </div>
  );
}
