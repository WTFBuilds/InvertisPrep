'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bug,
  FileQuestion,
  Flag,
  MessageCircle,
} from 'lucide-react';

import { bugApi, paperRequestApi, reportApi, supportApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketThread } from '@/components/admin/ticket-thread';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { PaperRequest, Report, SupportMessage } from '@/types';

interface BugTicket {
  _id: string;
  title: string;
  description: string;
  severity: string;
  status: 'pending' | 'active' | 'resolved' | 'dismissed';
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ReportTicket extends Omit<Report, 'reportedBy' | 'paperId'> {
  paperId: string | { _id?: string; subjectName?: string; subjectCode?: string; year?: number };
  messages?: SupportMessage[];
}

const REQUEST_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700' },
  fulfilled: { label: 'Fulfilled', badge: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', badge: 'bg-rose-100 text-rose-700' },
};

const BUG_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700' },
  active: { label: 'Active', badge: 'bg-sky-100 text-sky-700' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700' },
  dismissed: { label: 'Dismissed', badge: 'bg-slate-100 text-slate-500' },
};

const REPORT_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700' },
  dismissed: { label: 'Dismissed', badge: 'bg-slate-100 text-slate-500' },
};

const REASON_LABELS: Record<string, string> = {
  wrong_file: 'Wrong file',
  poor_quality: 'Poor quality',
  wrong_metadata: 'Wrong metadata',
  other: 'Other',
};

const isStaffRole = (role?: string) =>
  role === 'admin' || role === 'super-admin' || role === 'srt' || role === 'staff';

type TicketKind = 'paper' | 'bug' | 'report';

