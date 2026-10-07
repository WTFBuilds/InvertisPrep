import Image from 'next/image';
import instaLogo from '@/assets/insta logo.avif';

const INSTAGRAM_URL = 'https://www.instagram.com/invertisprep.in/';
const HANDLE = '@invertisprep.in';

/**
 * Floating Instagram button (bottom-right corner) using the brand logo
 * asset, cropped full-bleed into the circle (app-icon look). Material-style
 * hover: the button lifts with an elevated shadow and a small handle
 * tooltip fades in above it.
 */
export default function InstagramFab() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow ${HANDLE} on Instagram`}
      className="group fixed bottom-5 right-5 z-50 block size-12 overflow-hidden rounded-full border border-slate-200 shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl active:translate-y-0 active:scale-95"
    >
      <Image
        src={instaLogo}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
      />

      {/* Handle tooltip */}
      <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
        {HANDLE}
        <span className="absolute -bottom-1 right-5 size-2 rotate-45 bg-zinc-900" />
      </span>
    </a>
  );
}
