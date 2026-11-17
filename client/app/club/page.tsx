'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform, useMotionValue, useAnimationFrame, type MotionValue } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Calendar,
  Award,
  Target,
  ExternalLink,
  Check,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { CLUB_LIST } from '@/lib/clubs';
import type { Club as ClubModel } from '@/types';
import { useClubs } from '@/hooks/use-clubs';
import { useHoverSlowScroll } from '@/components/layout/SmoothScrollProvider';
import { useWheelNavigate } from '@/hooks/useWheelNavigate';

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * The pointer's current viewport position, tracked on the window.
 *
 * The hero orbit uses this to decide how close the pointer is to each
 * club logo. Distance-based proximity is far steadier than hover events
 * here: the logos are constantly moving, so an exact hover boundary
 * keeps flapping and the orbit visibly stutters as it chases the
 * cursor.
 */
const pointer = { x: -9999, y: -9999 };

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    },
    { passive: true }
  );
}

/**
 * The distance from the pointer to each orbit logo, refreshed every
 * frame. The orbit's speed is driven by the SMALLEST value in this
 * registry — taking the minimum matters, because each logo measures
 * independently and the nearest one is the one the user is aiming at.
 * If every logo set the speed itself, the last one to run would win
 * and the orbit would jump between full speed and stopped.
 */
const orbitDistances = CLUB_LIST.map(() => Number.POSITIVE_INFINITY);

const STATS = [
  { label: 'Active Clubs', value: '7', icon: Target },
  { label: 'Events Hosted', value: '1000+', icon: Calendar },
  { label: 'Students Impacted', value: '15000+', icon: Users },
  { label: 'Years of Excellence', value: '15+', icon: Award },
];

/**
 * Reveal wrapper that reliably fires.
 *
 * The earlier implementation used `useInView` with a negative margin, which
 * could resolve before the browser had settled the layout — the last cards
 * in a long grid would then never trigger and stayed invisible. This uses a
 * positive root margin so the observer fires slightly *before* the element
 * enters the viewport, and `amount: 0.15` so a partially visible element
 * always counts. Elements that are already on screen at mount are caught by
 * the `once` + positive-margin combination on the first observer callback.
 */
function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  amount = 0.15,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount, margin: '0px 0px -10% 0px' });

  const hidden =
    direction === 'left'
      ? { opacity: 0, x: -40 }
      : direction === 'right'
        ? { opacity: 0, x: 40 }
        : direction === 'scale'
          ? { opacity: 0, scale: 0.94 }
          : { opacity: 0, y: 40 };

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={isInView ? { opacity: 1, x: 0, y: 0, scale: 1 } : hidden}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────── */

/**
 * A club logo in the hero orbit.
 *
 * Three things matter here and they fight each other if done naively:
 *
 * 1. Magnification. The scale lives on the *image* element itself, not on
 *    a wrapper, because the wrapper is clipped by its container. Scaling
 *    the wrapper and the image separately compounds the two transforms
 *    into a jumpy double-magnification. One scale, on the image, with a
 *    slow easing curve.
 * 2. Clickability. The orbit rotates continuously, so a logo slides out
 *    from under the cursor and the click lands on nothing. The orbit
 *    therefore pauses while any logo is hovered.
 * 3. Reliable activation. Even paused, a 128px logo that magnifies to
 *    1.45x can shift under the cursor between pointerdown and pointerup,
 *    and the browser then refuses to fire a click. So activation is
 *    handled on *pointerdown* with a generous hit area.
 */
function OrbitLogo({
  club,
  index,
  angle,
  rotation,
}: {
  club: ClubModel;
  index: number;
  angle: number;
  rotation: MotionValue<number>;
}) {
  const router = useRouter();
  const { elementRef, handleEnter, handleLeave } = useWheelNavigate<HTMLButtonElement>(
    `/club/${club.id}`
  );

  // `angle`. Counter-rotating by -(rotation + angle) keeps each logo
  // upright regardless of where the orbit currently is.
  const counterRotation = useTransform(rotation, (r) => -(r + angle));

  // Activating on pointerdown removes the "click swallowed" failure mode
  // entirely — there is no second half of the gesture that can miss.
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    router.push(`/club/${club.id}`);
  };

  // Distance from the pointer to this logo's centre, reported into the
  // shared registry every frame. Proximity (rather than a hover event)
  // is what drives the orbit's slowdown: an exact hover boundary is a
  // moving target, and chasing it produces the visible "creep then
  // stop" stutter.
  useAnimationFrame(() => {
    const el = elementRef.current;
    if (!el) {
      orbitDistances[index] = Number.POSITIVE_INFINITY;
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    orbitDistances[index] = Math.hypot(cx - pointer.x, cy - pointer.y);
  });

  return (
    <motion.div
      style={{ rotate: counterRotation }}
      className="flex h-full w-full items-center justify-center"
    >
      <button
        ref={elementRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        aria-label={`Open ${club.name} club page`}
        className="group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {/* Generous hit target — extends well past the visible logo so a
            slightly-off cursor still registers the press and the hover. */}
        <span className="pointer-events-none absolute inset-[-40%] rounded-full" aria-hidden />
        <div className="relative h-full w-full">
          <Image
            src={club.img || '/images/panache.png'}
            alt={club.name}
            fill
            className="pointer-events-none object-contain drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.45] group-hover:drop-shadow-2xl"
            sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
            placeholder="blur"
            blurDataURL={BLUR}
          />
        </div>
      </button>
    </motion.div>
  );
}

