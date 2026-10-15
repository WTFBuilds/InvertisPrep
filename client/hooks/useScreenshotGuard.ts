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
 *   • reacts to PrintScreen and ANY ≥2-modifier stack (Shift,
 *     Cmd/Win, Alt/Option, Control) by shielding — the OS
 *     intercepts the real screenshot key (⇧⌘4, Win+Shift+S, …),
 *     so its keydown often never reaches the page, but the
 *     modifier keydowns DO; KEEPS shielding after release
 *     because the area-selection crosshair stays active once
 *     the combo keys are let go (unshielding on keyup would
 *     expose the document mid-capture);
 *   • raises `beforeprint` so the print path can hide the document.
 *
 * It never hard-locks the UI: every shield path auto-clears (watchdog
 * timers bound the capture window), and Escape cancels an active capture
 * shield when the event reaches the page.
 */

// Capture combos, matched on e.code so any keyboard layout works:
// Digit3/4/5 → macOS ⇧⌘3/4/5, KeyS → Win+Shift+S / ⌘+Shift+S
// / Ctrl+Shift+S (Snip variants).
const SHOT_CODES = new Set(['Digit3', 'Digit4', 'Digit5', 'KeyS']);

// How long the shield stays up after a capture combo: the user
// releases the keys, THEN drags the selection area (macOS/Windows
// crosshair stays active with the window still focused). Snapchat
// web-style: the document stays hidden for the entire capture
// flow, bounded by this watchdog so an accidental combo can never
// blank the page forever.
const CAPTURE_WINDOW_MS = 10000;
// Unknown modifier stacks: the OS may have swallowed the real
// shot key, so still shield — briefly, since we can't know
// which system shortcut is starting.
const SOFT_WINDOW_MS = 5000;
const PRINTSCREEN_MS = 1500;

export type ShieldReason = 'inactive' | 'capture' | 'print';

export function useScreenshotGuard(enabled = true) {
  const [shielded, setShielded] = useState(false);
  const [reason, setReason] = useState<ShieldReason>('inactive');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let captureTimer: ReturnType<typeof setTimeout> | null = null;
    let captureActive = false;

    const clearCaptureTimer = () => {
      if (captureTimer) {
        clearTimeout(captureTimer);
        captureTimer = null;
      }
    };

    // Shield for a bounded time. The timer is the watchdog that
    // guarantees the page can never stay blanked.
    const shieldFor = (r: ShieldReason, ms: number) => {
      setReason(r);
      setShielded(true);
      clearCaptureTimer();
      captureTimer = setTimeout(() => {
        captureActive = false;
        setShielded(false);
      }, ms);
    };

    const onBlur = () => {
      clearCaptureTimer();
      captureActive = false;
      setReason('inactive');
      setShielded(true);
    };
    const onFocus = () => setShielded(false);

    const onVisibility = () => {
      if (document.hidden) {
        clearCaptureTimer();
        captureActive = false;
        setReason('inactive');
        setShielded(true);
      } else {
        setShielded(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        captureActive = false;
        shieldFor('capture', PRINTSCREEN_MS);
        return;
      }
      // Escape cancels the crosshair on macOS/Windows; when the
      // event does reach the page, drop the shield immediately.
      if (e.key === 'Escape' && captureActive) {
        clearCaptureTimer();
        captureActive = false;
        setShielded(false);
        return;
      }
      // Trigger on ANY two-or-more-modifier stack, not specific
      // keys: on macOS and Windows the OS intercepts the real
      // screenshot key (⇧⌘4, Win+Shift+S, …), so its keydown
      // often never reaches the page. But every system capture
      // shortcut starts with modifiers arriving first — Shift,
      // Cmd/Win, Alt/Option, Control — and a modifier keydown
      // DOES reach us. So ≥2 modifiers down = a system shortcut
      // (screenshot, snip, spotlight…) may be starting: shield.
      const mods = [e.shiftKey, e.metaKey, e.ctrlKey, e.altKey]
        .filter(Boolean).length;
      if (mods >= 2) {
        e.preventDefault();
        captureActive = true;
        // Known shot keys get the full selection window; any
        // other modifier stack still shields, briefly, since we
        // can't know which shortcut the OS is about to run.
        const ms = SHOT_CODES.has(e.code)
          ? CAPTURE_WINDOW_MS
          : SOFT_WINDOW_MS;
        shieldFor('capture', ms);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        // Some platforms capture on release — re-shield briefly.
        shieldFor('capture', PRINTSCREEN_MS);
      }
      // Deliberately NO unshield on capture-combo keyup: the area
      // selection happens after the keys are released, so the shield
      // must outlive them (see CAPTURE_WINDOW_MS).
    };

    const onBeforePrint = () => {
      setReason('print');
      setShielded(true);
    };
    const onAfterPrint = () => setShielded(false);

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    return () => {
      clearCaptureTimer();
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [enabled]);

  return { shielded, reason };
}
