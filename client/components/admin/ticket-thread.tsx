'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, MessageCircle, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { SupportMessage } from '@/types';

const STATIC_TIME = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

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
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  const isStaff = (m: SupportMessage) => {
    const r = m.senderRole;
    return r === 'admin' || r === 'super-admin' || r === 'srt' || r === 'staff';
  };

  // Smooth scroll down when a new message arrives
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onReply(trimmed);
      setBody('');
      // Give the DOM a tick to render new message then scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <MessageCircle className="h-3.5 w-3.5" />
          Conversation ({messages.length})
        </p>
        {messages.length > 0 && (
          <span className="text-[10px] font-medium text-slate-400">
            Live updates
          </span>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2.5 scroll-smooth">
        {messages.length === 0 ? (
          <div className="py-6 text-center">
            <MessageCircle className="mx-auto h-7 w-7 text-slate-300 stroke-[1.5]" />
            <p className="mt-2 text-xs font-medium text-slate-500">No messages yet</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {canReply ? 'Send a message below to start the conversation.' : 'Conversation will appear here.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const staffMsg = isStaff(m);
              const senderObj = typeof m.sender === 'object' && m.sender !== null ? m.sender : null;
              const senderName = staffMsg
                ? senderObj?.name ? `${senderObj.name} (Support)` : 'Support'
                : (requesterName || 'Student');

              const key = m._id || `${m.createdAt || ''}-${i}`;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${staffMsg ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs ${
                      staffMsg
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        staffMsg ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {senderName}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {m.body}
                    </p>
                    <p
                      className={`mt-1.5 text-right text-[10px] font-medium ${
                        staffMsg ? 'text-indigo-200/80' : 'text-slate-400'
                      }`}
                    >
                      {STATIC_TIME(m.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {canReply && (
        <div className="mt-3.5 pt-3 border-t border-slate-200/70">
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Write a reply… (Cmd+Enter to send)'}
              rows={2}
              maxLength={2000}
              className="min-h-[56px] resize-none bg-white text-sm focus-visible:ring-indigo-500"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={sending || !body.trim()}
              title="Send reply (Cmd+Enter)"
              className="h-10 w-10 shrink-0 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-sm"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
