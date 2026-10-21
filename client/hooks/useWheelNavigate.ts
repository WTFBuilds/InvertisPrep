'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "Scroll to open" interaction for a club card or club logo.
 *
 * The naive version — navigate on any wheel event over the element — is
 * unusable: the user scrolls the page, a card passes under the cursor,
 * and the wheel event lands on that card and yanks them into a club.
 * That is exactly the "it opened Rock On while I was just scrolling"
 * bug this hook exists to prevent.
 *
 * A wheel gesture only opens something when all of these hold:
 *
 *  1. IT IS A MOUSE WHEEL, NOT A TRACKPAD. This is the decisive guard.
 *     A two-finger trackpad gesture is, by definition, an intent to
 *     scroll the page — the cursor does not move at all, so the user
 *     cannot possibly have meant "open this card". Mouse wheels emit
 *     discrete notches of a fixed size; trackpads emit a rapid stream
 *     of small, fractional pixel deltas. Distinguishing them is what
 *     stops a trackpad scroll from opening anything.
 *
 *  2. THE POINTER MOVED RECENTLY. A mouse user moves the mouse onto a
 *     card to hover it, and that movement refreshes this window. A
 *     cursor parked for a minute and then scrolled does not qualify.
 *
 *  3. THE POINTER HAS ACTUALLY CROSSED THE ELEMENT. Being over it is
 *     not enough — the pointer has to travel a real distance across
 *     it, so sweeping past a card on the way somewhere else does not
 *     count.
 *
 *  4. THE PAGE IS NOT MID-SCROLL. The wheel event fires BEFORE the
 *     resulting scroll event, so a wheel arriving while the page is
 *     already scrolling is a continuation of page scrolling.
 *
 * The aimed state is written to `data-armed` on the element rather than
 * React state, so arming and disarming never re-render the tree.
 */

/** Shared page-level signals, tracked by one listener each. */
let lastScrollAt = 0;
let lastPointerMoveAt = 0;

if (typeof window !== 'undefined') {
  // Capture so nested scrollers count too.
  window.addEventListener(
    'scroll',
    () => {
      lastScrollAt = performance.now();
    },
    { passive: true, capture: true }
  );
  window.addEventListener(
    'pointermove',
    () => {
      lastPointerMoveAt = performance.now();
    },
    { passive: true }
  );
}

/**
 * Classifies a wheel gesture as trackpad or mouse.
 *
 * A mouse wheel emits a notch at a time — a fixed step of 100 (Chrome)
 * or 120 (Firefox) pixels. A trackpad emits a continuous stream of small
 * deltas driven by the physics of the fingers, which are essentially
 * never a clean multiple of the notch size.
 *
 * The classifier watches a gesture as it unfolds rather than judging a
 * single event, because a trackpad's first event of a flick can be
 * large. Once a gesture looks like a stream of small deltas, it is
 * marked as a trackpad and stays that way for the whole gesture.
 */
const wheelGesture = {
  lastTime: 0,
  count: 0,
  sum: 0,
  isTrackpad: false,
};

function isTrackpadGesture(deltaY: number): boolean {
  const now = performance.now();
  const abs = Math.abs(deltaY);
  const gap = now - wheelGesture.lastTime;

  if (gap > 250) {
    // A new gesture starts here.
    wheelGesture.count = 1;
    wheelGesture.sum = abs;
    // A clean multiple of the notch size is a mouse wheel.
    wheelGesture.isTrackpad = !(abs >= 100 && (abs % 100 === 0 || abs % 120 === 0));
  } else {
    wheelGesture.count += 1;
    wheelGesture.sum += abs;
    // A stream of small deltas is a trackpad.
    if (wheelGesture.count >= 2 && wheelGesture.sum / wheelGesture.count < 50) {
      wheelGesture.isTrackpad = true;
    }
  }

  wheelGesture.lastTime = now;
  return wheelGesture.isTrackpad;
}

export interface WheelNavigateOptions {
  enabled?: boolean;
  /** How long an aim stays valid after the pointer crosses the element. */
  aimValidMs?: number;
  /** How recently the pointer must have moved for it to count as active. */
  pointerActiveMs?: number;
  /** How far the pointer must travel across the element to aim at it. */
  travelPx?: number;
  /**
   * A page scroll within this window means the wheel is a continuation
   * of page scrolling rather than a fresh gesture.
   */
  scrollIntentMs?: number;
}

export function useWheelNavigate<T extends HTMLElement = HTMLDivElement>(
  href: string,
  options: WheelNavigateOptions = {}
) {
  const {
    enabled = true,
    aimValidMs = 1200,
    pointerActiveMs = 2000,
    travelPx = 20,
    scrollIntentMs = 300,
  } = options;

  const router = useRouter();
  const elementRef = useRef<T>(null);
  const aimedUntilRef = useRef(0);
  const travelRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const disarm = useCallback(() => {
    aimedUntilRef.current = 0;
    travelRef.current = 0;
    lastPointRef.current = null;
    const el = elementRef.current;
    if (el) delete el.dataset.armed;
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !enabled) return;

    const onWheel = (e: WheelEvent) => {
      // Ignore pinch-zoom and horizontal intent.
      if (e.ctrlKey) return;
      if (Math.abs(e.deltaY) < 3) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      const now = performance.now();

      // Guard 1: a trackpad gesture is always a page scroll.
      if (isTrackpadGesture(e.deltaY)) {
        disarm();
        return;
      }

      const aimed = aimedUntilRef.current > now;
      // Guard 2: the pointer must have moved recently.
      const pointerActive = now - lastPointerMoveAt < pointerActiveMs;
      // Guard 4: the page must not already be scrolling.
      const pageStill = now - lastScrollAt > scrollIntentMs;

      if (aimed && pointerActive && pageStill) {
        e.preventDefault();
        e.stopPropagation();
        disarm();
        router.push(href);
        return;
      }

      // Otherwise this is a page-scroll gesture. Let it through and drop
      // the aim, so a stale aim cannot hijack a later scroll.
      disarm();
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();

      // Guard 3: accumulate how far the pointer has travelled ACROSS
      // this element. A cursor that merely rests on it contributes
      // nothing, and a cursor that sweeps past contributes only the
      // distance it happened to cover.
      const last = lastPointRef.current;
      if (last) {
        travelRef.current += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      }
      lastPointRef.current = { x: e.clientX, y: e.clientY };

      // A pointer that has not moved for a while is parked, and a parked
      // pointer must not arm anything.
      if (now - lastPointerMoveAt > pointerActiveMs) {
        travelRef.current = 0;
        return;
      }

      if (travelRef.current >= travelPx) {
        // Keep the aim fresh while the pointer keeps moving over the
        // element.
        aimedUntilRef.current = now + aimValidMs;
        const el2 = elementRef.current;
        if (el2) el2.dataset.armed = 'true';
      }
    };

    const onPointerLeave = () => {
      // Leaving the element drops any accumulated travel, so a later
      // return starts from scratch.
      travelRef.current = 0;
      lastPointRef.current = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [
    href,
    router,
    enabled,
    disarm,
    aimValidMs,
    pointerActiveMs,
    travelPx,
    scrollIntentMs,
  ]);

  const handleEnter = useCallback(() => {
    // Entering alone does not arm anything — the pointer has to move
    // across the element.
    disarm();
  }, [disarm]);

  const handleLeave = useCallback(() => {
    disarm();
  }, [disarm]);

  return { elementRef, handleEnter, handleLeave };
}
