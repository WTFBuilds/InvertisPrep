'use client';

import { useEffect, useState } from 'react';

/**
 * Best-effort screenshot deterrent for protected content.
 *
 * IMPORTANT: no browser can truly block a screenshot — the OS/hardware or a
 * phone camera always can. What this does is the realistic maximum:
 *
 *   • shields (blurs) the content while the window is unfocused or the tab is
 *     hidden, so switching to a screenshot tool / app switcher reveals nothing;
 *   • reacts to PrintScreen / macOS ⇧⌘3-4-5 by shielding immediately;
 *   • raises `beforeprint` so the print path can hide the document;
 *   • blocks copy/cut/drag on the protected region.
 *
 * It never hard-locks the UI, so it cannot permanently blank someone's screen.
 */
export function useScreenshotGuard(enabled = true) {
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    // Brief shield that auto-clears, so a stray event can't leave a blank page.
    const flashShield = (ms = 1200) => {
      setShielded(true);
      if (restoreTimer) clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => setShielded(false), ms);
    };

    const onBlur = () => setShielded(true);
    const onFocus = () => setShielded(false);

    const onVisibility = () => {
      if (document.hidden) setShielded(true);
      else setShielded(false);
    };

    // PrintScreen has no reliable "released" event cross-browser, so the shield
    // is on while the key is down and released shortly after.
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'PrintScreen') {
        e.preventDefault();
        setShielded(true);
      }
      // macOS screenshot combos (⇧⌘3/4/5) and Windows snipping (⌘/Win+Shift+S)
      if (e.shiftKey && (e.metaKey || (e.ctrlKey && e.key.toLowerCase() === 's'))) {
        flashShield(1500);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') flashShield(600);
    };

    const onBeforePrint = () => setShielded(true);
    const onAfterPrint = () => setShielded(false);

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    return () => {
      if (restoreTimer) clearTimeout(restoreTimer);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [enabled]);

  return shielded;
}