function Hero({ clubs }: { clubs: ClubModel[] }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const { scrollY } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const gridY = useTransform(scrollY, [0, 700], [0, 90]);
  const copyY = useTransform(scrollY, [0, 700], [0, 60]);
  const logoY = useTransform(scrollY, [0, 700], [0, 30]);
  const fade = useTransform(scrollY, [0, 500], [1, 0.2]);

  // The orbit slows to a stop as the pointer approaches a logo, and
  // speeds back up when the pointer moves away. A continuously rotating
  // target is nearly impossible to click — the logo drifts out from
  // under the cursor between pointerdown and click.
  //
  // Two details make this feel clean rather than glitchy:
  //
  // - Proximity, not hover events. The logos are always moving, so an
  //   exact hover boundary flaps constantly and the orbit visibly
  //   stutters as it chases the cursor. A distance threshold with a
  //   generous radius is stable.
  // - The rotation lives in a MotionValue, so none of this re-renders
  //   React. The speed is eased rather than switched, so the orbit
  //   glides to a stop instead of halting dead.
  const orbitTargetSpeedRef = useRef(1);
  const orbitSpeedRef = useRef(1);
  const rotation = useMotionValue(0);

  // Distance (px) at which the orbit is fully stopped.
  const PAUSE_RADIUS = 150;
  // Distance at which the orbit is back to full speed.
  const RESUME_RADIUS = 260;

  useAnimationFrame((_, delta) => {
    // The nearest logo decides the speed. Each logo writes its own
    // distance into the shared registry, so taking the minimum here
    // means the logo the user is actually aiming at always wins.
    let nearest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < orbitDistances.length; i++) {
      if (orbitDistances[i] < nearest) nearest = orbitDistances[i];
    }

    const target = nearest <= PAUSE_RADIUS ? 0 : nearest >= RESUME_RADIUS ? 1 : orbitTargetSpeedRef.current;
    orbitTargetSpeedRef.current = target;

    // Ease toward the target speed. When the pointer is near a logo the
    // target is 0, so the orbit glides to a halt.
    const current = orbitSpeedRef.current;
    const next = current + (target - current) * Math.min(1, delta * 0.01);
    orbitSpeedRef.current = Math.abs(next - target) < 0.002 ? target : next;

    if (orbitSpeedRef.current <= 0) return;
    rotation.set((rotation.get() + delta * 0.012 * orbitSpeedRef.current) % 360);
  });

  return (
    <section
      ref={ref}
      className="relative flex min-h-[calc(100svh-88px)] w-full items-center justify-center overflow-hidden border-b border-slate-200 bg-slate-50"
    >
      {/* Parallax grid */}
      <motion.div
        style={{ y: gridY }}
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />

      {/* Ambient glows */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="pointer-events-none absolute -left-[10%] -top-[15%] aspect-square w-[45%] rounded-full bg-blue-500/[0.07] blur-3xl"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
        className="pointer-events-none absolute -bottom-[15%] -right-[8%] aspect-square w-[38%] rounded-full bg-orange-400/[0.07] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          {/* Copy */}
          <motion.div
            style={{ y: copyY, opacity: fade }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span className="text-xs font-bold text-slate-600 sm:text-sm">
                Official Student Organization • Invertis University
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 text-5xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                abhi<span className="font-serif tracking-normal">रुचि</span>
              </span>{' '}
              <br className="hidden lg:block" />
              <span className="text-3xl font-black tracking-normal text-slate-700 sm:text-4xl lg:text-5xl">
                – THE HOBBY CLUB
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 sm:text-xl"
            >
              Inspiring creativity, leadership, and innovation through seven diverse clubs.
              Join a vibrant community where passion meets purpose, and every student
              discovers their true potential.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="mb-11 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link
                href="#clubs"
                className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-slate-900/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
              >
                Explore the clubs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="https://abhruchi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                Visit Website
                <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
              </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.34 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg lg:items-start lg:text-left"
                >
                  <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="mb-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-500 sm:text-xs">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Orbital visual */}
          <motion.div
            style={{ y: logoY }}
            className="relative mx-auto mt-8 aspect-square w-full max-w-sm sm:max-w-md lg:mt-0 lg:max-w-xl"
          >
            {/* Rings */}
            <div
              className="absolute inset-[8%] rounded-full border border-dashed border-blue-500/15"
              aria-hidden
            />
            <div
              className="absolute inset-[22%] rounded-full border border-dashed border-slate-300/40"
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-full bg-blue-500/[0.06] blur-3xl"
              aria-hidden
            />

            {/* Centre logo */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.2, type: 'spring', bounce: 0.4 }}
              className="absolute left-1/2 top-1/2 z-20 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-48 sm:w-48 lg:h-64 lg:w-64"
            >
              {/* The ping halo scales outward as it animates and would
                  otherwise sit on top of the orbit logos, swallowing
                  their clicks. pointer-events-none keeps it purely
                  decorative. */}
              <div
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-blue-500/10 opacity-30"
                aria-hidden
              />
              <Image
                src="/images/abhiruchi1.png"
                alt="Abhiruchi — The Hobby Club"
                fill
                priority
                className="pointer-events-none object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 256px"
              />
            </motion.div>

            {/* Orbiting club logos */}
            <motion.div
              style={{ rotate: rotation }}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
              {clubs.map((club, i) => {
                const angle = i * (360 / clubs.length);
                return (
                  <div
                    key={club.id}
                    className="absolute origin-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <div className="translate-y-[-140px] sm:translate-y-[-176px] lg:translate-y-[-236px]">
                      <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24 lg:h-32 lg:w-32">
                        <OrbitLogo
                          club={club}
                          index={i}
                          angle={angle}
                          rotation={rotation}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-slate-400 transition-colors hover:text-slate-700 lg:flex"
        aria-label="Scroll to about section"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </motion.a>
    </section>
  );
}

/* ── About ─────────────────────────────────────────────────────────── */

function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const TAGS = ['Student Leadership', 'Event Management', 'Innovation', 'Skill Development'];

  return (
    <section
      ref={ref}
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-white py-20 sm:py-28 lg:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <Reveal direction="left" className="space-y-8 lg:col-span-6 lg:space-y-10">
            <div>
              <h2 className="mb-4 flex items-center gap-2.5 text-sm font-black uppercase tracking-widest text-blue-600">
                <span className="h-0.5 w-8 bg-blue-600" />
                About Abhiruchi
              </h2>
              <h3 className="text-4xl font-black leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
                Discover the heart of creativity and innovation.
              </h3>
            </div>

            <div className="space-y-6 text-lg font-medium leading-relaxed text-slate-600">
              <p>
                <strong className="text-slate-900">Abhiruchi – The Hobby Club</strong> is the
                central pillar of student life at Invertis University. We are a community
                dedicated to fostering talent, leadership, and lifelong friendships.
              </p>
              <p>
                Driven by a dynamic council of student leaders, we organize the
                university&apos;s most prestigious events. From large-scale fests to intimate
                skill-building workshops, we nurture the innovators of tomorrow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100"
                >
                  <Check className="h-4 w-4 text-blue-600" strokeWidth={3} />
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right" className="relative mt-6 lg:col-span-6 lg:mt-0">
            <motion.div
              style={{ y: glowY }}
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-2xl"
              aria-hidden
            />
            <motion.div
              style={{ y: imageY }}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-2xl"
            >
              <Image
                src="/images/about-abhiruchi.jpg"
                alt="Abhiruchi club activities at Invertis University"
                fill
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={BLUR}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-lg font-black text-white">15+ Years of Excellence</p>
                <p className="text-sm font-medium text-white/80">
                  Building leaders, creating memories
                </p>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Clubs grid ────────────────────────────────────────────────────── */

/**
 * A club card that navigates to the club's page when the mouse wheel is
 * scrolled over it. This gives a "push" feel: hover a club, scroll, and
 * you land on that club.
 *
 * Navigation also fires on pointerdown rather than click. A card whose
 * contents animate on hover can shift under the cursor between
 * pointerdown and pointerup, and the browser then refuses to fire the
 * click — the press is "swallowed". Acting on pointerdown removes that
 * failure mode entirely.
 */
function ClubCard({ club, index }: { club: ClubModel; index: number }) {
  const router = useRouter();
  const { elementRef, handleEnter, handleLeave } = useWheelNavigate(`/club/${club.id}`);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only the primary button counts.
    if (e.button !== 0) return;
    e.preventDefault();
    router.push(`/club/${club.id}`);
  };

  return (
    <Reveal delay={(index % 4) * 0.08} direction="scale" amount={0.1}>
      <div
        ref={elementRef}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onPointerDown={handlePointerDown}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/club/${club.id}`);
          }
        }}
        aria-label={`Explore ${club.name} — ${club.tagline}`}
        className="group relative h-full cursor-pointer"
      >        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-2xl"
            style={{ ['--club' as string]: club.color }}
          >
            {/* Colour wash on hover */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${club.color}14, transparent 60%)`,
              }}
              aria-hidden
            />

            {/* Logo area.
                The card has overflow-hidden (needed for the rounded hover
                wash), which also clips a magnified logo. The image is
                therefore sized so that 1.35x still fits inside the
                padded area — magnification is never cut off. */}
            <div className="relative flex h-60 w-full items-center justify-center p-4 sm:h-64">
              <div
                className="absolute inset-0 scale-50 rounded-full blur-3xl transition-all duration-700 group-hover:scale-100"
                style={{ background: `${club.color}14` }}
                aria-hidden
              />
              <div className="relative z-10 h-full w-full max-w-[150px]">
                <Image
                  src={club.img || '/images/panache.png'}
                  alt={club.name}
                  fill
                  className="object-contain drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.35] group-hover:drop-shadow-2xl"
                  sizes="(max-width: 640px) 150px, (max-width: 1024px) 150px, 150px"
                  placeholder="blur"
                  blurDataURL={BLUR}
                />
              </div>

              {/* Tagline pill */}
              <span
                className="absolute right-4 top-4 z-20 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `${club.color}1a`, color: club.colorDark }}
              >
                {club.tagline}
              </span>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col px-6 pb-6">
              <div className="mb-4 flex-1 text-center">
                <h4 className="mb-1 text-lg font-black tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-[var(--club)] sm:text-xl">
                  {club.name}
                </h4>
                <p
                  className="mb-3 text-[11px] font-black uppercase tracking-widest sm:text-xs"
                  style={{ color: club.color }}
                >
                  {club.tagline}
                </p>
                <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-500">
                  {club.shortDescription}
                </p>
              </div>

              {/* Stats row */}
              <div className="mb-4 grid grid-cols-3 gap-1.5 border-y border-slate-100 py-3">
                {(club.stats ?? []).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="text-sm font-black sm:text-base"
                      style={{ color: club.colorDark }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 group-hover:border-[var(--club)] group-hover:bg-[var(--club)] group-hover:text-white">
                  Explore Club
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
      </div>
    </Reveal>
  );
}

function ClubGrid({ clubs }: { clubs: ClubModel[] }) {
  const setHoverSlow = useHoverSlowScroll();

  return (
    <section
      id="clubs"
      className="relative scroll-mt-24 border-t border-slate-200 bg-slate-50 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center sm:mb-20">
          <h2 className="mb-4 flex items-center justify-center gap-2.5 text-sm font-black uppercase tracking-widest text-blue-600">
            <span className="h-0.5 w-8 bg-blue-600" />
            Our Clubs
            <span className="h-0.5 w-8 bg-blue-600" />
          </h2>
          <h3 className="mb-6 text-4xl font-black leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
            Discover a world of opportunities.
          </h3>
          <p className="text-lg font-medium leading-relaxed text-slate-600">
            Join one of our 7 distinct clubs to learn, grow, and express yourself. Become
            part of a vibrant student community at Abhiruchi.
          </p>
        </Reveal>

        {/* Hovering the grid slows the page scroll so individual card
            hover states are actually reachable. */}
        <div
          onMouseEnter={() => setHoverSlow(true)}
          onMouseLeave={() => setHoverSlow(false)}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {clubs.map((club, index) => (
            <ClubCard key={club.id} club={club} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────── */

function CTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-slate-900 py-20 sm:py-28 lg:py-32"
    >
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.16),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:48px_48px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 backdrop-blur-md">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Ready to join the movement?</span>
          </div>
          <h2 className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Journey Starts Here
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl">
            Don&apos;t just watch from the sidelines. Pick a club, show up, and start building
            the skills, friendships, and memories that define your university years.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#clubs"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-slate-900 shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Explore All Clubs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.07] px-8 py-3.5 font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
            >
              Contact Us
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function ClubPage() {
  // The list is read from the API so admin edits appear immediately. The
  // static seed in lib/clubs.ts is the fallback if the API is unreachable.
  const { clubs } = useClubs();

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      <Hero clubs={clubs} />
      <About />
      <ClubGrid clubs={clubs} />
      <CTA />
    </div>
  );
}
