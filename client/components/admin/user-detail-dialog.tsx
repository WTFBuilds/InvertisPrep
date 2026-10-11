'use client';

import { useEffect, useState } from 'react';
import { adminUserApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BUILTIN_ROLE_META, ROLE_COLORS, hasPermission } from '@/lib/permissions';
import type { AdminUserDetail } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog';
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  FileText,
  Flag,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';

interface UserDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion so the parent can refresh its list. */
  onDeleted?: (message: string) => void;
}

const badgeColorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  pink: 'bg-pink-100 text-pink-600',
  white: 'border border-slate-200 bg-white text-slate-600',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const roleBadge = (role: string, roleLabel?: string | null, roleColor?: string | null) => {
  if (role === 'staff') {
    const style = ROLE_COLORS[roleColor || 'violet'] || ROLE_COLORS.violet;
    return <Badge className={style.badge}>{roleLabel || 'Custom Role'}</Badge>;
  }
  const meta = BUILTIN_ROLE_META[role] || BUILTIN_ROLE_META.student;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
};

export function UserDetailDialog({ userId, open, onOpenChange, onDeleted }: UserDetailDialogProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const canViewActivity = hasPermission(currentUser, 'activity.view');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    adminUserApi
      .get(userId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setDetail(res.data);
        } else {
          setError(res.message || 'Failed to load user details');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load user details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Full profile, activity, and account stats.</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-xl" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-sm text-slate-500">{error}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {!loading && detail && (
          <div className="space-y-6">
            {/* Profile header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <ViewableAvatar
                  src={detail.user.picture}
                  name={detail.user.name}
                  className="h-14 w-14"
                  fallbackClassName="bg-indigo-100 text-lg font-bold text-indigo-700"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-black text-slate-900">{detail.user.name}</span>
                    {roleBadge(detail.user.role, detail.user.roleLabel, detail.user.roleColor)}
                  </div>
                  <p className="text-sm text-slate-500">{detail.user.email}</p>
                  <p className="text-xs text-slate-400">
                    Rank #{detail.user.rank} · {detail.user.studentId || 'No student ID'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Badge
                  className={
                    detail.user.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }
                >
                  {detail.user.isActive ? 'Active' : 'Banned'}
                </Badge>
                {canViewActivity && (
                  <a
                    href={`/admin/activity/u/${detail.user.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                    onClick={() => onOpenChange(false)}
                  >
                    <ActivityIcon className="h-3.5 w-3.5" />
                    Activity trail
                  </a>
                )}
                {isSuperAdmin &&
                  detail.user.id !== currentUser?.id &&
                  detail.user.role !== 'super-admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete user
                    </Button>
                  )}
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Points</p>
                <p className="text-xl font-black text-slate-900">{detail.user.points}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q-Coins</p>
                <p className="text-xl font-black text-indigo-600">{detail.user.qcoins}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Followers</p>
                <p className="text-xl font-black text-slate-900">{detail.user.followers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Following</p>
                <p className="text-xl font-black text-slate-900">{detail.user.following}</p>
              </div>
            </div>

            {/* Profile info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-slate-200 p-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course</p>
                <p className="mt-0.5 font-medium text-slate-700">{detail.user.course || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                <p className="mt-0.5 font-medium text-slate-700">{detail.user.phoneNumber || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Free Downloads</p>
                <p className="mt-0.5 font-medium text-slate-700">{detail.user.freeDownloadsLeft}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-700">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(detail.user.joinedAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Login</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatDateTime(detail.user.lastLogin)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contributions</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {detail.stats.totalUploads} uploads
                </p>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Badges
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {detail.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      badge.completed
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-dashed border-slate-200 bg-white opacity-70'
                    }`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">{badge.name}</p>
                        <Badge
                          className={
                            badge.completed
                              ? badgeColorMap[badge.color] || 'bg-slate-100 text-slate-700'
                              : 'border border-slate-200 bg-white text-slate-500'
                          }
                        >
                          {badge.completed ? 'Earned' : `${badge.current}/${badge.target}`}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{badge.description}</p>
                      {!badge.completed && (
                        <Progress
                          className="mt-2 h-1.5"
                          value={Math.min(100, Math.round((badge.current / badge.target) * 100))}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contribution stats */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserRound className="h-4 w-4 text-indigo-600" /> Contribution & Reports
              </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{detail.stats.verifiedUploads}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verified Papers
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{detail.stats.syllabusUploads}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Syllabus Uploads
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{detail.stats.reportsFiled}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Reports Filed
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{detail.stats.reportsPending}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    Pending
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{detail.stats.bugsFiled}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bugs Filed
                  </p>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="mb-3 text-sm font-bold text-slate-900">Recent Transactions</h4>
                {detail.transactions.length === 0 ? (
                  <p className="text-xs text-slate-400">No transactions yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {detail.transactions.map((t) => (
                      <li key={t.id} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            t.coins >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}
                        >
                          {t.coins >= 0 ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {t.description || t.category}
                            </p>
                            <p className="text-xs font-bold text-slate-900">
                              {t.coins >= 0 ? '+' : ''}
                              {t.coins} 🪙
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400">{formatDateTime(t.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Flag className="h-4 w-4 text-indigo-600" /> Recent Activity
                </h4>
                {detail.activity.length === 0 ? (
                  <p className="text-xs text-slate-400">No recent activity.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {detail.activity.map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-700">{a.description}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatDateTime(a.createdAt)}
                            {a.points ? ` · +${a.points} pts` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Nested deletion confirmation — closes the detail view on success */}
      <DeleteUserDialog
        user={
          detail
            ? { id: detail.user.id, name: detail.user.name, email: detail.user.email }
            : null
        }
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={(message) => {
          setDeleteOpen(false);
          onOpenChange(false);
          onDeleted?.(message);
        }}
      />
    </Dialog>
  );
}
