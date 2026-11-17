'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  Sparkles,
  Ticket,
  Megaphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShinyButton } from '@/components/ui/shiny-button';
import { eventApi } from '@/lib/api';
import { InvertisEvent } from '@/types';

const TIMING_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
] as const;

type TimingFilter = (typeof TIMING_FILTERS)[number]['value'];

function eventStart(event: InvertisEvent): number | null {
  if (!event.startDate) return null;
  const d = new Date(event.startDate);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function isUpcoming(event: InvertisEvent): boolean {
  const start = eventStart(event);
  if (start === null) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start >= today.getTime();
}

export default function EventsPage() {
  const [events, setEvents] = useState<InvertisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timing, setTiming] = useState<TimingFilter>('all');

  const railRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventApi.getAll();
      setEvents(response.data || []);
    } catch {
      setError('Could not load events right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Featured events drive the billboard; fall back to the newest events so
  // the slider is never empty on a fresh install without featured picks.
  const billboardEvents = useMemo(() => {
    const featured = events.filter((e) => e.featured);
    return featured.length > 0 ? featured : events.slice(0, 6);
  }, [events]);

  const activeEvent = billboardEvents[activeIndex] || billboardEvents[0];

  // Categories derived from the real data so the filter never shows empty tabs.
  const categories = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
    return [
      { value: 'all', label: 'All Events' },
      ...unique.map((c) => ({
        value: c,
        label:
          c === 'Annual Fest'
            ? 'Annual Fest'
            : c.charAt(0).toUpperCase() + c.slice(1),
      })),
    ];
  }, [events]);

  const hasAnyDates = useMemo(() => events.some((e) => eventStart(e) !== null), [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => isUpcoming(e))
        .sort((a, b) => (eventStart(a) ?? 0) - (eventStart(b) ?? 0)),
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
        if (timing !== 'all') {
          const start = eventStart(event);
          if (start === null) return false;
          if (timing === 'upcoming' && !isUpcoming(event)) return false;
          if (timing === 'past' && isUpcoming(event)) return false;
        }
        const q = searchQuery.toLowerCase();
        return (
          !q ||
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.organizer.toLowerCase().includes(q)
        );
      }),
    [events, selectedCategory, timing, searchQuery]
  );

  const handlePrev = useCallback(() => {
    if (billboardEvents.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? billboardEvents.length - 1 : prev - 1));
  }, [billboardEvents.length]);

  const handleNext = useCallback(() => {
    if (billboardEvents.length === 0) return;
    setActiveIndex((prev) => (prev === billboardEvents.length - 1 ? 0 : prev + 1));
  }, [billboardEvents.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchStartY.current === null || touchEndX.current === null || touchEndY.current === null)
      return;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
  };

  useEffect(() => {
    if (billboardEvents.length <= 1) return;
    const timer = setInterval(() => handleNext(), 6000);
    return () => clearInterval(timer);
  }, [activeIndex, billboardEvents.length, handleNext]);

  const scrollRail = (direction: 'left' | 'right') => {
    railRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="w-full aspect-[21/9] max-h-[520px] animate-pulse bg-slate-200" />
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-video animate-pulse bg-slate-200" />
                <div className="space-y-2.5 p-4">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error && events.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Events unavailable</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <Button
            onClick={fetchEvents}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const registerHref = activeEvent?.registrationUrl?.trim() || '/contact';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Billboard ─────────────────────────────────────────────── */}
      <div className="relative w-full">
        <div
          className="relative flex w-full aspect-[21/9] min-h-[380px] items-end bg-slate-900 sm:min-h-[500px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeEvent && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeEvent.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeEvent.image}
                    alt={activeEvent.title}
                    fill
                    priority
                    className="object-cover object-center"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Chevrons */}
              <button
                onClick={handlePrev}
                aria-label="Previous event"
                className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white transition-all duration-300 hover:bg-slate-900 sm:block"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next event"
                className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white transition-all duration-300 hover:bg-slate-900 sm:block"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Top badges */}
              <div className="absolute left-6 top-6 z-30 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  Featured
                </Badge>
                <Badge className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {activeEvent.organizer}
                </Badge>
              </div>

              {/* Content */}
              <div className="relative z-20 w-full max-w-7xl space-y-4 px-6 pb-14 pt-10 text-left sm:px-12 sm:pb-20 md:px-16">
                <motion.div
                  key={`text-${activeEvent.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-3"
                >
                  <h1 className="text-3xl font-black leading-none tracking-tight text-white sm:text-5xl md:text-6xl">
                    {activeEvent.title}
                  </h1>
                  <p className="max-w-xl text-xs font-medium leading-relaxed text-zinc-200 sm:text-base">
                    {activeEvent.description}
                  </p>
                </motion.div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-xs text-zinc-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    <span className="font-semibold text-white">{activeEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-300" />
                    <span>{activeEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-300" />
                    <span>{activeEvent.venue}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    asChild
                    className="rounded-xl bg-indigo-600 px-6 py-5 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700"
                  >
                    <Link href={`/events/${activeEvent.id}`}>
                      View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  {activeEvent.registrationOpen !== false && (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl border-white/20 bg-transparent px-6 py-5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      <a href={registerHref} target={registerHref.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                        <Ticket className="mr-1.5 h-3.5 w-3.5" /> Register Now
                      </a>
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-xl border-white/20 bg-transparent px-6 py-5 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Schedule &amp; Rules
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl rounded-3xl border-slate-200 bg-white text-slate-900">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-950">
                          {activeEvent.title} — Handbook
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                          Complete guidelines and schedule for the event.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="scrollbar-thin mt-2 max-h-[60vh] space-y-5 overflow-y-auto pr-2">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About</h4>
                          <p className="text-xs leading-relaxed text-slate-600">{activeEvent.longDescription}</p>
                        </div>
                        {activeEvent.timeline.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline</h4>
                            <div className="ml-1 space-y-1.5 border-l border-slate-200 pl-4">
                              {activeEvent.timeline.map((t, idx) => (
                                <div key={idx} className="relative flex items-center gap-2">
                                  <div className="absolute left-[-21px] h-2 w-2 rounded-full bg-indigo-600" />
                                  <span className="text-xs text-slate-700">{t}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {activeEvent.rules.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rules</h4>
                            <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">
                              {activeEvent.rules.map((r, idx) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Dots */}
              <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-3">
                {billboardEvents.map((ev, idx) => (
                  <button
                    key={ev.id}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === idx ? 'w-8 bg-indigo-500' : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {billboardEvents.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-3 p-8 text-center text-slate-300">
              <CalendarDays className="h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold text-white">No events to showcase yet</h3>
              <p className="max-w-xs text-xs text-slate-400">
                New campus events will appear here as soon as they are announced.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {/* Upcoming rail */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                  <Megaphone className="h-5 w-5 text-indigo-600" /> Happening Next
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">The next events on the campus calendar.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollRail('left')}
                  aria-label="Scroll left"
                  className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollRail('right')}
                  aria-label="Scroll right"
                  className="rounded-full bg-slate-900 p-2.5 text-white shadow-sm transition-all hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              ref={railRef}
              className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pt-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex w-[260px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg sm:w-[300px]"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-emerald-500/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                      Upcoming
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {event.category === 'Annual Fest' ? 'Annual Fest' : event.category} • {event.organizer}
                    </p>
                    <h3 className="mt-1 truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {event.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] font-semibold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" /> {event.date}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Directory */}
        <div className="space-y-6 border-t border-slate-200 pt-8">
          {/* Category chips */}
          <div
            className="scrollbar-none flex w-full flex-nowrap items-center justify-start gap-3 overflow-x-auto px-1 sm:justify-center sm:gap-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat) => (
              <ShinyButton
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                isActive={selectedCategory === cat.value}
              >
                {cat.label}
              </ShinyButton>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">All Events</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
                {selectedCategory !== 'all' && ` in ${categories.find((c) => c.value === selectedCategory)?.label}`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {hasAnyDates && (
                <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  {TIMING_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTiming(f.value)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        timing === f.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-14 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No events match your filters</p>
              <p className="mt-1 text-xs text-slate-400">Try another category, timing or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.map((event) => {
                const upcoming = isUpcoming(event);
                return (
                  <div
                    key={event.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                  >
                    <Link href={`/events/${event.id}`} className="group block">
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 320px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                          <span className="rounded-lg bg-slate-900/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                            {event.date}
                          </span>
                          {event.featured && (
                            <span className="flex items-center gap-1 rounded-lg bg-indigo-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                              <Sparkles className="h-2.5 w-2.5" /> Featured
                            </span>
                          )}
                        </div>
                        {upcoming && (
                          <span className="absolute right-3 top-3 rounded-lg bg-emerald-500/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span className="truncate">
                            {event.category === 'Annual Fest' ? 'Annual Fest' : event.category}
                          </span>
                          <span>•</span>
                          <span className="truncate">{event.organizer}</span>
                        </div>
                        <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-indigo-600">
                          {event.title}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{event.description}</p>
                      </div>
                    </Link>

                    <div className="p-4 pt-0">
                      <div className="space-y-3 border-t border-slate-100 pt-3">
                        <div className="space-y-1.5 text-[11px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            asChild
                            size="sm"
                            className="h-9 flex-1 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            <Link href={`/events/${event.id}`}>
                              Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl border-slate-200 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Rules
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-3xl border-slate-200 bg-white text-slate-900">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-950">{event.title}</DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                  Guidelines and requirements.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-2 space-y-4">
                                <p className="text-xs leading-relaxed text-slate-600">{event.longDescription}</p>
                                {event.timeline.length > 0 && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline</h4>
                                    <ul className="space-y-1 pl-1 text-xs text-slate-600">
                                      {event.timeline.map((time, idx) => (
                                        <li key={idx} className="flex gap-2">
                                          <span className="text-indigo-600">•</span>
                                          <span>{time}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {event.rules.length > 0 && (
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rules</h4>
                                    <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">
                                      {event.rules.map((rule, idx) => (
                                        <li key={idx}>{rule}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          {event.registrationOpen !== false ? (
                            <a
                              href={event.registrationUrl?.trim() || '/contact'}
                              target={event.registrationUrl?.trim().startsWith('http') ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                            >
                              <Ticket className="h-3.5 w-3.5" /> Register open
                            </a>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">Registration closed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
