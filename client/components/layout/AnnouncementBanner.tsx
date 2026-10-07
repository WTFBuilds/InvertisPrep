'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Dismissal is keyed on the message text, so updating the copy automatically
// re-shows the banner for everyone who dismissed an older announcement.
const MESSAGE =
  'New mid-term papers are being added by our team across departments — thank you for your patience while they go live.';
const STORAGE_KEY = 'ip-announcement-dismissed';

// Repeats per half-track keep the -50% translate seamless even on
// ultra-wide screens (~4 × message width ≫ any viewport).
const REPEATS_PER_GROUP = 4;

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === MESSAGE);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, MESSAGE);
    } catch {
      // Storage unavailable (private mode) — banner just reappears next load
    }
    setDismissed(true);
  };

  return (
    <div className="announcement-banner relative z-40 overflow-hidden bg-[#facc15] text-zinc-900">
      {/* Scrolling track: two identical groups, translated -50% for a seamless loop */}
      <div className="marquee-track flex w-max items-center py-3">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 items-center" aria-hidden={group === 1}>
            {Array.from({ length: REPEATS_PER_GROUP }).map((_, i) => (
              <span key={i} className="flex items-center gap-3 whitespace-nowrap pl-6 pr-5">
                <span className="rounded-full bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-white">
                  Announcement
                </span>
                <span className="text-sm leading-none text-zinc-900">
                  New <span className="font-bold">mid-term papers</span> are being added by our team across
                  departments — thank you for your patience while they go live.
                </span>
                <span className="text-sm leading-none text-zinc-900/40" aria-hidden="true">
                  ·
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Thin edge fades so the text dissolves instead of clipping at the edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#facc15] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#facc15] to-transparent" />

      {/* Dismiss */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-zinc-900/50 transition-colors hover:bg-zinc-900/10 hover:text-zinc-900"
      >
        <X className="size-3.5" />
      </button>

      <style jsx>{`
        .marquee-track {
          animation: banner-marquee 48s linear infinite;
        }
        .announcement-banner:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes banner-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
