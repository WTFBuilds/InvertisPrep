'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Avatar that shows the user's profile picture and, on click, opens the
// full-size image in a lightweight overlay. Falls back to initials when the
// user has no picture. Used across the admin console (paper requests, users,
// dashboard) so staff can actually view a member's pfp.
//
// plain: renders just the avatar with no click-to-zoom button. Use it when
// the avatar sits inside another interactive element (a row button or a Link)
// — nesting the zoom button inside one is invalid HTML and breaks hydration.
export function ViewableAvatar({
  src,
  name,
  className,
  fallbackClassName,
  alt,
  plain = false,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
  plain?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = name || 'User';
  const initial = label.charAt(0).toUpperCase();
  const hasImage = Boolean(src);

  const avatar = (
    <Avatar className={className}>
      {hasImage && <AvatarImage src={src as string} alt={alt || label} />}
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  );

  if (plain) return avatar;

  return (
    <>
      <button
        type="button"
        onClick={() => hasImage && setOpen(true)}
        disabled={!hasImage}
        title={hasImage ? 'View picture' : undefined}
        aria-label={hasImage ? `View ${label}'s picture` : label}
        className={cn(
          'rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          hasImage && 'cursor-zoom-in transition-transform hover:scale-105'
        )}
      >
        {avatar}
      </button>

      {open && src && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={label}
              className="max-h-[80vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
            />
            <p className="text-sm font-semibold text-white/90">{label}</p>
          </div>
        </div>
      )}
    </>
  );
}