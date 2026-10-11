'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { activityApi } from '@/lib/api';

const HEARTBEAT_MS = 45 * 1000;

// Pages that are part of the auth flow itself — still tracked as page views,
// but they must never register as the user's "current page" presence.
const AUTH_PATH_PREFIXES = ['/login', '/auth', '/admin/login'];

// One id per browser tab (sessionStorage): groups events into sessions so the
// monitor can reconstruct "this user's visit" with a start and an end.
function getSessionKey(): string {
  try {
    const existing = sessionStorage.getItem('ip-session-key');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('ip-session-key', key);
    return key;
  } catch {
    return '';
  }
}

function currentTitle(): string {
  if (typeof document === 'undefined') return '';
  // Strip the site suffix — "Subject · 2022 | InvertisPrep" → "Subject · 2022"
  return document.title.replace(/\s*\|\s*InvertisPrep\s*$/i, '').trim();
}

function isAuthFlow(path: string): boolean {
  return AUTH_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Client-side activity tracker. Mounted once in the root layout.
 *
 *  • page_view  — on every route change while signed in
 *  • presence   — heartbeat every 45s (plus immediately on tab focus) so the
 *                 admin monitor can show who is online and where they are
 *
 * Everything is fire-and-forget: tracking failures are swallowed and the app
 * never waits on it.
 */
export function ActivityTracker() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const sessionKeyRef = useRef<string>('');
  const lastPathRef = useRef<{ path: string; at: number }>({ path: '', at: 0 });

  useEffect(() => {
    if (!sessionKeyRef.current) sessionKeyRef.current = getSessionKey();
  }, []);

  // Page views on navigation
  useEffect(() => {
    if (loading || !user || !pathname) return;
    const now = Date.now();
    // De-dupe: App Router can re-run effects twice for the same path (strict
    // mode, back/forward) — one page_view per path per 5s window.
    if (lastPathRef.current.path === pathname && now - lastPathRef.current.at < 5000) return;
    lastPathRef.current = { path: pathname, at: now };

    activityApi.track({
      type: 'page_view',
      path: pathname,
      title: currentTitle(),
      sessionKey: sessionKeyRef.current,
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    });
  }, [pathname, user, loading]);

  // Presence heartbeat
  useEffect(() => {
    if (loading || !user) return;

    const beat = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      activityApi.presence({
        path: isAuthFlow(pathname) ? '' : pathname,
        title: isAuthFlow(pathname) ? '' : currentTitle(),
        sessionKey: sessionKeyRef.current,
        visible: typeof document === 'undefined' || document.visibilityState === 'visible',
      });
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [pathname, user, loading]);

  return null;
}
