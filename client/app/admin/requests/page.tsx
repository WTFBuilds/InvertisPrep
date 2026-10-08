'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { paperRequestApi } from '@/lib/api';
import type { PaperRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileQuestion,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PaperRequestDetailDialog } from '@/components/admin/paper-request-detail-dialog';
import { Eye } from 'lucide-react';

const statusBadge = (status: PaperRequest['status']) => {
  switch (status) {
    case 'fulfilled':
      return <Badge className="bg-emerald-100 text-emerald-700">Fulfilled</Badge>;
    case 'rejected':
      return <Badge className="bg-rose-100 text-rose-700">Rejected</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDepartmentName = (r: PaperRequest) =>
  typeof r.departmentId === 'string' ? '—' : r.departmentId.displayName || r.departmentId.name;

const getBranchName = (r: PaperRequest) =>
  typeof r.branchId === 'string' ? '—' : r.branchId.name;

const getRequester = (r: PaperRequest) => {
  if (!r.requestedBy || typeof r.requestedBy === 'string') {
    return { name: 'Unknown', email: '', picture: undefined as string | undefined };
  }
  return { name: r.requestedBy.name, email: r.requestedBy.email, picture: r.requestedBy.picture };
};

export default function PaperRequestsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  // SRT can review (read) but not triage or delete.
  const canModify = hasPermission(user, 'requests.manage');

  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled' | 'rejected'>(
    'pending'
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paperRequestApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      });
      if (res.success) {
        setRequests(res.data || []);
      } else {
        setError(res.message || 'Failed to load requests');
      }
    } catch (err: unknown) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests]
  );

  // The dialog reads from `requests` so status updates reflect live.
  const viewRequest = useMemo(
    () => requests.find((r) => r._id === viewId) ?? null,
    [requests, viewId]
  );

  const handleStatusChange = async (id: string, status: 'fulfilled' | 'rejected' | 'pending') => {
    setError('');
    setSuccess('');
    setActingId(id);
    try {
      const res = await paperRequestApi.updateStatus(id, status);
      if (res.success) {
        setSuccess(res.message || 'Request updated');
        setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      } else {
        setError(res.message || 'Failed to update request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update request');
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this paper request? This cannot be undone.')) return;
    setError('');
    setSuccess('');
    setActingId(id);
    try {
      const res = await paperRequestApi.remove(id);
      if (res.success) {
        setSuccess('Request deleted');
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } else {
        setError(res.message || 'Failed to delete request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete request');
    } finally {
      setActingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Paper Requests</h1>
          <p className="text-sm text-slate-500">
            Papers students asked for — {pendingCount} pending in the current view.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {!canModify && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            You have read-only access. Only admins can mark or delete requests.
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject name or code..."
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as 'all' | 'pending' | 'fulfilled' | 'rejected')
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All requests</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests list — full info per card, no horizontal scrolling */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/70">
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <FileQuestion className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No requests found</p>
              <p className="text-xs text-slate-400">
                Student paper requests will show up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const requester = getRequester(r);
              const busy = actingId === r._id;
              return (
                <Card
                  key={r._id}
                  className="border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left — paper summary (full details live in the View dialog) */}
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          {requester.picture && (
                            <AvatarImage src={requester.picture} alt={requester.name} />
                          )}
                          <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">
                            {requester.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {r.subjectName}
                            </p>
                            {r.subjectCode && (
                              <span className="text-xs font-medium text-slate-400">
                                {r.subjectCode}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {getDepartmentName(r)} › {getBranchName(r)} ·{' '}
                            {r.examType === 'any' ? 'Any exam' : r.examType.replace('-', ' ')}
                            {r.year ? ` · ${r.year}` : ''}
                          </p>
                          <p
                            className="mt-0.5 truncate text-xs text-slate-400"
                            title={r.note ? r.note : undefined}
                          >
                            <span className="font-medium text-slate-600">{requester.name}</span>
                            {requester.email && ` · ${requester.email}`}
                            {r.note ? ` — ${r.note}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right — status, date, actions */}
                      <div className="flex shrink-0 flex-row items-center justify-between gap-2.5 lg:w-64 lg:flex-col lg:items-end">
                        <div className="flex items-center gap-2">
                          {statusBadge(r.status)}
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs font-semibold"
                            onClick={() => {
                              setViewId(r._id);
                              setViewOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {canModify && (
                            <>
                              {r.status !== 'fulfilled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                className="h-8 gap-1.5 border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleStatusChange(r._id, 'fulfilled')}
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Fulfilled
                              </Button>
                            )}
                            {r.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                className="h-8 gap-1.5 border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                onClick={() => handleStatusChange(r._id, 'rejected')}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            )}
                                {isSuperAdmin && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={busy}
                                    aria-label="Delete request"
                                    className="h-8 w-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() => handleDelete(r._id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Full request detail dialog */}
        <PaperRequestDetailDialog
          request={viewRequest}
          open={viewOpen}
          onOpenChange={setViewOpen}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          actingId={actingId}
        />
      </div>
    </ProtectedRoute>
  );
}
