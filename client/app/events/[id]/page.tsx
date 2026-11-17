'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Clock,
  FileText,
  MapPin,
  Share2,
  Ticket,
  User,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvertisEvent } from '@/types';
import { eventApi } from '@/lib/api';

// Mirror of the server-side sanitizer for defense-in-depth before the
// admin-authored HTML is injected into the page.
const sanitizeHtml = (input: string) => {
  if (!input) return '';
  return String(input)
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|link|meta|base)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|select|textarea|link|meta|base)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*("\s*data:(?!image\/)[^"]*"|'\s*data:(?!image\/)[^']*')/gi, '$1="#"')
    .trim();
};

function eventStart(event: InvertisEvent): number | null {
  if (!event.startDate) return null;
  const d = new Date(event.startDate);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<InvertisEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEvent = async () => {
    if (!params?.id) return;
    setLoading(true);
    setFetchFailed(false);
    try {
      const response = await eventApi.getById(params.id as string);
      if (response.success && response.data) {
        setEvent(response.data);
      } else {
        setEvent(null);
      }
    } catch {
      setFetchFailed(true);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-slate-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  // ── Fetch error (network/server) ───────────────────────────────────
  if (!event && fetchFailed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
          <p className="text-xs text-slate-500">We couldn&apos;t load this event. Check your connection and try again.</p>
          <Button
            onClick={fetchEvent}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────
  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <AlertCircle className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500">
            The event you are looking for may have been moved, unpublished, or never existed.
          </p>
          <Link href="/events">
            <Button className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const start = eventStart(event);
  const upcoming = start !== null ? start >= new Date(new Date().setHours(0, 0, 0, 0)).getTime() : null;
  const registrationOpen = event.registrationOpen !== false;
  const regUrl = event.registrationUrl?.trim();
  const richContent = event.content ? sanitizeHtml(event.content) : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      {/* ── Hero cover ─────────────────────────────────────────────── */}
      <div className="relative h-[40vh] w-full overflow-hidden bg-slate-950 sm:h-[45vh]">
        <Image
          src={event.image}
          alt={event.title}
          fill
          priority
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-6 z-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <button
              onClick={() => router.push('/events')}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all hover:bg-black/80"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </button>

            <button
              onClick={handleShare}
              className="relative rounded-full border border-white/10 bg-black/60 p-2.5 text-zinc-200 shadow-md backdrop-blur-md transition-all hover:bg-black/85 hover:text-white"
              title="Copy Link"
              aria-label="Copy link to this event"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {copied && (
                <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white shadow">
                  Link copied!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-none bg-indigo-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
                {event.category === 'Annual Fest' ? 'Annual Fest' : event.category}
              </Badge>
              {upcoming !== null && (
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    upcoming ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/80'
                  }`}
                >
                  {upcoming ? 'Upcoming' : 'Past event'}
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md">
                Organized by {event.organizer}
              </span>
            </div>
            <h1 className="text-3xl font-black leading-none tracking-tight text-white drop-shadow-sm sm:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
            {/* Poster */}
            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <img
                src={event.image}
                alt={`${event.title} poster`}
                className="max-h-[550px] w-full rounded-xl object-contain shadow-sm"
              />
            </div>

            {/* About */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 sm:text-2xl">
                <BookOpen className="h-5 w-5 text-indigo-600" /> About the Event
              </h2>
              {richContent ? (
                <div
                  className="prose-editor text-sm leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={{ __html: richContent }}
                />
              ) : (
                <>
                  <p className="text-sm font-medium leading-relaxed text-slate-600">{event.description}</p>
                  <div className="space-y-3 pt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {event.longDescription
                      .split('\n\n')
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                </>
              )}
            </div>

            {event.timeline.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 sm:text-2xl">
                    <Clock className="h-5 w-5 text-indigo-600" /> Event Timeline
                  </h2>
                  <div className="ml-3 space-y-6 border-l border-indigo-100 py-2 pl-6">
                    {event.timeline.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute left-[-31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 ring-4 ring-indigo-50" />
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {event.rules.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 sm:text-2xl">
                    <FileText className="h-5 w-5 text-indigo-600" /> Guidelines &amp; Rules
                  </h2>
                  <ul className="list-none space-y-3">
                    {event.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Register card */}
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-950">Registration</h3>
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    registrationOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {registrationOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              {registrationOpen ? (
                <>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Secure your spot for {event.title}. {regUrl ? 'Registration is handled through the official link.' : 'Reach out to us and we will connect you with the organizers.'}
                  </p>
                  <a
                    href={regUrl || '/contact'}
                    target={regUrl?.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    <Ticket className="h-4 w-4" />
                    {regUrl ? 'Register Now' : 'Contact Organizers'}
                  </a>
                </>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    Registrations for this event are closed. Follow the events page for the next edition.
                  </p>
                </div>
              )}
            </div>

            {/* Quick facts */}
            <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Quick Details</h3>
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <Calendar className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-slate-700">Date</h4>
                    <p className="font-medium text-slate-500">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <Clock className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-slate-700">Time</h4>
                    <p className="font-medium text-slate-500">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-slate-700">Venue</h4>
                    <p className="font-medium text-slate-500">{event.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <User className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-slate-700">Organizer</h4>
                    <p className="font-medium text-slate-500">{event.organizer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
