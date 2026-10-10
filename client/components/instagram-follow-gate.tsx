'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INSTAGRAM_URL = 'https://www.instagram.com/invertisprep.in/';

// Unlock is remembered per signed-in user, so the popup shows only once ever.
const unlockKey = (userId?: string) => `ig_unlock:${userId || 'anon'}`;

export function isUnlocked(userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(unlockKey(userId)) === '1';
  } catch {
    return false;
  }
}

function persistUnlock(userId?: string) {
  try {
    localStorage.setItem(unlockKey(userId), '1');
  } catch {
    // localStorage unavailable (private mode) — unlock for this session only
  }
}

interface InstagramFollowGateProps {
  open: boolean;
  userId?: string;
  /** Called once the user confirms the follow; the caller then opens the paper. */
  onUnlocked: () => void;
  /** Called when the user dismisses the popup without following. */
  onClose: () => void;
}

/**
 * One-time Instagram "follow to unlock" popup, styled like an Instagram
 * profile prompt. Follow → return → confirm → the paper opens. The unlock is
 * remembered per user, so this is a one-time verification.
 *
 * NOTE: Instagram has no API to verify a specific follow, so the confirm step
 * is an honour-system action.
 */
export function InstagramFollowGate({ open, userId, onUnlocked, onClose }: InstagramFollowGateProps) {
  const [returned, setReturned] = useState(false);
  const [opening, setOpening] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (open) {
      setReturned(isUnlocked(userId));
      setOpening(false);
      setUnlocking(false);
    }
  }, [open, userId]);

  useEffect(() => {
    if (!open || !opening) return;
    const onFocus = () => {
      if (document.visibilityState === 'visible') setReturned(true);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [open, opening]);

  const handleOpenInstagram = useCallback(() => {
    window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
    setOpening(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setUnlocking(true);
    persistUnlock(userId);
    setTimeout(onUnlocked, 450);
  }, [userId, onUnlocked]);

  return (
    <AnimatePresence>
      {open && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Neutral backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ig-gate-title"
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
{/* IG-style gradient header. Not positioned so it can't paint over the
            avatar below it. */}
        <div className="h-20 min-h-[80px] bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600">
          <div className="relative flex h-full justify-end p-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-7 w-7 rounded-full bg-white/25 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/35"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar overlapping the header. `relative z-10` keeps it painted on
            top of the gradient band. */}
        <div className="relative z-10 -mt-11 flex justify-center">
          <div className="rounded-full border-4 border-white bg-white shadow-sm">
            <img
              src="/logo.jpeg"
              alt="InvertisPrep"
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 id="ig-gate-title" className="text-[15px] font-bold text-slate-900">
              @invertisprep.in
            </h2>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-500" fill="currentColor" aria-hidden="true">
              <path d="M12 2 9.6 4.5l-3.4-.6-.6 3.4L2.2 9.9 4 12.9l-1.8 3 3.4 1.6.6 3.4 3.4-.6L12 22l2.4-2.5 3.4.6.6-3.4 3.4-1.6-1.8-3 1.8-3-3.4-1.6-.6-3.4-3.4.6z" />
              <path d="m10.8 15.3-3-3 1.2-1.2 1.8 1.8 4.2-4.2 1.2 1.2z" fill="#fff" />
            </svg>
          </div>
          <p className="mt-1 text-[12px] font-medium text-slate-400">InvertisPrep · Official</p>

          <p className="mx-auto mt-3.5 max-w-[17rem] text-[13px] leading-relaxed text-slate-600">
            This is a <span className="font-semibold text-slate-800">one-time verification</span>.
            Follow us for updates on new papers &amp; resources, then unlock this paper.
          </p>

          <div className="mt-5 space-y-2.5">
            <Button
              onClick={handleOpenInstagram}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-sm font-bold text-white hover:from-pink-500 hover:to-purple-500"
            >
              <Instagram className="mr-2 h-4 w-4" />
              {opening ? 'Open Instagram again' : 'Follow @invertisprep.in'}
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={!returned || unlocking}
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {unlocking ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                  Opening paper…
                </>
              ) : (
                "I've followed — open paper"
              )}
            </Button>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            {returned
              ? 'Thanks! Tap above to open your paper.'
              : 'Come back to this tab after following.'}
          </p>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
