'use client';

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

import type { ActivityType, DeviceInfo } from '@/types';

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

// ── Tiny SVG bar chart (no chart dependency) ────────────────────────────────
export function MiniBarChart({
  data,
  height = 64,
  barClass = 'fill-indigo-500',
  formatLabel,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barClass?: string;
  formatLabel?: (label: string) => string;
}) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - 12));
        return (
          <g key={d.label}>
            <rect
              x={i * w + w * 0.15}
              y={height - h}
              width={w * 0.7}
              height={h}
              rx={1}
              className={d.value > 0 ? barClass : 'fill-slate-200'}
            >
              <title>{`${formatLabel ? formatLabel(d.label) : d.label}: ${d.value}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
