'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminMailApi } from '@/lib/api';
import type { NotifySettings, MailTemplate } from '@/types';
import { MailTemplateEditor } from '@/components/admin/mail-template-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [settings, setSettings] = useState<NotifySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<'requestAck' | 'requestFulfilled' | null>(null);
  const [draft, setDraft] = useState<MailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

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
        setFeedback({ kind: 'ok', text: `${enabled ? 'Enabled' : 'Disabled'}` });
      } else setFeedback({ kind: 'err', text: res.message || 'Update failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setActing(null);
    }
  };

  const startEditing = (key: 'requestAck' | 'requestFulfilled') => {
    const current = key === 'requestAck' ? settings?.requestAckTemplate : settings?.requestFulfilledTemplate;
    setDraft(current ?? null);
    setEditing(key);
  };

  const saveTemplate = async (key: 'requestAck' | 'requestFulfilled') => {
    if (!draft) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = key === 'requestAck' ? { requestAckTemplate: draft } : { requestFulfilledTemplate: draft };
      const res = await adminMailApi.updateNotifications(payload);
      if (res.success) {
        setSettings(res.data || null);
        setEditing(null);
        setFeedback({ kind: 'ok', text: 'Template saved' });
      } else setFeedback({ kind: 'err', text: res.message || 'Save failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
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
          <p className="text-sm text-slate-500">
            Toggle and customize the automatic emails sent for paper requests.
          </p>
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
          <div className="space-y-4">
            {rows.map((row) => {
              const enabled = settings?.[row.key] ?? true;
              const busy = acting === row.key;
              return (
                <Card key={row.key} className="border-slate-200 bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    </div>

                    {isSuperAdmin && (
                      <div>
                        <button
                          type="button"
                          onClick={() => (editing === row.key ? setEditing(null) : startEditing(row.key))}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          <span>Edit email template</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${editing === row.key ? 'rotate-180' : ''}`} />
                        </button>

                        {editing === row.key && (
                          <div className="mt-3 space-y-4">
                            <p className="text-xs text-slate-400">
                              Placeholders available: {'{{name}}'}, {'{{subject}}'}, {'{{subjectCode}}'}, {'{{year}}'}, {'{{examType}}'}.
                            </p>
                            {draft ? (
                              <MailTemplateEditor
                                value={draft}
                                onChange={setDraft}
                                showTemplates={false}
                              />
                            ) : (
                              <Skeleton className="h-40 w-full" />
                            )}
                            <div className="flex justify-end">
                              <Button onClick={() => saveTemplate(row.key)} disabled={saving || !draft} className="gap-1.5 font-semibold">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save template
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
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