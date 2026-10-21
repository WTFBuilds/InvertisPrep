'use client';

import { use, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Mail,
  Clock,
  Target,
  Eye,
  Sparkles,
  Check,
  ChevronRight,
  X,
  Ticket,
  Quote,
  Minus,
  Plus,
  Loader2,
  CalendarCheck,
  CircleCheck,
  AlertCircle,
} from 'lucide-react';
import { CLUB_LIST, clubIcon, type Club as ClubModel } from '@/lib/clubs';
import { useClub, useClubs } from '@/hooks/use-clubs';
import { clubApi } from '@/lib/api';
import { useSmoothScroll } from '@/components/layout/SmoothScrollProvider';
import { Card, CardContent } from '@/components/ui/card';

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  amount = 0.12,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount, margin: '0px 0px -8% 0px' });

  const hidden =
    direction === 'left'
      ? { opacity: 0, x: -40 }
      : direction === 'right'
        ? { opacity: 0, x: 40 }
        : { opacity: 0, y: 40 };

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : hidden}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── RSVP modal ────────────────────────────────────────────────────── */

type RsvpState = 'idle' | 'submitting' | 'done' | 'error';

function RsvpModal({
  clubId,
  clubName,
  eventId,
  eventTitle,
  onClose,
  onRegistered,
}: {
  clubId: string;
  clubName: string;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onRegistered?: () => void;
}) {
  const { lock, unlock } = useSmoothScroll();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [studentNote, setStudentNote] = useState('');
  const [waitlisted, setWaitlisted] = useState(false);
  const [state, setState] = useState<RsvpState>('idle');
  const [error, setError] = useState('');

  // Lock page scroll while the modal is open.
  useEffect(() => {
    lock();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlock();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email so we can confirm your seat.');
      return;
    }
    setError('');
    setState('submitting');

    try {
      const res = await clubApi.register(clubId, {
        eventId,
        name: name.trim(),
        email: email.trim(),
        branch: branch.trim() || undefined,
        year: year || undefined,
        interests,
        studentNote: studentNote.trim() || undefined,
      });

      if (res.success) {
        setState('done');
        setWaitlisted(!!(res as { waitlisted?: boolean }).waitlisted);
        // The seat count on the page is now stale — refresh the club so
        // the "seats left" figure updates.
        onRegistered?.();
        return;
      }

      // A duplicate registration is reported rather than silently
      // swallowed, so the student learns the truth.
      setState('error');
      setError(res.message || 'We could not save your registration.');
    } catch (err: any) {
      setState('error');
      setError(
        err.response?.data?.message ||
          'Something went wrong. Please try again or email us directly.'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`RSVP for ${eventTitle}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="relative border-b border-slate-100 px-7 pb-5 pt-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Ticket className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {clubName} · Registration
              </p>
              <h3 className="text-lg font-black leading-tight tracking-tight text-slate-900">
                {eventTitle}
              </h3>
            </div>
          </div>
        </div>

        <div className="px-7 py-6">
          {state === 'done' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="py-4 text-center"
            >
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                  waitlisted ? 'bg-violet-100' : 'bg-emerald-100'
                }`}
              >
                {waitlisted ? (
                  <Clock className="h-8 w-8 text-violet-600" />
                ) : (
                  <CircleCheck className="h-8 w-8 text-emerald-600" />
                )}
              </div>
              <h4 className="mt-5 text-xl font-black text-slate-900">
                {waitlisted ? "You're on the waitlist" : "You're on the list"}
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-600">
                {waitlisted ? (
                  <>
                    This event is full, so we&apos;ve added you to the waitlist for{' '}
                    <strong className="text-slate-800">{eventTitle}</strong>. If somebody
                    cancels, the next person on the list is promoted automatically and we
                    will email you at <strong className="text-slate-800">{email}</strong>.
                  </>
                ) : (
                  <>
                    Thanks {name.split(' ')[0]}. We&apos;ve noted your interest in{' '}
                    <strong className="text-slate-800">{eventTitle}</strong>. The club team
                    will email you at <strong className="text-slate-800">{email}</strong>{' '}
                    with the joining details and venue instructions.
                  </>
                )}
              </p>
              <button
                onClick={onClose}
                className="mt-7 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-black text-white transition-colors hover:bg-slate-700"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">{error}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-slate-700">
                    Full name *
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-slate-700">
                    Email *
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-slate-700">
                    Branch
                  </span>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-slate-700">
                    Year of study
                  </span>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="other">Postgraduate / Other</option>
                  </select>
                </label>
              </div>

              <div>
                <span className="mb-2 block text-[13px] font-bold text-slate-700">
                  How would you like to take part?
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Perform', 'Organise', 'Volunteer', 'Attend & support', 'Just curious'].map(
                    (option) => {
                      const active = interests.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleInterest(option)}
                          className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="rsvp-note"
                  className="mb-2 block text-[13px] font-bold text-slate-700"
                >
                  Anything the club should know? (optional)
                </label>
                <textarea
                  id="rsvp-note"
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Scheduling clashes, accessibility needs, or what you would like to contribute…"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={state === 'submitting'}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
                >
                  {state === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving…
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4" />
                      Confirm my seat
                    </>
                  )}
                </button>
              </div>

              <p className="pt-1 text-center text-[11px] font-medium text-slate-400">
                This registers your interest. The club team confirms the final seat by email.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── FAQ accordion ─────────────────────────────────────────────────── */

function FaqList({
  items,
  color,
}: {
  items: { question: string; answer: string }[];
  color: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-4 px-5 py-4.5 text-left transition-colors hover:bg-slate-50 sm:px-6"
              aria-expanded={isOpen}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-black text-slate-500">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-[15px] font-bold leading-snug text-slate-800">
                {item.question}
              </span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{
                  background: isOpen ? color : '#f1f5f9',
                }}
              >
                {isOpen ? (
                  <Minus className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                )}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 pl-16 pr-6 text-sm font-medium leading-relaxed text-slate-600 sm:px-6 sm:pl-[4.25rem]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  // The club is read from the API so admin edits appear immediately; the
  // static seed in lib/clubs.ts is the fallback if the API is unreachable.
  const { club, isLoading, refresh } = useClub(clubId);
  const { clubs: allClubs } = useClubs();
  const [activeEvent, setActiveEvent] = useState(0);
  const [rsvpOpen, setRsvpOpen] = useState(false);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 100]);
  const heroFade = useTransform(scrollY, [0, 450], [1, 0.3]);
  const logoY = useTransform(scrollY, [0, 600], [0, 50]);
  const logoScale = useTransform(scrollY, [0, 600], [1, 0.88]);

  if (isLoading && !club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">Club Not Found</h1>
          <p className="mt-2 text-slate-500">
            We couldn&apos;t find a club with that name. Browse all seven instead.
          </p>
          <Link
            href="/club"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to clubs
          </Link>
        </div>
      </div>
    );
  }

  // The API model treats every list and string as optional, because an
  // admin can clear any section. Normalising once here keeps the rest of
  // the page free of undefined checks.
  const Icon = clubIcon(club.icon);
  const otherClubs = allClubs.filter((c) => c.id !== club.id).slice(0, 3);
  const stats = club.stats ?? [];
  const highlights = club.highlights ?? [];
  const wings = club.wings ?? [];
  const activities = club.activities ?? [];
  const team = club.team ?? [];
  const achievements = club.achievements ?? [];
  const testimonials = club.testimonials ?? [];
  const faqs = club.faqs ?? [];
  const logistics = club.logistics ?? [];
  const joinProcess = club.joinProcess ?? [];
  const events = club.events ?? [];
  const event = events[activeEvent] || events[0];
  const fillPercent =
    event && event.seats ? Math.round(((event.seats - (event.seatsLeft ?? 0)) / event.seats) * 100) : 0;
  const color = club.color || '#3B82F6';
  const colorDark = club.colorDark || '#1D4ED8';
  const colorLight = club.colorLight || '#EFF6FF';
  const gradient = club.gradient || 'from-blue-500 via-indigo-600 to-cyan-500';
  const coordinator = club.coordinator || '';
  const coordinatorRole = club.coordinatorRole || 'Faculty Coordinator';
  const coordinatorNote = club.coordinatorNote || '';

  return (
    <div
      className="min-h-screen bg-slate-50 font-sans selection:text-white"
      style={{ ['--club' as string]: color }}
    >
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} aria-hidden />
        <div className="absolute inset-0 bg-black/35" aria-hidden />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:44px_44px]"
          aria-hidden
        />
        <div
          className="absolute -left-24 -top-24 aspect-square w-[38rem] rounded-full opacity-40 blur-3xl"
          style={{ background: color }}
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -right-16 aspect-square w-[34rem] rounded-full opacity-30 blur-3xl"
          style={{ background: colorDark }}
          aria-hidden
        />

        <motion.div style={{ y: heroY, opacity: heroFade }} className="relative z-10">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-28">
            <Link
              href="/club"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-md transition-all hover:bg-black/30 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              All clubs
            </Link>

            <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
                style={{ y: logoY, scale: logoScale }}
                className="order-1 flex justify-center lg:order-2 lg:col-span-5 lg:justify-end"
              >
                <div className="relative h-44 w-44 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
                  <div
                    className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/25 bg-white/95 p-7 shadow-2xl shadow-black/30 backdrop-blur-sm">
                    <Image
                      src={club.img || '/images/panache.png'}
                      alt={club.name}
                      fill
                      priority
                      className="object-contain drop-shadow-md"
                      sizes="(max-width: 640px) 176px, (max-width: 1024px) 224px, 256px"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="order-2 text-center lg:order-1 lg:col-span-7 lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md sm:text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {club.tagline}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
                >
                  {club.name}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/85 sm:text-lg lg:mx-0"
                >
                  {club.shortDescription}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                >
                  <a
                    href="#events"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    Upcoming events
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a
                    href="#join"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    How to join
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAND ─────────────────────────────────────────────── */}
      <section className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-5">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm sm:px-5 sm:py-5">
                <div className="text-2xl font-black tracking-tight sm:text-4xl" style={{ color: color }}>
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal direction="left" className="lg:col-span-7">
              <span
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                style={{ color: color }}
              >
                <span className="h-0.5 w-8" style={{ background: color }} />
                About the club
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {club.name} is more than a student club.
              </h2>
              <p className="mt-6 text-lg font-medium leading-relaxed text-slate-600">
                {club.longDescription}
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <Reveal delay={0.1}>
                  <div
                    className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="h-5 w-5" style={{ color: color }} />
                      <h3 className="font-black uppercase tracking-wider text-slate-900">
                        Our mission
                      </h3>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                      {club.mission}
                    </p>
                  </div>
                </Reveal>
                <Reveal delay={0.2}>
                  <div
                    className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    style={{ borderTop: `3px solid ${colorDark}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Eye className="h-5 w-5" style={{ color: colorDark }} />
                      <h3 className="font-black uppercase tracking-wider text-slate-900">
                        Our vision
                      </h3>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                      {club.vision}
                    </p>
                  </div>
                </Reveal>
              </div>
            </Reveal>

            {/* Sidebar: highlights, wings, coordinator */}
            <Reveal direction="right" className="lg:col-span-5">
              <div className="space-y-5">
                <div
                  className="rounded-3xl border border-slate-200 p-7 shadow-sm"
                  style={{ background: colorLight }}
                >
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
                    What we do
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {highlights.map((highlight, i) => (
                      <motion.li
                        key={highlight}
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.45, delay: i * 0.07 }}
                        className="flex items-start gap-3 rounded-xl bg-white/80 px-3.5 py-3 shadow-sm"
                      >
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: color }}
                        >
                          <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                        </span>
                        <span className="text-sm font-bold text-slate-800">{highlight}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Wings / sub-groups */}
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Internal structure
                  </h3>
                  <div className="mt-5 space-y-4">
                    {wings.map((wing) => (
                      <div key={wing.name} className="border-l-2 pl-4" style={{ borderColor: color }}>
                        <p className="text-sm font-black text-slate-900">{wing.name}</p>
                        <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-500">
                          {wing.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coordinator */}
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black text-white"
                    style={{ background: color }}
                  >
                    {coordinator.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {coordinatorRole}
                    </p>
                    <p className="truncate font-black text-slate-900">{coordinator}</p>
                    <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">
                      {coordinatorNote}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ─────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              What we do all year
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Activities &amp; programmes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
              Regular, low-pressure ways to get involved — with enough structure that you
              actually build something by the end of it.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {activities.map((activity, i) => (
              <Reveal key={activity.title} delay={(i % 2) * 0.08}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ background: color }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {activity.title}
                      </h3>
                      <p
                        className="mt-1.5 text-[11px] font-black uppercase tracking-wider"
                        style={{ color: color }}
                      >
                        {activity.cadence}
                      </p>
                      <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-600">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS + RSVP ──────────────────────────────────────────── */}
      <section id="events" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              Calendar
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Upcoming events
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
              {events.length} events scheduled. Registration is open to all InvertisPrep
              students — first-timers especially welcome.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-12">
            {/* Event list */}
            <div className="space-y-4 lg:col-span-7">
              {events.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-white/70">
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">No events scheduled</p>
                    <p className="max-w-sm text-sm text-slate-500">
                      The club has not announced any events yet. Check back soon.
                    </p>
                  </CardContent>
                </Card>
              ) : (
              events.map((ev, i) => {
                const isActive = activeEvent === i;
                return (
                  <Reveal key={ev.title} delay={i * 0.08}>
                    <button
                      type="button"
                      onClick={() => setActiveEvent(i)}
                      className={`group flex w-full flex-col gap-5 rounded-2xl border p-5 text-left transition-all duration-300 sm:flex-row sm:items-start sm:p-6 ${
                        isActive
                          ? 'border-transparent bg-white shadow-lg'
                          : 'border-slate-200 bg-white/60 shadow-sm hover:border-slate-300 hover:bg-white hover:shadow-md'
                      }`}
                      style={isActive ? { borderLeft: `4px solid ${color}` } : undefined}
                      aria-expanded={isActive}
                    >
                      <div
                        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl transition-colors"
                        style={{ background: isActive ? color : colorLight }}
                      >
                        <span
                          className="text-xs font-black uppercase tracking-wider"
                          style={{ color: isActive ? '#fff' : color }}
                        >
                          {ev.month}
                        </span>
                        <span
                          className="text-xl font-black leading-none"
                          style={{ color: isActive ? '#fff' : colorDark }}
                        >
                          {ev.day}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                            style={{ background: colorLight, color: colorDark }}
                          >
                            {ev.category}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {ev.seatsLeft} of {ev.seats} seats left
                          </span>
                        </div>
                        <h3
                          className="mt-2 text-lg font-black leading-snug tracking-tight text-slate-900"
                          style={isActive ? { color: colorDark } : undefined}
                        >
                          {ev.title}
                        </h3>
                        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600">
                          {ev.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" style={{ color: color }} />
                            {ev.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" style={{ color: color }} />
                            {ev.venue}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        className={`hidden h-5 w-5 shrink-0 transition-all duration-300 sm:block ${
                          isActive
                            ? 'translate-x-0 opacity-100'
                            : '-translate-x-1 opacity-40 group-hover:translate-x-0 group-hover:opacity-70'
                        }`}
                        style={{ color: color }}
                      />
                    </button>
                  </Reveal>
                );
              })
              )}
            </div>

            {/* Event detail / RSVP */}
            <Reveal direction="right" className="lg:col-span-5">
              <div className="sticky top-24 space-y-5">
                <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                  <div className={`bg-gradient-to-br ${gradient} p-7 text-white`}>
                    <p className="text-xs font-black uppercase tracking-widest text-white/80">
                      {event.category}
                    </p>
                    <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight">
                      {event.title}
                    </h3>
                  </div>

                  <div className="bg-white p-7">
                    <dl className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: color }} />
                        <div>
                          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Date
                          </dt>
                          <dd className="text-sm font-bold text-slate-900">
                            {event.month} {event.day}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: color }} />
                        <div>
                          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Time
                          </dt>
                          <dd className="text-sm font-bold text-slate-900">{event.time}</dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: color }} />
                        <div>
                          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Venue
                          </dt>
                          <dd className="text-sm font-bold text-slate-900">{event.venue}</dd>
                        </div>
                      </div>
                    </dl>

                    {/* Seats */}
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Seats filled</span>
                        <span style={{ color: colorDark }}>
                          {(event.seats ?? 0) - (event.seatsLeft ?? 0)} / {(event.seats ?? 0)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${fillPercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                        {(event.seatsLeft ?? 0)} seats still open · RSVP closes {event.rsvpDeadline}
                      </p>
                    </div>

                    {/* Audience note */}
                    <p className="mt-5 rounded-xl bg-slate-50 p-3.5 text-[13px] font-medium leading-relaxed text-slate-600">
                      <strong className="text-slate-800">Who it&apos;s for:</strong>{' '}
                      {event.audience}
                    </p>

                    {/* Agenda */}
                    <div className="mt-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Run of show
                      </h4>
                      <ol className="mt-3 space-y-2.5">
                        {(event.agenda ?? []).map((step, i) => (
                          <li key={step} className="flex gap-3 text-[13px] font-medium text-slate-600">
                            <span
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black"
                              style={{ background: `${color}1a`, color: colorDark }}
                            >
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Perks */}
                    <div className="mt-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        What you get
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(event.perks ?? []).map((perk) => (
                          <span
                            key={perk}
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: colorLight, color: colorDark }}
                          >
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setRsvpOpen(true)}
                      disabled={!event || event.registrationOpen === false}
                      className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      style={{ background: color }}
                    >
                      <Ticket className="h-4 w-4" />
                      {event?.registrationOpen === false
                        ? 'Registration closed'
                        : 'RSVP for this event'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── LOGISTICS ──────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              The practical details
            </h2>
            <p className="mt-2 font-medium text-slate-500">
              Everything you need to know before you turn up.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logistics.map((item, i) => (
              <Reveal key={item.label} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-900">
                    {item.value}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACHIEVEMENTS ──────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              Track record
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Achievements &amp; milestones
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {achievements.map((achievement, i) => (
              <Reveal key={achievement.title} delay={(i % 2) * 0.08}>
                <div
                  className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: colorLight, color: colorDark }}
                      >
                        {achievement.kind}
                      </span>
                      <h3 className="mt-3 text-lg font-black leading-snug tracking-tight text-slate-900">
                        {achievement.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                        {achievement.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-slate-300">
                      {achievement.year}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              In their words
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              From our members
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, i) => (
              <Reveal key={testimonial.name} delay={i * 0.1}>
                <figure className="relative h-full rounded-3xl border border-slate-200 bg-slate-50 p-7">
                  <Quote
                    className="absolute right-6 top-6 h-8 w-8 opacity-15"
                    style={{ color: color }}
                  />
                  <blockquote className="relative text-[15px] font-medium leading-relaxed text-slate-700">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3.5 border-t border-slate-200 pt-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
                      style={{ background: color }}
                    >
                      {testimonial.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-900">
                        {testimonial.name}
                      </span>
                      <span className="block text-xs font-medium text-slate-500">
                        {testimonial.detail}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              The people
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Council &amp; core team
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
              A council elected by the members each semester, supported by a faculty
              coordinator who keeps the club on track.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {team.map((member, i) => (
              <Reveal key={member.role} delay={(i % 5) * 0.06}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{ background: color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <p
                    className="mt-4 text-[10px] font-black uppercase tracking-widest"
                    style={{ color: color }}
                  >
                    {member.role}
                  </p>
                  <p className="mt-1 font-black text-slate-900">{member.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{member.branch}</p>
                  <p className="mt-2 text-[11px] font-medium italic leading-snug text-slate-400">
                    {member.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-12 text-center">
            <a
              href={`mailto:support@invertisprep.in?subject=${encodeURIComponent(`Contact ${club.name} club`)}`}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <Mail className="h-4 w-4" />
              Contact the team
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── JOIN PROCESS ──────────────────────────────────────────── */}
      <section id="join" className="scroll-mt-24 border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              Getting involved
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              How to join {club.name}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
              Four steps, no audition, no gatekeeping. Everything below is free for students.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {joinProcess.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span
                    className="absolute -top-4 left-6 rounded-lg px-2.5 py-1 text-xs font-black tracking-wider text-white shadow-sm"
                    style={{ background: color }}
                  >
                    {step.step}
                  </span>
                  <h3 className="mt-3 font-black tracking-tight text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15} className="mt-12 text-center">
            <button
              onClick={() => setRsvpOpen(true)}
              className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ background: color }}
            >
              <Ticket className="h-4 w-4" />
              Register your interest
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              style={{ color: color }}
            >
              <span className="h-0.5 w-8" style={{ background: color }} />
              Questions
              <span className="h-0.5 w-8" style={{ background: color }} />
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked
            </h2>
          </Reveal>

          <div className="mt-10">
            <FaqList items={faqs} color={color} />
          </div>
        </div>
      </section>

      {/* ── OTHER CLUBS ───────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Explore other clubs
            </h2>
            <p className="mt-2 font-medium text-slate-500">
              Seven communities, one organisation. Most students join more than one.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {otherClubs.map((other, i) => (
              <Reveal key={other.id} delay={i * 0.08}>
                <Link
                  href={`/club/${other.id}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="relative h-16 w-16 shrink-0">
                    <Image
                      src={other.img || '/images/panache.png'}
                      alt={other.name}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-110"
                      sizes="64px"
                      placeholder="blur"
                      blurDataURL={BLUR}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black tracking-tight text-slate-900">
                      {other.name}
                    </p>
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: other.color }}
                    >
                      {other.tagline}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-700" />
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15} className="mt-10 text-center">
            <Link
              href="/club"
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-xl"
            >
              <Users className="h-4 w-4" />
              View all 7 clubs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── RSVP MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {rsvpOpen && (
          <RsvpModal
            clubId={club.id}
            clubName={club.name}
            eventId={event._id || ''}
            eventTitle={event.title}
            onClose={() => setRsvpOpen(false)}
            onRegistered={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
