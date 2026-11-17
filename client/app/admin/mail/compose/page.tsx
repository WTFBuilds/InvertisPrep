'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminMailApi } from '@/lib/api';
import type { MailTemplate } from '@/types';
import { MailTemplateEditor, blankTemplate } from '@/components/admin/mail-template-editor';
import {
  ManualEmailInput,
  UserRecipientPicker,
  type PickedUser,
} from '@/components/admin/mail-recipient-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

const RECIPIENT_MODES = [
  { value: 'all', label: 'All users' },
  { value: 'selected', label: 'Select users' },
  { value: 'manual', label: 'Manual emails' },
] as const;
type RecipientMode = (typeof RECIPIENT_MODES)[number]['value'];

const MODE_HINTS: Record<RecipientMode, string> = {
  all: 'Every active user with an email on file.',
  selected: 'Pick specific users from the platform — search by name or email.',
  manual: 'Type or paste any email addresses, including people without accounts.',
};

export default function ComposePage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [subject, setSubject] = useState('');
  const [tpl, setTpl] = useState<MailTemplate>(blankTemplate());
  const [mode, setMode] = useState<RecipientMode>('all');
  const [allUserCount, setAllUserCount] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<PickedUser[]>([]);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    adminMailApi.recipients()
      .then((res) => { if (res.success) setAllUserCount(res.data?.recipientCount ?? null); })
      .catch(() => {});
  }, []);

  const recipientCount =
    mode === 'all' ? (allUserCount ?? 0) : mode === 'selected' ? selectedUsers.length : manualEmails.length;
  const hasRecipients = recipientCount > 0;

  const send = async () => {
    if (!subject.trim()) return setFeedback({ kind: 'err', text: 'Subject is required' });
    setBusy(true);
    setFeedback(null);
    try {
      const res = await adminMailApi.sendCampaign({
        subject: subject.trim(),
        // HTML mode sends the pasted HTML verbatim; otherwise the builder
        // sections are rendered server-side. Undefined fields are ignored.
        rawHtml: tpl.rawHtml || undefined,
        bannerUrl: tpl.rawHtml ? undefined : tpl.bannerUrl,
        heading: tpl.rawHtml ? undefined : tpl.heading,
        intro: tpl.rawHtml ? undefined : tpl.intro,
        sections: tpl.rawHtml ? undefined : tpl.sections,
        footer: tpl.rawHtml ? undefined : tpl.footer,
        recipients: mode,
        ...(mode === 'selected' ? { userIds: selectedUsers.map((u) => u.id) } : {}),
        ...(mode === 'manual' ? { emails: manualEmails } : {}),
      });
      if (res.success) {
        setFeedback({ kind: 'ok', text: res.message || 'Campaign queued' });
      } else setFeedback({ kind: 'err', text: res.message || 'Send failed' });
    } catch (err: any) {
      setFeedback({ kind: 'err', text: err.response?.data?.message || 'Send failed' });
    } finally {
      setBusy(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <h1 className="text-xl font-black tracking-tight text-slate-900">Super admin only</h1>
          <p className="max-w-md text-sm text-slate-500">
            Sending mail is limited to super admins. Ask your super admin if you need this.
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  const audienceLine =
    mode === 'all'
      ? 'Send a campaign to all active users'
      : mode === 'selected'
        ? 'Send a campaign to the users you pick'
        : 'Send a campaign to addresses you enter';

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Compose</h1>
          <p className="text-sm text-slate-500">
            {audienceLine}
            {recipientCount !== null && recipientCount > 0 && (
              <span className="font-semibold text-slate-700">
                {' '}
                — {recipientCount.toLocaleString()} recipient{recipientCount === 1 ? '' : 's'}
              </span>
            )}
            .
          </p>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${feedback.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {feedback.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {feedback.text}
          </div>
        )}

        <Card className="border-slate-200 bg-white">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {RECIPIENT_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    disabled={busy}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-all disabled:opacity-60',
                      mode === m.value
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">{MODE_HINTS[mode]}</p>

              {mode === 'selected' && (
                <UserRecipientPicker selected={selectedUsers} onChange={setSelectedUsers} disabled={busy} />
              )}
              {mode === 'manual' && (
                <ManualEmailInput emails={manualEmails} onChange={setManualEmails} disabled={busy} />
              )}
            </div>

            <MailTemplateEditor value={tpl} onChange={setTpl} />
            <div className="flex items-center justify-end">
              <Button onClick={send} disabled={busy || !hasRecipients} className="gap-1.5 font-semibold">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {busy
                  ? 'Sending…'
                  : mode === 'all'
                    ? `Send to ${allUserCount?.toLocaleString() || 'all'} users`
                    : recipientCount > 0
                      ? `Send to ${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? '' : 's'}`
                      : 'No recipients selected'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
