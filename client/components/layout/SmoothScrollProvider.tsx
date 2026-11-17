'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/**
 * Smooth scrolling for the whole site, tuned for a "professional" feel:
 *
 * - Momentum-based wheel scrolling (Lenis) instead of the browser's
 *   jump-to-page jumps.
 * - Speed reacts to where the pointer is: hovering a horizontal strip
 *   (cards, image rows) slows the scroll so the user can read/hover
 *   individual items without the page racing past.
 * - Scroll-to-top on route change, and `lenis.stop()` while a modal or
 *   drawer is open so the page never scrolls behind an overlay.
 *
 * Reduced-motion users get the native scroll behaviour instead.
 */

interface SmoothScrollContextValue {
  lenis: Lenis | null;
  /** Slow the scroll down (used while hovering card rows). */
  slow: () => void;
  /** Return to the default scroll speed. */
  normal: () => void;
  /** Temporarily lock scrolling (modals, drawers). */
  lock: () => void;
  /** Release the lock. */
  unlock: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenis: null,
  slow: () => {},
  normal: () => {},
  lock: () => {},
  unlock: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

const NORMAL_DURATION = 1.15;
const SLOW_DURATION = 2.4;

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const lockedRef = useRef(false);
  const slowedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  // The admin console opts out of smooth scrolling entirely.
  const isAdmin = pathname.startsWith('/admin');

  // ── Boot Lenis ──────────────────────────────────────────────────────
  useEffect(() => {
    // The admin console is a dense, table-and-form workspace that relies
    // on native scroll behaviour — its sidebar, dropdowns and dialogs all
    // manage their own scrolling. Emulated momentum there fights with
    // those and makes the panel feel wrong, so the admin routes are
    // excluded entirely.
    if (isAdmin) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: NORMAL_DURATION,
      // Exponential ease-out: fast pickup, long graceful glide.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Native scrolling on touch devices feels better than emulated.
      syncTouch: false,
      autoRaf: false,
    });

    lenisRef.current = lenis;
    setIsReady(true);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      setIsReady(false);
    };
  }, [isAdmin]);

  // ── Reset scroll on route change ────────────────────────────────────
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) {
      window.scrollTo(0, 0);
      return;
    }
    lenis.scrollTo(0, { immediate: true });
  }, [pathname]);

  // ── API ─────────────────────────────────────────────────────────────
  const slow = useCallback(() => {
    slowedRef.current = true;
    const lenis = lenisRef.current;
    if (lenis) lenis.options.duration = SLOW_DURATION;
  }, []);

  const normal = useCallback(() => {
    slowedRef.current = false;
    const lenis = lenisRef.current;
    if (lenis) lenis.options.duration = NORMAL_DURATION;
  }, []);

  const lock = useCallback(() => {
    lockedRef.current = true;
    lenisRef.current?.stop();
  }, []);

  const unlock = useCallback(() => {
    lockedRef.current = false;
    lenisRef.current?.start();
  }, []);

  // Expose lenis on window for components that need imperative scrolling
  // (e.g. "back to top", anchor jumps inside a card).
  useEffect(() => {
    if (!isReady || !lenisRef.current) return;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenisRef.current;
    return () => {
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [isReady]);

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current, slow, normal, lock, unlock }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

/**
 * Attaches hover-reactive scrolling to a horizontal strip. While the
 * pointer is over the element the page scroll slows to a crawl, so
 * per-card hover states are actually reachable. Leaving restores the
 * normal speed.
 */
export function useHoverSlowScroll() {
  const { slow, normal } = useSmoothScroll();

  return useCallback(
    (active: boolean) => {
      if (active) slow();
      else normal();
    },
    [slow, normal]
  );
}
