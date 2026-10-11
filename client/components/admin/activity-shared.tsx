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

/** Axis/tooltip label for a series point — hour keys render "2 PM", days "5 Oct". */
export function chartTickLabel(key: string): string {
  if (key.includes('T')) {
    const h = parseInt(key.slice(11, 13), 10);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  return new Date(`${key}T12:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

/** [from, to) ISO bounds of a series point — one hour for '24h' keys, else a day. */
export function pointBounds(key: string): { from: string; to: string } {
  if (key.includes('T')) {
    const from = new Date(`${key}+05:30`);
    return { from: from.toISOString(), to: new Date(from.getTime() + 60 * 60 * 1000).toISOString() };
  }
  return istDayBounds(key);
}
