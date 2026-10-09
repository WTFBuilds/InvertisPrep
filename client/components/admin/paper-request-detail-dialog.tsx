'use client';

import { paperRequestApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import type { PaperRequest } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle2, Loader2, Trash2, XCircle } from 'lucide-react';

interface PaperRequestDetailDialogProps {
  request: PaperRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Page-level handlers — the dialog only renders state, the page owns it. */
  onStatusChange: (id: string, status: 'fulfilled' | 'rejected' | 'pending') => void;
  onDelete: (id: string) => void;
  actingId: string | null;
}

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
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

const getReviewerName = (r: PaperRequest) => {
  if (!r.reviewedBy || typeof r.reviewedBy === 'string') return null;
  return r.reviewedBy.name;
};

export function PaperRequestDetailDialog({
  request,
  open,
  onOpenChange,
  onStatusChange,
  onDelete,
  actingId,
}: PaperRequestDetailDialogProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  // Triage is permission-gated — SRT holds requests.view only, while a custom
  // role may or may not have been granted requests.manage.
  const canModify = hasPermission(user, 'requests.manage');

  if (!request) return null;

  const requester = getRequester(request);
  const busy = actingId === request._id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paper Request</DialogTitle>
          <DialogDescription>
            Full details of what <span className="font-semibold text-slate-700">{requester.name}</span>{' '}
            is looking for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Requester */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Avatar className="h-11 w-11">
              {requester.picture && (
                <AvatarImage src={requester.picture} alt={requester.name} />
              )}
              <AvatarFallback className="bg-indigo-100 text-sm font-bold text-indigo-700">
                {requester.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">{requester.name}</p>
              <p className="truncate text-sm text-slate-500">{requester.email}</p>
            </div>
            <div className="ml-auto shrink-0">{statusBadge(request.status)}</div>
          </div>

          {/* Request details */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl border border-slate-200 p-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</p>
              <p className="mt-0.5 font-semibold text-slate-800">{request.subjectName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Code</p>
              <p className="mt-0.5 font-medium text-slate-700">{request.subjectCode || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
              <p className="mt-0.5 font-medium text-slate-700">{getDepartmentName(request)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch</p>
              <p className="mt-0.5 font-medium text-slate-700">{getBranchName(request)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exam Type</p>
              <p className="mt-0.5 font-medium capitalize text-slate-700">
                {request.examType === 'any' ? 'Any exam' : request.examType.replace('-', ' ')}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Year</p>
              <p className="mt-0.5 font-medium text-slate-700">{request.year || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requested on</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-700">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(request.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reviewed by</p>
              <p className="mt-0.5 font-medium text-slate-700">
                {getReviewerName(request) || '—'}
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Student's note
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {request.note || 'No additional details provided.'}
            </p>
          </div>

          {/* Actions */}
          {canModify && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
              {request.status !== 'fulfilled' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="gap-1.5 border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onStatusChange(request._id, 'fulfilled')}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Mark fulfilled
                </Button>
              )}
              {request.status !== 'rejected' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="gap-1.5 border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  onClick={() => onStatusChange(request._id, 'rejected')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              )}
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="gap-1.5 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    onDelete(request._id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
