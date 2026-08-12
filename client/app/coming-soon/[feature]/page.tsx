'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { ArrowLeft, Check, Clock } from 'lucide-react';

// Feature catalog — each new "coming soon" feature gets its own entry
const FEATURES: Record<string, { title: string; tagline: string; description: string; features: string[]; icon: string }> = {
  'ats-score': {
    title: 'ATS Score Checker',
    tagline: 'Beat the resume robots',
    description:
      'Upload your resume and get an instant Applicant Tracking System (ATS) compatibility score. See exactly what keywords, formatting, and sections are hurting your chances before a human ever sees it.',
    features: [
      'Instant ATS compatibility score (0-100)',
      'Keyword match analysis against job descriptions',
      'Formatting & parsing checks',
      'Actionable, line-by-line suggestions',
    ],
    icon: '🎯',
  },
  'societies': {
    title: 'Clubs',
    tagline: 'Find your people on campus',
    description:
      'Browse every club and student body at Invertis University. See what they do, who runs them, when they meet, and how to join — all in one place.',
    features: [
      'Directory of all campus clubs',
      'Upcoming club events & recruitments',
      'Contact the team directly',
      'Follow clubs you care about',
    ],
    icon: '🤝',
  },
  'career': {
    title: 'Career Hub',
    tagline: 'Your next opportunity starts here',
    description:
      'Internships, full-time roles, hackathons, and workshops curated for Invertis students. Track deadlines, save opportunities, and apply directly.',
    features: [
      'Curated internships & jobs',
      'Hackathon & workshop listings',
      'Deadline reminders',
      'Application tracking',
    ],
    icon: '💼',
  },
  'events': {
    title: 'Campus Events',
    tagline: 'Never miss what\'s happening',
    description:
      'A unified calendar of every event at Invertis University — fests, talks, workshops, sports, and club activities. RSVP, add to your calendar, and get reminders.',
    features: [
      'Unified campus event calendar',
      'RSVP & reminders',
      'Filter by category & date',
      'Add to Google Calendar',
    ],
    icon: '🎉',
  },
  'leaderboard': {
    title: 'Leaderboard',
    tagline: 'Climb the ranks',
    description:
      'See where you stand among Invertis students. Earn points for uploads, contributions, quiz performance, and community activity.',
    features: [
      'Global & department rankings',
      'Points for contributions',
      'Weekly & all-time boards',
      'Badges & milestones',
    ],
    icon: '🏆',
  },
};

export default function ComingSoonPage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = use(params);
  const data = FEATURES[feature];

  // Unknown feature slug — fall back to a generic message
  if (!data) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <Spotlight className="absolute inset-x-0 top-0 h-80 overflow-hidden" />
        <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <GlowCard className="w-full rounded-2xl border-slate-200 bg-white p-8 text-center">
            <p className="text-5xl">🤔</p>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Page not found</h1>
            <p className="mt-2 text-sm text-slate-500">This feature doesn&apos;t exist.</p>
            <Link href="/" className="mt-6 inline-block">
              <Button variant="outline" className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back home
              </Button>
            </Link>
          </GlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to home
        </Link>

        <GlowCard className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_30px_-12px_rgba(15,23,42,0.08)]">
          {/* header */}
          <div className="px-6 pt-8 sm:px-10 sm:pt-10">
            <Badge variant="indigo" className="mb-5">
              <Clock className="mr-1 h-3 w-3" />
              Coming Soon
            </Badge>
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                {data.icon}
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{data.title}</h1>
                <p className="mt-1 text-slate-500">{data.tagline}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="px-6 pb-8 sm:px-10 sm:pb-10">
            <p className="leading-relaxed text-slate-600">{data.description}</p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="mb-3 font-semibold text-slate-900">What you&apos;ll get</p>
              <ul className="space-y-2.5">
                {data.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-8 text-center text-sm text-slate-400">
              We&apos;re working hard to ship this. Check back soon! 🚀
            </p>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
