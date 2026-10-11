'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Flame,
  Globe,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Snowflake,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

import { marketingApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';
import {
  EVENT_META,
  LEAD_STATUS_META,
  MiniBarChart,
  deviceLabel,
  eventDescription,
  formatDateTime,
  timeAgo,
} from '@/components/admin/activity-shared';
import type { MarketingLead, MarketingLeadDetail, MarketingOverview } from '@/types';

const StatCard = ({
  icon: Icon,
  label,
  value,
  tint,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: number | string | undefined;
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

// ── Lead detail drawer ───────────────────────────────────────────────────────
function LeadDetailDialog({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<MarketingLeadDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !leadId) return;
    setLoading(true);
    setDetail(null);
    marketingApi
      .lead(leadId)
      .then((res) => {
        if (res.success && res.data) setDetail(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, leadId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {loading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        )}

        {!loading && detail && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3 pt-1">
                <div className="relative shrink-0">
                  <ViewableAvatar src={detail.user.picture} name={detail.user.name} className="h-12 w-12" />
                  {detail.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-black tracking-tight">
                    {detail.user.name}
                    <Badge className={`px-2 py-0 text-[10px] font-bold ${LEAD_STATUS_META[detail.status]?.badge}`}>
                      {LEAD_STATUS_META[detail.status]?.label} lead
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs">
                    {detail.user.email}
                    {detail.user.phoneNumber ? ` · ${detail.user.phoneNumber}` : ''}
                    {detail.user.course ? ` · ${detail.user.course}` : ''}
                  </DialogDescription>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Joined {formatDateTime(detail.user.createdAt)} · Last active {timeAgo(detail.lastSeenAt)}
                    {detail.presence?.currentTitle ? ` · Viewing: ${detail.presence.currentTitle}` : ''}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Engagement stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Events (30d)', value: detail.stats.events30 },
                { label: 'Papers (30d)', value: detail.stats.paperViews30 },
                { label: 'Downloads (30d)', value: detail.stats.downloads30 },
                { label: 'Active days (30d)', value: detail.stats.activeDays30 },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-center">
                  <p className="text-lg font-black leading-none text-slate-900">{s.value}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> Papers they explored
                </p>
                <div className="space-y-1">
                  {detail.topPapers.slice(0, 6).map((p) => (
                    <div key={p.entityId} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                        {p.title || p.subjectName || 'Paper'}
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                        {p.views} views · {p.downloads} dl
                      </span>
                    </div>
                  ))}
                  {detail.topPapers.length === 0 && (
                    <p className="text-[11px] text-slate-400">No paper activity yet.</p>
                  )}
                </div>
              </div>

              {detail.topDepartments.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-slate-400">Interested in</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.topDepartments.map((d) => (
                      <Badge key={d.name} variant="outline" className="text-[11px] font-semibold text-slate-600">
                        {d.name} · {d.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-slate-400">Recent activity</p>
                <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-xl border border-slate-100 p-1">
                  {detail.recent.map((ev) => {
                    const meta = EVENT_META[ev.type] ?? EVENT_META.page_view;
                    return (
                      <div key={ev._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-600">
                          {eventDescription(ev)}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(ev.createdAt)}</span>
                      </div>
                    );
                  })}
                  {detail.recent.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-slate-400">Nothing recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'engaged', label: 'Most engaged' },
  { value: 'recent', label: 'Recently active' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'dormant', label: 'Longest inactive' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function MarketingPage() {
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('engaged');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const limit = 25;

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await marketingApi.leads({ page, limit, status, sort, search: search || undefined });
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
        setTotal(res.meta?.total ?? res.data.length);
        setCounts(res.meta?.counts ?? {});
      }
      setError(null);
    } catch {
      setError('Could not load leads.');
    }
  }, [page, status, sort, search]);

  useEffect(() => {
    setLoading(true);
    fetchLeads().finally(() => setLoading(false));
  }, [fetchLeads]);

  useEffect(() => {
    marketingApi
      .overview()
      .then((res) => {
        if (res.success && res.data) setOverview(res.data);
      })
      .catch(() => {});
  }, []);

  const openLead = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const pages = Math.max(1, Math.ceil(total / limit));

  const signupChart = (overview?.signupSeries ?? []).map((p) => ({
    label: p.date,
    value: p.count,
  }));
  const weeklyChart = (overview?.signupWeeklySeries ?? []).map((p) => ({
    label: p.week,
    value: p.count,
  }));
  const dauChart = (overview?.dauSeries ?? []).map((p) => ({ label: p.date, value: p.count }));

  const dayLabel = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <Megaphone className="h-6 w-6 text-indigo-600" />
            Marketing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Growth, engagement and every lead — who signed up, how active they are, and what they care about.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await marketingApi.exportCsv({ search, status, sort });
              setError(null);
            } catch {
              setError('Could not export leads. Please try again.');
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {exporting ? 'Exporting…' : 'Export leads CSV'}
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total Students" value={overview?.totalStudents} tint="bg-indigo-100 text-indigo-600" sub={`${overview?.activated ?? '—'} opened a paper`} />
        <StatCard icon={Radio} label="Online Now" value={overview?.onlineNow} tint="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Flame} label="Active Today" value={overview?.activeToday} tint="bg-sky-100 text-sky-600" sub={`${overview?.activeWeek ?? '—'} this week`} />
        <StatCard
          icon={UserPlus}
          label="New Signups"
          value={overview?.new24h}
          tint="bg-amber-100 text-amber-600"
          sub={`24 hrs · ${overview?.newWeek ?? '—'} in 7d · ${overview?.newMonth ?? '—'} in 30d`}
        />
        <StatCard icon={TrendingUp} label="Activation Rate" value={overview ? `${overview.activationRate}%` : undefined} tint="bg-violet-100 text-violet-600" sub="opened ≥1 paper" />
        <StatCard icon={Snowflake} label="Dormant" value={overview?.dormant} tint="bg-slate-100 text-slate-500" sub="inactive 30+ days" />
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black tracking-tight text-slate-800">New signups · last 30 days</h2>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-500">
              {overview?.newMonth ?? '—'} in 30 days
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black tracking-tight text-slate-800">Weekly joins · 8 weeks</h2>
          </div>
          {overview === null ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <MiniBarChart data={weeklyChart} height={72} barClass="fill-emerald-500" />
          )}
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            <span>{weeklyChart[0]?.label ?? ''}</span>
            <span>{weeklyChart[weeklyChart.length - 1]?.label ?? ''}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* DAU chart + interests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-black tracking-tight text-slate-800">Daily active users · 30 days</h2>
          {overview === null ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <MiniBarChart data={dauChart} height={64} barClass="fill-sky-500" formatLabel={dayLabel} />
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            {overview?.activeMonth ?? '—'} distinct students active this month.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black tracking-tight text-slate-800">
            <Sparkles className="h-4 w-4 text-violet-500" /> Top interests · 30d
          </h2>
          <div className="space-y-1.5">
            {(overview?.topDepartments ?? []).slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{d.name}</span>
                <span className="shrink-0 text-[10px] font-bold text-slate-400">{d.count} views · {d.users} users</span>
              </div>
            ))}
            {(overview?.topDepartments ?? []).length === 0 && (
              <p className="py-4 text-center text-[11px] text-slate-400">No paper views recorded yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black tracking-tight text-slate-800">
            <Search className="h-4 w-4 text-sky-500" /> What they search · 30d
          </h2>
          <div className="space-y-1.5">
            {(overview?.topSearches ?? []).slice(0, 5).map((s) => (
              <div key={s.query} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">“{s.query}”</span>
                <span className="shrink-0 text-[10px] font-bold text-slate-400">{s.count}×</span>
              </div>
            ))}
            {(overview?.topSearches ?? []).length === 0 && (
              <p className="py-4 text-center text-[11px] text-slate-400">No searches recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Acquisition */}
      {(overview?.topReferrers ?? []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black tracking-tight text-slate-800">
            <Globe className="h-4 w-4 text-emerald-500" /> Where visitors come from · 30d
          </h2>
          <div className="flex flex-wrap gap-2">
            {(overview?.topReferrers ?? []).map((r) => (
              <Badge key={r.domain} variant="outline" className="gap-1.5 border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {r.domain}
                <span className="text-[10px] font-bold text-slate-400">{r.count} visits · {r.users} users</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Leads table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-800">Leads</h2>
            <p className="text-xs text-slate-400">{total} students · click a row for the full engagement profile</p>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <div className="relative sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, phone or course"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all ?? '—'})</SelectItem>
                <SelectItem value="hot">Hot ({counts.hot ?? 0})</SelectItem>
                <SelectItem value="warm">Warm ({counts.warm ?? 0})</SelectItem>
                <SelectItem value="cold">Cold ({counts.cold ?? 0})</SelectItem>
                <SelectItem value="new">New ({counts.new ?? 0})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {leads.map((l) => (
              <button
                key={l.id || l._id}
                onClick={() => openLead(l.id || l._id || '')}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
              >
                <div className="relative shrink-0">
                  <ViewableAvatar src={l.picture} name={l.name} className="h-9 w-9" plain />
                  {l.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-[2]">
                  <p className="truncate text-xs font-bold text-slate-800">{l.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{l.email}</p>
                </div>
                <div className="hidden min-w-0 flex-1 md:block">
                  <p className="truncate text-xs text-slate-600">{l.course || '—'}</p>
                  {l.phoneNumber && <p className="truncate text-[11px] text-slate-400">{l.phoneNumber}</p>}
                </div>
                <div className="shrink-0">
                  <Badge className={`px-2 py-0.5 text-[10px] font-bold ${LEAD_STATUS_META[l.status]?.badge}`}>
                    {LEAD_STATUS_META[l.status]?.label}
                  </Badge>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs font-black text-slate-800">{l.events30}</p>
                  <p className="text-[10px] text-slate-400">events 30d</p>
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  <p className="text-xs font-black text-slate-800">{l.paperViews30}</p>
                  <p className="text-[10px] text-slate-400">papers</p>
                </div>
                <div className="hidden w-24 shrink-0 text-right lg:block">
                  <p className="text-[11px] font-semibold text-slate-600">{timeAgo(l.lastSeenAt)}</p>
                  {l.device && <p className="truncate text-[10px] text-slate-400">{deviceLabel(l.device)}</p>}
                </div>
              </button>
            ))}
            {leads.length === 0 && !error && (
              <p className="py-10 text-center text-xs text-slate-400">No leads match these filters.</p>
            )}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400">Page {page} of {pages}</p>
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

      <LeadDetailDialog leadId={detailId} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
