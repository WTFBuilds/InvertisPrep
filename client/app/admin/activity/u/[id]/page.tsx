'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  LogIn,
  Radio,
  Search,
  Sparkles,
} from 'lucide-react';

import { adminActivityApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BUILTIN_ROLE_META, ROLE_COLORS } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';
import {
  ACTIVITY_TYPE_OPTIONS,
  EVENT_META,
  deviceLabel,
  durationLabel,
  eventDescription,
  formatDateTime,
  timeAgo,
} from '@/components/admin/activity-shared';
import type { ActivityEvent, ActivityUserSummary } from '@/types';

export default function UserActivityPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const { user: viewer } = useAuth();
  const isSuperAdmin = viewer?.role === 'super-admin';

  const [summary, setSummary] = useState<ActivityUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<ActivityEvent[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logType, setLogType] = useState('all');
  const [logsLoading, setLogsLoading] = useState(false);

  const [papers, setPapers] = useState<
    { entityId: string; title: string; subjectName?: string; departmentName?: string; views: number; downloads: number; lastAt: string }[]
  >([]);

  const limit = 30;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      adminActivityApi.userSummary(userId),
      adminActivityApi.userPapers(userId),
    ])
      .then(([s, p]) => {
        if (s.success && s.data) setSummary(s.data);
        else setError((s as { message?: string }).message || 'Failed to load user');
        if (p.success && Array.isArray(p.data)) setPapers(p.data);
      })
      .catch(() => setError('Failed to load user activity.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLogsLoading(true);
    adminActivityApi
      .userLogs(userId, { page: logPage, limit, type: logType !== 'all' ? logType : undefined })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setLogs(res.data);
          setLogTotal(res.meta?.total ?? res.data.length);
        }
      })
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [userId, logPage, logType]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm font-semibold text-slate-600">{error || 'User not found.'}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/activity"><ArrowLeft className="h-3.5 w-3.5" /> Back to monitor</Link>
        </Button>
      </div>
    );
  }

  const { user, presence, stats, sessions } = summary;
  const online = presence && Date.now() - new Date(presence.lastSeenAt).getTime() < 90_000;
  const roleBadge =
    user.role === 'staff'
      ? ROLE_COLORS[user.roleColor || 'violet']?.badge || 'bg-violet-600 text-white'
      : BUILTIN_ROLE_META[user.role]?.badge || 'bg-slate-100 text-slate-700 border border-slate-200';
  const roleLabel = user.role === 'staff' ? user.roleLabel || 'Custom Role' : BUILTIN_ROLE_META[user.role]?.label || 'Student';

  const statCards = [
    { label: 'Total events', value: stats.totalEvents, icon: Sparkles, tint: 'bg-indigo-100 text-indigo-600' },
    { label: 'Papers viewed', value: stats.paperViews, icon: FileText, tint: 'bg-violet-100 text-violet-600' },
    { label: 'Downloads', value: stats.downloads, icon: Download, tint: 'bg-emerald-100 text-emerald-600' },
    { label: 'Searches', value: stats.searches, icon: Search, tint: 'bg-sky-100 text-sky-600' },
    { label: 'Sign-ins', value: stats.logins, icon: LogIn, tint: 'bg-teal-100 text-teal-600' },
    { label: 'Active days (30d)', value: stats.activeDays30, icon: CalendarDays, tint: 'bg-amber-100 text-amber-600' },
  ];

  const logPages = Math.max(1, Math.ceil(logTotal / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <ViewableAvatar src={user.picture} name={user.name} className="h-14 w-14" />
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">{user.name}</h1>
              <Badge className={`px-2 py-0.5 text-[10px] font-bold ${roleBadge}`}>{roleLabel}</Badge>
              {online ? (
                <Badge className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Radio className="h-3 w-3" /> Online now
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-slate-400">
                  Last seen {timeAgo(stats.lastSeenAt || presence?.lastSeenAt)}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              {[user.course, user.studentId, user.phoneNumber, user.isActive === false ? 'Account banned' : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/admin/activity"><ArrowLeft className="h-3.5 w-3.5" /> Monitor</Link>
        </Button>
      </div>

      {/* Right now */}
      {presence && online && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Right now</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {presence.currentTitle || presence.currentPath || 'Active somewhere on the platform'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {[presence.currentPath, deviceLabel(presence.device), isSuperAdmin ? presence.ip : null].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black leading-none text-slate-900">{s.value}</p>
            <p className="mt-1.5 text-xs font-bold text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs: Timeline / Papers / Sessions */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="timeline" className="text-xs font-bold">Timeline</TabsTrigger>
          <TabsTrigger value="papers" className="text-xs font-bold">Papers ({papers.length})</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs font-bold">Sessions ({sessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{logTotal} events recorded</p>
            <Select
              value={logType}
              onValueChange={(v) => {
                setLogType(v);
                setLogPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {ACTIVITY_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            {logsLoading ? (
              <div className="space-y-1.5 p-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-0.5">
                {logs.map((ev) => {
                  const meta = EVENT_META[ev.type] ?? EVENT_META.page_view;
                  const Icon = meta.icon;
                  return (
                    <div key={ev._id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">{eventDescription(ev)}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {meta.label}
                          {deviceLabel(ev.device) ? ` · ${deviceLabel(ev.device)}` : ''}
                          {isSuperAdmin && ev.ip ? ` · ${ev.ip}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-semibold text-slate-500">{timeAgo(ev.createdAt)}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(ev.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <p className="py-10 text-center text-xs text-slate-400">No events of this type yet.</p>
                )}
              </div>
            )}

            {logPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-3 pb-1">
                <p className="text-xs text-slate-400">Page {logPage} of {logPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={logPage >= logPages} onClick={() => setLogPage((p) => p + 1)}>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="papers">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {papers.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">This user hasn&apos;t opened any papers yet.</p>
            ) : (
              <div className="space-y-1.5">
                {papers.map((p) => (
                  <div key={p.entityId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">{p.title || p.subjectName || 'Paper'}</p>
                      <p className="truncate text-[11px] text-slate-400">{p.departmentName || ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {p.downloads}</span>
                      <span className="hidden w-20 text-right text-slate-400 sm:block">{timeAgo(p.lastAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {sessions.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">No browsing sessions recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {sessions.map((s) => (
                  <div key={s.sessionKey} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        {formatDateTime(s.firstAt)} <span className="font-normal text-slate-400">→</span> {timeAgo(s.lastAt)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {s.events} events · {durationLabel(s.firstAt, s.lastAt)}
                        {deviceLabel(s.device) ? ` · ${deviceLabel(s.device)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
