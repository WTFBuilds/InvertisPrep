'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminMailApi } from '@/lib/api';
import type { UnifiedMailLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const statusBadge = (status: UnifiedMailLog['status']) => {
  switch (status) {
    case 'sent': return <Badge className="bg-emerald-100 text-emerald-700">Sent</Badge>;
    case 'failed': return <Badge className="bg-rose-100 text-rose-700">Failed</Badge>;
    case 'bounced': return <Badge className="bg-orange-100 text-orange-700">Bounced</Badge>;
    default: return <Badge className="bg-slate-100 text-slate-600">Synced</Badge>;
  }
};

const directionBadge = (dir: UnifiedMailLog['direction']) => (
  <Badge variant="outline" className={dir === 'sent' ? 'border-indigo-200 text-indigo-700' : 'border-sky-200 text-sky-700'}>
    {dir === 'sent' ? 'Sent' : 'Received'}
  </Badge>
);

export default function LogsPage() {
  const [logs, setLogs] = useState<UnifiedMailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [direction, setDirection] = useState<'all' | 'sent' | 'received'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminMailApi.logs({ page, limit: 30, search: debounced || undefined, direction });
      if (res.success) {
        setLogs(res.data || []);
        if (res.meta) setPages(res.meta.pages);
      } else setError(res.message || 'Failed to load logs');
    } catch {
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, direction]);

  useEffect(() => { load(); }, [load]);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Mail logs</h1>
          <p className="text-sm text-slate-500">Every sent and received mail — including bounces.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by sender, recipient or subject…" className="h-9 pl-9" />
          </div>
          <select
            value={direction}
            onChange={(e) => { setDirection(e.target.value as 'all' | 'sent' | 'received'); setPage(1); }}
            className="h-9 w-[160px] rounded-md border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="all">All mail</option>
            <option value="sent">Sent only</option>
            <option value="received">Received only</option>
          </select>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/70">
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <p className="text-sm font-semibold text-slate-600">No mail in the logs</p>
              <p className="text-xs text-slate-400">Sent and received mail will show up here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <Card key={`${l.direction}-${l.id}`} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{l.subject || '(no subject)'}</p>
                      <p className="truncate text-xs text-slate-500">
                        {l.direction === 'sent' ? `To: ${l.to || '—'}` : `From: ${l.from || '—'}`}
                        {l.preview ? ` — ${l.preview}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {directionBadge(l.direction)}
                      {statusBadge(l.status)}
                      <span className="text-xs text-slate-400">{formatDate(l.ts)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-xs text-slate-500">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}