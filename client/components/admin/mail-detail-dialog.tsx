'use client';

import { useEffect, useState } from 'react';
import { adminMailApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

// Full reader for a single mail — used by Mailbox (received) and Logs
// (sent + received). Email HTML is untrusted, so it renders inside a
// sandboxed iframe (no scripts) with a plain-text fallback tab.

export interface MailDetailTarget {
  id: string;
  direction: 'sent' | 'received';
}

const formatDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export function MailDetailDialog({
  target,
  open,
  onOpenChange,
}: {
  target: MailDetailTarget | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'rendered' | 'text'>('rendered');
  const [mail, setMail] = useState<{
    subject: string;
    from: string;
    to: string;
    date: string;
    html: string;
    text: string;
    kind: string;
    status: string;
    errorMsg: string;
    user?: { name?: string; email?: string; picture?: string | null } | null;
  } | null>(null);

  useEffect(() => {
    if (!open || !target) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setMail(null);
    setTab('rendered');

    (async () => {
      try {
        if (target.direction === 'received') {
          const res = await adminMailApi.getInbound(target.id);
          const d = res.data as any;
          if (cancelled) return;
          setMail({
            subject: d?.subject || '(no subject)',
            from: d?.from || '',
            to: d?.to || '',
            date: d?.receivedAt || '',
            html: d?.html || '',
            text: d?.text || '',
            kind: d?.mailType === 'bounce' ? 'bounce' : 'inbound',
            status: d?.mailType === 'bounce' ? 'bounced' : 'synced',
            errorMsg: '',
            user: null,
          });
        } else {
          const res = await adminMailApi.getSent(target.id);
          const d = res.data as any;
          if (cancelled) return;
          setMail({
            subject: d?.subject || '(no subject)',
            from: d?.from || '',
            to: d?.to || '',
            date: d?.createdAt || '',
            html: d?.html || '',
            text: d?.preview || '',
            kind: d?.kind || 'other',
            status: d?.status || 'sent',
            errorMsg: d?.error || '',
            user: d?.user || null,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load mail');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, target]);

  const hasHtml = Boolean(mail?.html);
  const hasText = Boolean(mail?.text);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="pr-8 text-base font-bold text-slate-900">
            {mail?.subject || 'Mail'}
          </DialogTitle>
          {mail && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-700">From</span> {mail.from || '—'}
              </span>
              <span>
                <span className="font-semibold text-slate-700">To</span> {mail.to || '—'}
              </span>
              <span>{formatDate(mail.date)}</span>
              <Badge className={statusClass(mail.status)}>{mail.status}</Badge>
              <Badge variant="outline">{mail.kind}</Badge>
            </div>
          )}
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading mail…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          ) : mail ? (
            <>
              {(hasHtml || hasText) && (
                <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {hasHtml && (
                    <button
                      type="button"
                      onClick={() => setTab('rendered')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${tab === 'rendered' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      Rendered
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTab('text')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${tab === 'text' || !hasHtml ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Plain text
                  </button>
                </div>
              )}

              {hasHtml && tab === 'rendered' ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <iframe
                    title="Mail content"
                    sandbox=""
                    srcDoc={mail.html}
                    className="h-[520px] w-full"
                  />
                </div>
              ) : (
                <div className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {mail.text || '(no preview available)'}
                </div>
              )}

              {mail.errorMsg && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                  <span className="font-semibold">Send error:</span> {mail.errorMsg}
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const statusClass = (status: string) => {
  switch (status) {
    case 'sent':
    case 'synced':
      return 'bg-emerald-100 text-emerald-700';
    case 'failed':
      return 'bg-rose-100 text-rose-700';
    case 'bounced':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};