'use client';

import { useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { SupportMessage } from '@/types';

const STATIC_TIME = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * Step-through support ticket thread with an inline reply box. Used on the
 * student "My Requests" page and the admin requests/bugs views — the same
 * visual language everywhere, so students and staff see symmetric threads.
 */
export function TicketThread({
  messages,
  canReply,
  onReply,
  requesterName = 'You',
  placeholder,
}: {
  messages: SupportMessage[];
  canReply: boolean;
  onReply: (body: string) => Promise<void>;
  requesterName?: string;
  placeholder?: string;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const isStaff = (m: SupportMessage) => {
    const r = m.senderRole;
    return r === 'admin' || r === 'super-admin' || r === 'srt' || r === 'staff';
  };

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await onReply(body.trim());
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <MessageCircle className="h-3.5 w-3.5" />
        Conversation
      </p>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs italic text-slate-400">No messages yet.</p>
        ) : (
          messages.map((m, i) => {
            const staffMsg = isStaff(m);
            return (
              <div key={i} className={`flex ${staffMsg ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    staffMsg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {staffMsg ? 'Support' : requesterName}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-0.5 text-[10px] opacity-60">{STATIC_TIME(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canReply && (
        <div className="mt-3 flex items-start gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder || 'Write a reply…'}
            rows={2}
            maxLength={2000}
            className="min-h-[56px] resize-none text-sm"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={sending || !body.trim()}
            title="Send reply"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}