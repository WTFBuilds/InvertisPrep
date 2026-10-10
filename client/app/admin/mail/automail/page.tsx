'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminMailApi } from '@/lib/api';
import type { MailLogEntry, MailSettings, MailTemplate } from '@/types';
import { MailTemplateEditor, blankTemplate } from '@/components/admin/mail-template-editor';
import { MailDetailDialog, type MailDetailTarget } from '@/components/admin/mail-detail-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Loader2, MailWarning, Search } from 'lucide-react';

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export default function AutomailPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [log, setLog] = useState<MailLogEntry[]>([]);
  const [logMeta, setLogMeta] = useState<{ page: number; total: number; pages: number; sentCount?: number; failedCount?: number }>({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [toggling, setToggling] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const [tpl, setTpl] = useState<MailTemplate | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<MailDetailTarget | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openMail = (id: string) => {
    setDetailTarget({ id, direction: 'sent' });
    setDetailOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        adminMailApi.settings(),
        adminMailApi.automail({ page: logMeta.page, search: debounced || undefined }),
      ]);
      if (s.success && s.data) {
        setSettings(s.data);
        setTpl(s.data.welcomeTemplate);
      }
      if (l.success) {
        setLog(l.data || []);
        if (l.meta) {
          setLogMeta((m) => ({
            ...m,
            total: l.meta!.total,
            pages: l.meta!.pages,
            sentCount: (l.meta as any).sentCount,
            failedCount: (l.meta as any).failedCount,
          }));
        }
      }
    } catch {
      setFeedback({ kind: 'err', text: 'Failed to load automail settings' });
    } finally {
      setLoading(false);
    }
  }, [logMeta.page, debounced]);

  useEffect(() => { load(); }, [load]);

  const toggleWelcome = async (enabled: boolean) => {
    setToggling(true);
    setFeedback(null);
    try {
      const res = await adminMailApi.updateSettings({ welcomeEmailEnabled: enabled });
      if (res.success) {
        setSettings((s) => (s ? { ...s, welcomeEmailEnabled: enabled } : s));
        setFeedback({ kind: 'ok', text: `Welcome emails ${enabled ? 'enabled' : 'disabled'}` });
      } else setFeedback({ kind: 'err', text: res.message || 'Update failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setToggling(false);
    }
  };

  const saveTemplate = async () => {
    // If the admin saved without editing, fall back to the editor's default
    // starter template so there's always something valid to store.
    const template = tpl ?? blankTemplate();
    setSavingTpl(true);
    setFeedback(null);
    try {
      const res = await adminMailApi.updateSettings({ welcomeTemplate: template });
      if (res.success) setFeedback({ kind: 'ok', text: 'Welcome template saved' });
      else setFeedback({ kind: 'err', text: res.message || 'Save failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Save failed' });
    } finally {
      setSavingTpl(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Automail</h1>
          <p className="text-sm text-slate-500">
            Welcome emails — toggle, template and a log of what was sent.
          </p>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${feedback.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {feedback.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {feedback.text}
          </div>
        )}

        {/* Toggle */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5">
            {loading && !settings ? (
              <Skeleton className="h-20 w-full" />
            ) : settings ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-bold text-slate-900">Welcome emails</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Sent automatically to every new signup (Google + email/password).
                  </p>
                </div>
                {isSuperAdmin ? (
                  <Button
                    variant={settings.welcomeEmailEnabled ? 'outline' : 'default'}
                    disabled={toggling}
                    onClick={() => toggleWelcome(!settings.welcomeEmailEnabled)}
                    className="gap-1.5 font-semibold"
                  >
                    {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {settings.welcomeEmailEnabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                  </Button>
                ) : (
                  <Badge className={settings.welcomeEmailEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {settings.welcomeEmailEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Template editor — super-admin only */}
        {isSuperAdmin && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-slate-900">Welcome email template</p>
                  <p className="mt-0.5 text-sm text-slate-500">Customize the banner, heading, message, call-to-action and more.</p>
                </div>
                <Button onClick={saveTemplate} disabled={savingTpl || !tpl} className="gap-1.5 font-semibold">
                  {savingTpl && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save template
                </Button>
              </div>
              {/* The editor self-initialises with a blank template when none is
                  saved yet — so the welcome template is always editable. */}
              <MailTemplateEditor value={tpl ?? undefined} onChange={setTpl} />
            </CardContent>
          </Card>
        )}

        {/* Automail log */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-slate-900">Welcome emails sent</p>
                {(logMeta.sentCount || logMeta.failedCount) ? (
                  <span className="text-xs text-slate-500">
                    {logMeta.sentCount ?? 0} sent
                    {logMeta.failedCount ? ` · ${logMeta.failedCount} failed` : ''}
                  </span>
                ) : null}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or subject…" className="h-9 pl-9" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : log.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MailWarning className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No welcome emails yet</p>
                <p className="text-xs text-slate-400">
                  Once welcome mails go out to new signups, every recipient appears here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {log.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => openMail(entry.id)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {entry.user?.picture && <AvatarImage src={entry.user.picture} alt={entry.user?.name || ''} />}
                          <AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-700">
                            {(entry.user?.name || entry.to || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {entry.user?.name || entry.to}
                          </p>
                          <p className="truncate text-xs text-slate-500">{entry.to}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className={entry.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                          {entry.status}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {logMeta.pages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <Button variant="outline" size="sm" disabled={logMeta.page <= 1} onClick={() => setLogMeta((m) => ({ ...m, page: m.page - 1 }))}>
                  Prev
                </Button>
                <span className="text-xs text-slate-500">Page {logMeta.page} of {logMeta.pages}</span>
                <Button variant="outline" size="sm" disabled={logMeta.page >= logMeta.pages} onClick={() => setLogMeta((m) => ({ ...m, page: m.page + 1 }))}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <MailDetailDialog target={detailTarget} open={detailOpen} onOpenChange={setDetailOpen} />
      </div>
    </ProtectedRoute>
  );
}