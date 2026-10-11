'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity as ActivityIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Radio,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { adminActivityApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  eventDescription,
  timeAgo,
} from '@/components/admin/activity-shared';
import type { ActivityEvent, ActivityOverview, PresenceInfo } from '@/types';

const StatCard = ({
  icon: Icon,
  label,
  value,
  tint,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: number | undefined;
  tint: string;
  sub?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
      <Icon className="h-4 w-4" />
    </div>
    {value === undefined ? (
      <Skeleton className="h-7 w-12" />
    ) : (
      <p className="text-2xl font-black leading-none text-slate-900">{value}</p>
    )}
    <p className="mt-1.5 text-xs font-bold text-slate-600">{label}</p>
    {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
  </div>
);

export default function ActivityMonitorPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [overview, setOverview] = useState<ActivityOverview | null>(null);
  const [online, setOnline] = useState<PresenceInfo[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 25;

  // Debounce the user search before it hits the API
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await adminActivityApi.feed({
        page,
        limit,
        type: type !== 'all' ? type : undefined,
        search: search || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
        setTotal(res.meta?.total ?? res.data.length);
      }
      setError(null);
    } catch {
      setError('Could not load the activity feed.');
    }
  }, [page, type, search]);

  useEffect(() => {
    setLoading(true);
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  // Overview + live list auto-refresh so the monitor genuinely feels live
  useEffect(() => {
    const load = async () => {
      const [ov, on] = await Promise.all([
        adminActivityApi.overview(30).catch(() => null),
        adminActivityApi.online().catch(() => null),
      ]);
      if (ov?.success && ov.data) setOverview(ov.data);
      if (on?.success && Array.isArray(on.data)) setOnline(on.data);
    };
    load();
    const interval = setInterval(load, 25_000);
    return () => clearInterval(interval);
  }, []);

  const userName = (u: ActivityEvent['user']): { name: string; email: string; picture?: string | null; id: string } => {
    if (typeof u === 'string') return { name: 'Unknown', email: '', id: u };
    return {
      name: u?.name || 'Unknown',
      email: u?.email || '',
      picture: u?.picture ?? null,
      id: (u as { _id?: string; id?: string })?._id || (u as { id?: string })?.id || '',
    };
  };

  const pages = Math.max(1, Math.ceil(total / limit));
  const onlineCount = overview?.onlineNow ?? online.length;

  const liveUserRow = useMemo(
    () => (
      <div className="space-y-2.5">
        {online.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-center">
            <Radio className="h-5 w-5 text-slate-300" />
            <p className="text-xs font-semibold text-slate-400">No one is online right now</p>
            <p className="text-[11px] text-slate-400">Users appear here while their tab is open.</p>
          </div>
        )}
        {online.map((p) => {
          const u = p.user as { _id?: string; id?: string; name: string; email: string; picture?: string | null } | null | undefined;
          if (!u) return null;
          const uid = u._id || u.id || '';
          const device = deviceLabel(p.device);
          return (
            <Link
              key={uid}
              href={`/admin/activity/u/${uid}`}
              className="block rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <ViewableAvatar src={u.picture} name={u.name} className="h-8 w-8" plain />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{u.email}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">{timeAgo(p.lastSeenAt)}</span>
              </div>
              <p className="mt-1.5 truncate text-[11px] font-medium text-indigo-600">
                {p.currentTitle || (p.currentPath ? p.currentPath : 'Just active')}
              </p>
              {device && <p className="mt-0.5 truncate text-[10px] text-slate-400">{device}</p>}
            </Link>
          );
        })}
      </div>
    ),
    [online]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            Activity Monitor
            <Badge className="gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Who is online right now, what they are viewing, and everything the platform has recorded.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchFeed()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Radio} label="Online Now" value={onlineCount} tint="bg-emerald-100 text-emerald-600" sub="tab open in last 90s" />
        <StatCard icon={Users} label="Active Today" value={overview?.activeToday} tint="bg-sky-100 text-sky-600" sub="did anything today" />
        <StatCard icon={ActivityIcon} label="Events Today" value={overview?.eventsToday} tint="bg-indigo-100 text-indigo-600" />
        <StatCard icon={Eye} label="Paper Views" value={overview?.viewsToday} tint="bg-violet-100 text-violet-600" sub="today" />
        <StatCard icon={Download} label="Downloads" value={overview?.downloadsToday} tint="bg-teal-100 text-teal-600" sub="today" />
        <StatCard icon={UserPlus} label="New (24 hrs)" value={overview?.new24h} tint="bg-amber-100 text-amber-600" sub={`${overview?.newWeek ?? '—'} this week`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Event feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-800">Activity Feed</h2>
              <p className="text-xs text-slate-400">{total} recorded events</p>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
              <div className="relative sm:w-56">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search user name or email"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-40">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {ACTIVITY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</div>
          )}

          <div className="space-y-1.5">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}

            {!loading &&
              events.map((ev) => {
                const meta = EVENT_META[ev.type] ?? EVENT_META.page_view;
                const u = userName(ev.user);
                const Icon = meta.icon;
                return (
                  <div key={ev._id} className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50">
                    <Link href={`/admin/activity/u/${u.id}`} className="shrink-0" title="Open full trail">
                      <ViewableAvatar src={u.picture} name={u.name} className="h-8 w-8" plain />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/admin/activity/u/${u.id}`} className="text-xs font-bold text-slate-800 hover:text-indigo-600">
                          {u.name}
                        </Link>
                        <Badge className={`gap-1 px-1.5 py-0 text-[10px] font-bold ${meta.chip}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{timeAgo(ev.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{eventDescription(ev)}</p>
                      {(deviceLabel(ev.device) || (isSuperAdmin && ev.ip)) && (
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {[deviceLabel(ev.device), isSuperAdmin ? ev.ip : null].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/admin/activity/u/${u.id}`}
                      className="shrink-0 text-[11px] font-bold text-slate-400 transition-colors hover:text-indigo-600"
                    >
                      Trail →
                    </Link>
                  </div>
                );
              })}

            {!loading && events.length === 0 && !error && (
              <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-center">
                <FileText className="h-5 w-5 text-slate-300" />
                <p className="text-xs font-semibold text-slate-400">No events match these filters yet.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live now */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-800">
                <Radio className="h-4 w-4 text-emerald-500" />
                Live Now
              </h2>
              <p className="text-xs text-slate-400">{onlineCount} online · refreshes automatically</p>
            </div>
          </div>
          {online.length > 0 && overview === null ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            liveUserRow
          )}
        </div>
      </div>
    </div>
  );
}