// One ticket card: header (type + status), description, thread, reply.
function TicketCard({
  title,
  description,
  statusText,
  statusBadge,
  typeIcon,
  typeLabel,
  ticketId,
  messages,
  kind,
  onReply,
}: {
  title: string;
  description: string;
  statusText: string;
  statusBadge: string;
  typeIcon: React.ReactNode;
  typeLabel: string;
  ticketId: string;
  messages: SupportMessage[];
  kind: TicketKind;
  onReply: (id: string, body: string) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {typeIcon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{title}</p>
            <p className="text-[11px] text-slate-400">{typeLabel}</p>
          </div>
        </div>
        <Badge className={statusBadge}>{statusText}</Badge>
      </div>

      <div className="px-4 py-3 text-sm text-slate-600">{description}</div>

      <TicketThread
        messages={messages}
        canReply
        onReply={async (body) => onReply(ticketId, body)}
        requesterName="You"
      />
    </div>
  );
}

export default function MyRequestsPage() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<PaperRequest[]>([]);
  const [bugs, setBugs] = useState<BugTicket[]>([]);
  const [reports, setReports] = useState<ReportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const refresh = async () => {
    const [r, b, rep] = await Promise.all([
      paperRequestApi.mine().catch(() => null),
      bugApi.mine().catch(() => null),
      reportApi.mine().catch(() => null),
    ]);
    if (r?.success && Array.isArray(r.data)) setRequests(r.data);
    if (b?.success && Array.isArray(b.data)) setBugs(b.data as BugTicket[]);
    if (rep?.success && Array.isArray(rep.data)) setReports(rep.data as ReportTicket[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    supportApi.unreadCount().then(setUnread).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replyToRequest = async (id: string, body: string) => {
    const res = await paperRequestApi.reply(id, body);
    if (res.success && res.data) {
      const updated = res.data;
      setRequests((prev) => prev.map((r) => (r._id === id ? updated : r)));
      supportApi.unreadCount().then(setUnread).catch(() => {});
    }
  };
  const replyToBug = async (id: string, body: string) => {
    const res = await bugApi.reply(id, body);
    if (res.success && res.data) {
      const updated = res.data as BugTicket;
      setBugs((prev) => prev.map((b) => (b._id === id ? updated : b)));
      supportApi.unreadCount().then(setUnread).catch(() => {});
    }
  };
  const replyToReport = async (id: string, body: string) => {
    const res = await reportApi.reply(id, body);
    if (res.success && res.data) {
      const updated = res.data as unknown as ReportTicket;
      setReports((prev) => prev.map((rep) => ((rep._id as string) === id ? updated : rep)));
      supportApi.unreadCount().then(setUnread).catch(() => {});
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">My Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paper requests, issues you reported and support tickets — track replies here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <Badge className="gap-1.5 bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-3 w-3" />
              {unread} new repl{unread === 1 ? 'y' : 'ies'}
            </Badge>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/pyq">
              <ArrowLeft className="h-3.5 w-3.5" /> Browse papers
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 && bugs.length === 0 && reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <FileQuestion className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No requests yet</p>
          <p className="max-w-sm text-xs text-slate-400">
            Can&apos;t find a paper? Request it and our team will upload it — and you can track it here.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/pyq">Request a paper</Link>
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="text-xs font-bold">
              All ({requests.length + bugs.length + reports.length})
            </TabsTrigger>
            <TabsTrigger value="papers" className="text-xs font-bold">
              Paper requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="bugs" className="text-xs font-bold">
              Bug reports ({bugs.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs font-bold">
              Paper issues ({reports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {[
              ...requests.map((r) => ({ kind: 'paper' as TicketKind, item: r, updated: r.updatedAt, thunk: replyToRequest, title: `${r.subjectName}${r.subjectCode ? ` (${r.subjectCode})` : ''}`, desc: r.note || `Looking for ${r.year || ''} ${r.examType} paper.`, status: REQUEST_STATUS[r.status] ?? { label: r.status, badge: '' }, icon: <FileQuestion className="h-4 w-4" />, label: 'Paper request', msgs: r.messages ?? [] })),
              ...bugs.map((b) => ({ kind: 'bug' as TicketKind, item: b, updated: b.updatedAt, thunk: replyToBug, title: b.title, desc: b.description, status: BUG_STATUS[b.status] ?? { label: b.status, badge: '' }, icon: <Bug className="h-4 w-4" />, label: 'Bug report', msgs: b.messages ?? [] })),
              ...reports.map((rep) => ({ kind: 'report' as TicketKind, item: rep, updated: rep.updatedAt, thunk: replyToReport, title: typeof rep.paperId === 'string' ? 'Paper issue' : rep.paperId?.subjectName || 'Paper issue', desc: REASON_LABELS[rep.reason] || rep.reason, status: REPORT_STATUS[rep.status] ?? { label: rep.status, badge: '' }, icon: <Flag className="h-4 w-4" />, label: `Reported issue · ${REASON_LABELS[rep.reason] || rep.reason}`, msgs: rep.messages ?? [] })),
            ]
              .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
              .map((t) => (
                <TicketCard
                  key={`${t.kind}-${(t.item as { _id: string })._id}`}
                  title={t.title}
                  description={t.desc}
                  statusText={t.status.label}
                  statusBadge={t.status.badge}
                  typeIcon={t.icon}
                  typeLabel={t.label}
                  ticketId={(t.item as { _id: string })._id}
                  messages={t.msgs}
                  kind={t.kind}
                  onReply={t.thunk}
                />
              ))}
            {requests.length + bugs.length + reports.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Nothing here yet.</p>
            )}
          </TabsContent>

          <TabsContent value="papers" className="space-y-3">
            {requests.map((r) => (
              <TicketCard
                key={r._id}
                title={`${r.subjectName}${r.subjectCode ? ` (${r.subjectCode})` : ''}`}
                description={r.note || `Looking for ${r.year || ''} ${r.examType} paper.`}
                statusText={REQUEST_STATUS[r.status]?.label ?? r.status}
                statusBadge={REQUEST_STATUS[r.status]?.badge ?? 'bg-slate-100 text-slate-500'}
                typeIcon={<FileQuestion className="h-4 w-4" />}
                typeLabel="Paper request"
                ticketId={r._id}
                messages={r.messages ?? []}
                kind="paper"
                onReply={replyToRequest}
              />
            ))}
            {requests.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No paper requests yet.</p>}
          </TabsContent>

          <TabsContent value="bugs" className="space-y-3">
            {bugs.map((b) => (
              <TicketCard
                key={b._id}
                title={b.title}
                description={b.description}
                statusText={BUG_STATUS[b.status]?.label ?? b.status}
                statusBadge={BUG_STATUS[b.status]?.badge ?? 'bg-slate-100 text-slate-500'}
                typeIcon={<Bug className="h-4 w-4" />}
                typeLabel="Bug report"
                ticketId={b._id}
                messages={b.messages ?? []}
                kind="bug"
                onReply={replyToBug}
              />
            ))}
            {bugs.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No bug reports yet.</p>}
          </TabsContent>

          <TabsContent value="reports" className="space-y-3">
            {reports.map((rep) => (
              <TicketCard
                key={rep._id as string}
                title={typeof rep.paperId === 'string' ? 'Paper issue' : rep.paperId?.subjectName || 'Paper issue'}
                description={REASON_LABELS[rep.reason] || rep.reason}
                statusText={REPORT_STATUS[rep.status]?.label ?? rep.status}
                statusBadge={REPORT_STATUS[rep.status]?.badge ?? 'bg-slate-100 text-slate-500'}
                typeIcon={<Flag className="h-4 w-4" />}
                typeLabel={`Reported issue · ${REASON_LABELS[rep.reason] || rep.reason}`}
                ticketId={rep._id as string}
                messages={rep.messages ?? []}
                kind="report"
                onReply={replyToReport}
              />
            ))}
            {reports.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No paper issues yet.</p>}
          </TabsContent>
        </Tabs>
      )}

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">How it works</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Raise a paper request, report a paper issue or a bug from anywhere on the site. Our team
          replies on the thread — a dot appears on your profile menu when there&apos;s a new reply.
        </p>
      </div>
    </div>
  );
}