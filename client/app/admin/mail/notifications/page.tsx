'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminMailApi } from '@/lib/api';
import type { NotifySettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [settings, setSettings] = useState<NotifySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'requestAck' | 'requestFulfilled' | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMailApi.notifications();
      if (res.success) setSettings(res.data || null);
    } catch {
      setFeedback({ kind: 'err', text: 'Failed to load notification settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key: 'requestAck' | 'requestFulfilled', enabled: boolean) => {
    if (acting) return;
    setActing(key);
    setFeedback(null);
    try {
      const res = await adminMailApi.updateNotifications({ [key]: enabled });
      if (res.success) {
        setSettings(res.data || null);
        setFeedback({ kind: 'ok', text: 'Notification settings updated' });
      } else setFeedback({ kind: 'err', text: res.message || 'Update failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setActing(null);
    }
  };

  const rows: { key: 'requestAck' | 'requestFulfilled'; title: string; desc: string }[] = [
    { key: 'requestAck', title: 'Paper request acknowledgement', desc: 'Email students when they request a paper — confirms we got it and shows what they asked for.' },
    { key: 'requestFulfilled', title: 'Paper request fulfilled', desc: 'Email the student when their requested paper is marked as fulfilled and added to the library.' },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Toggle the automatic emails sent for paper requests.</p>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${feedback.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {feedback.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {feedback.text}
          </div>
        )}

        {loading && !settings ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const enabled = settings?.[row.key] ?? true;
              const busy = acting === row.key;
              return (
                <Card key={row.key} className="border-slate-200 bg-white">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900">{row.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{row.desc}</p>
                    </div>
                    {isSuperAdmin ? (
                      <Button
                        variant={enabled ? 'outline' : 'default'}
                        disabled={busy}
                        onClick={() => toggle(row.key, !enabled)}
                        className="gap-1.5 font-semibold"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                      </Button>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}