'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminMailApi } from '@/lib/api';
import type { InboundMailEntry } from '@/types';
import { MailDetailDialog, type MailDetailTarget } from '@/components/admin/mail-detail-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Inbox as InboxIcon, Loader2, RefreshCw } from 'lucide-react';

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export default function MailboxPage() {
  const [items, setItems] = useState<InboundMailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [imapConfigured, setImapConfigured] = useState(true);
  const [target, setTarget] = useState<MailDetailTarget | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async (syncingNow = false) => {
    if (syncingNow) setSyncing(true);
    setError('');
    try {
      const res = await adminMailApi.inbox({ page: 1, limit: 50 });
      if (res.success) {
        setItems(res.data || []);
        setImapConfigured(res.imapConfigured !== false);
      } else setError(res.message || 'Failed to load mailbox');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load mailbox');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    setError('');
    try {
      await adminMailApi.sync();
      await load(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sync failed');
      setSyncing(false);
    }
  };

  const openMail = (id: string) => {
    setTarget({ id, direction: 'received' });
    setDetailOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Mailbox</h1>
            <p className="text-sm text-slate-500">
              Received mail synced from the Hostinger mailbox. Click a message to read it.
            </p>
          </div>
          <Button onClick={sync} disabled={syncing} className="gap-1.5 font-semibold">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>

        {!imapConfigured && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            IMAP is not configured (IMAP_HOST / IMAP_USER / IMAP_PASS). Set it in the server env to sync received mail.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/70">
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <InboxIcon className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Inbox is empty</p>
              <p className="text-xs text-slate-400">Hit “Sync now” to pull messages from the mailbox.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openMail(m.id)}
                className="w-full text-left"
              >
                <Card className="border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{m.subject || '(no subject)'}</p>
                        <p className="truncate text-xs text-slate-500">{m.from} → {m.to}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{m.preview}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {m.mailType === 'bounce' && <Badge className="bg-rose-100 text-rose-700">Bounce</Badge>}
                        <span className="text-xs text-slate-400">{formatDate(m.receivedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        <MailDetailDialog target={target} open={detailOpen} onOpenChange={setDetailOpen} />
      </div>
    </ProtectedRoute>
  );
}