'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  Flag,
  Bug,
  LogIn,
  LogOut,
  Search,
  UserPlus,
  UserCog,
  FileSignature,
  type LucideIcon,
} from 'lucide-react';

import type { ActivityType, ActivityUserRow, DeviceInfo } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';

export const EVENT_META: Record<ActivityType, { label: string; icon: LucideIcon; chip: string; dot: string }> = {
  page_view: { label: 'Page view', icon: Eye, chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  paper_view: { label: 'Paper viewed', icon: FileText, chip: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  paper_download: { label: 'Download', icon: Download, chip: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  search: { label: 'Search', icon: Search, chip: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  login: { label: 'Signed in', icon: LogIn, chip: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  logout: { label: 'Signed out', icon: LogOut, chip: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  signup: { label: 'Signed up', icon: UserPlus, chip: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  request_create: { label: 'Paper request', icon: Flag, chip: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  report_create: { label: 'Reported paper', icon: Flag, chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  bug_report: { label: 'Bug report', icon: Bug, chip: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  resume_create: { label: 'Resume', icon: FileSignature, chip: 'bg-fuchsia-100 text-fuchsia-700', dot: 'bg-fuchsia-500' },
  profile_update: { label: 'Profile updated', icon: UserCog, chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

export const ACTIVITY_TYPE_OPTIONS = (Object.keys(EVENT_META) as ActivityType[]).map((key) => ({
  value: key,
  label: EVENT_META[key].label,
}));

// Human names for the app routes shown in the monitor.
export function pathLabel(path: string): string {
  if (!path) return '';
  const map: [string, string][] = [
    ['/admin/dashboard', 'Admin dashboard'],
    ['/admin/activity', 'Activity monitor'],
    ['/admin/users', 'Admin · Users'],
    ['/admin/papers', 'Admin · Papers'],
    ['/admin/requests', 'Admin · Requests'],
    ['/admin/mail', 'Admin · Mail'],
    ['/admin/marketing', 'Marketing console'],
    ['/pyq', 'PYQ papers'],
    ['/quizz0', 'Quiz arena'],
    ['/leaderboard', 'Leaderboard'],
    ['/resume-builder', 'Resume builder'],
    ['/resumes', 'Resumes'],
    ['/ats-score', 'ATS score'],
    ['/wallet', 'Wallet'],
    ['/profile', 'Profile'],
    ['/events', 'Events'],
    ['/view/', 'Protected viewer'],
  ];
  for (const [prefix, label] of map) {
    if (path === prefix || path.startsWith(prefix)) return label;
  }
  return path;
}

export function eventDescription(ev: {
  type: ActivityType;
  title?: string;
  path?: string;
}): string {
  if (ev.type === 'page_view') return ev.path ? pathLabel(ev.path) : 'Browsing';
  return ev.title || EVENT_META[ev.type].label;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function deviceLabel(device?: DeviceInfo | null): string {
  if (!device || (!device.browser && !device.os)) return '';
  const parts = [device.browser, device.os].filter(Boolean);
  const kind = device.type === 'mobile' ? ' · Mobile' : device.type === 'tablet' ? ' · Tablet' : '';
  return `${parts.join(' on ')}${kind}`;
}

export function durationLabel(startIso: string, endIso: string): string {
  const mins = Math.max(1, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

// ── Lead status styling ──────────────────────────────────────────────────────
export const LEAD_STATUS_META: Record<string, { label: string; badge: string; hint: string }> = {
  hot: { label: 'Hot', badge: 'bg-emerald-100 text-emerald-700', hint: 'Active in the last 3 days' },
  warm: { label: 'Warm', badge: 'bg-amber-100 text-amber-700', hint: 'Active in the last 14 days' },
  cold: { label: 'Cold', badge: 'bg-slate-100 text-slate-500', hint: 'Inactive for 14+ days' },
  new: { label: 'New', badge: 'bg-sky-100 text-sky-700', hint: 'Joined in the last 7 days' },
};

// ── Interactive SVG bar chart (no chart dependency) ─────────────────────────
// Hover shows an exact tooltip, and every bar can be clicked (onBarClick) to
// drill into the real data behind it. X-axis ticks are HTML so they never
// distort; gridlines keep their 1px stroke via vector-effect.
export function InteractiveBarChart({
  data,
  height = 96,
  barClass = 'fill-indigo-500',
  hoverBarClass = 'fill-indigo-700',
  formatLabel,
  formatTooltip,
  onBarClick,
}: {
  data: { label: string; value: number; sub?: string }[];
  height?: number;
  barClass?: string;
  hoverBarClass?: string;
  formatLabel?: (label: string) => string;
  formatTooltip?: (item: { label: string; value: number; sub?: string }) => string;
  onBarClick?: (item: { label: string; value: number; sub?: string }) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  const barArea = height - 16;
  const showLabel = (label: string) => (formatLabel ? formatLabel(label) : label);
  // ~4 evenly spread x ticks
  const ticks = data.length > 6 ? [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1] : [0, data.length - 1];

  return (
    <div className="relative">
      {/* Y gridlines with value labels */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {[1, 0.5].map((f) => (
          <div key={f} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${height - barArea * f}px` }}>
            <span className="absolute -top-2 right-0 rounded bg-white/85 px-1 text-[9px] font-bold text-slate-300">
              {Math.round(max * f)}
            </span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / max) * barArea);
          const isHover = hover === i;
          return (
            <rect
              key={d.label}
              x={i * w + w * 0.15}
              y={height - barH}
              width={w * 0.7}
              height={barH}
              rx={0.6}
              className={
                d.value === 0
                  ? 'fill-slate-200'
                  : isHover
                    ? hoverBarClass
                    : barClass
              }
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onBarClick?.(d)}
              onKeyDown={(e) => {
                if (onBarClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onBarClick(d);
                }
              }}
              tabIndex={onBarClick ? 0 : -1}
              role={onBarClick ? 'button' : undefined}
              aria-label={formatTooltip ? formatTooltip(d) : `${showLabel(d.label)}: ${d.value}`}
            />
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-md"
          style={{ left: `${Math.min(90, Math.max(10, ((hover + 0.5) / data.length) * 100))}%`, bottom: '100%', marginBottom: 4 }}
        >
          <p className="whitespace-nowrap text-[10px] font-bold text-slate-500">
            {formatTooltip ? formatTooltip(data[hover]) : showLabel(data[hover].label)}
          </p>
          <p className="whitespace-nowrap text-sm font-black leading-tight text-slate-900">{data[hover].value}</p>
        </div>
      )}

      {/* X-axis ticks */}
      <div className="mt-1 flex justify-between text-[9px] font-semibold text-slate-400">
        {ticks.map((t) => (
          <span key={t}>{showLabel(data[t].label)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Chart drill-down dialog ──────────────────────────────────────────────────
export function UsersRangeDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  load,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  load: () => Promise<ActivityUserRow[]>;
}) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [rows, setRows] = useState<ActivityUserRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows(null);
    loadRef
      .current()
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this list. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left text-base font-black tracking-tight text-slate-900">{title}</DialogTitle>
          {subtitle && <DialogDescription className="text-xs">{subtitle}</DialogDescription>}
        </DialogHeader>

        {loading && (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && <p className="py-6 text-center text-xs text-slate-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-1">
            {rows?.map((u) => (
              <div key={u._id || u.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                <ViewableAvatar
                  src={u.picture}
                  name={u.name}
                  className="h-8 w-8"
                  fallbackClassName="bg-indigo-100 text-indigo-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{[u.email, u.course].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="shrink-0 text-right">
                  {typeof u.eventCount === 'number' && (
                    <p className="text-[11px] font-black text-slate-700">{u.eventCount} events</p>
                  )}
                  {u.createdAt && (
                    <p className="text-[10px] text-slate-400">
                      {new Date(u.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {rows && rows.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">No users in this period.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Range helpers for chart drill-downs (IST-aligned, matches the server) ───

/** [from, to) ISO bounds of one IST day, from a 'YYYY-MM-DD' chart label. */
export function istDayBounds(dateKey: string): { from: string; to: string } {
  const from = new Date(`${dateKey}T00:00:00+05:30`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** [from, to) ISO bounds of an ISO week ('2026-W41'), IST-aligned. */
export function isoWeekBounds(weekKey: string): { from: string; to: string } {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(weekKey);
  if (!m) return { from: new Date(0).toISOString(), to: new Date(0).toISOString() };
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  // ISO week 1 always contains Jan 4; its Monday anchors the grid.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  const from = new Date(monday.getTime() - 5.5 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}
