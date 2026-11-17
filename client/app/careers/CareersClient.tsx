'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  Database,
  Globe,
  Headphones,
  MapPin,
  Megaphone,
  Palette,
  PenTool,
  Shield,
  Clapperboard,
  Terminal,
  TrendingUp,
  Users2,
  Award,
  Zap,
} from 'lucide-react';

type RoleType = 'creative' | 'technical' | 'support' | 'marketing';

interface Role {
  id: string;
  /** Slug the apply page's ?role= lookup expects (defaults to id) */
  param?: string;
  title: string;
  shortDescription: string;
  description: string;
  requirements: string[];
  skills: string[];
  type: RoleType;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: Role[] = [
  {
    id: 'canva-designer',
    title: 'Canva Designer',
    shortDescription: 'Create engaging visual content for social media, presentations, and marketing materials.',
    description: 'We are looking for creative individuals who can design eye-catching graphics using Canva. You will be responsible for creating social media posts, presentation slides, marketing collateral, and other visual assets that align with our brand identity.',
    requirements: [
      'Proficiency in Canva (free or Pro)',
      'Strong understanding of design principles (typography, color theory, layout)',
      'Ability to maintain brand consistency across all designs',
      'Creative portfolio showcasing previous work',
      'Good communication skills and ability to take feedback',
    ],
    skills: ['Canva', 'Typography', 'Color Theory', 'Layout Design', 'Brand Identity'],
    type: 'creative',
    icon: Palette,
  },
  {
    id: 'video-editor',
    title: 'Video Editor',
    shortDescription: 'Edit and produce high-quality video content for educational and promotional purposes.',
    description: 'Join our content team to edit educational videos, promotional content, and social media reels. You will work with raw footage to create polished, engaging videos that help students learn and grow.',
    requirements: [
      'Proficiency in video editing software (Premiere Pro, DaVinci Resolve, CapCut, or similar)',
      'Understanding of pacing, storytelling, and visual hierarchy',
      'Experience with motion graphics and text overlays',
      'Ability to work with audio (voiceover sync, background music, noise reduction)',
      'Portfolio or demo reel demonstrating editing skills',
    ],
    skills: ['Video Editing', 'Motion Graphics', 'Audio Sync', 'Color Grading', 'Storytelling'],
    type: 'creative',
    icon: Clapperboard,
  },
  {
    id: 'srt',
    param: 'support-and-resource-team-(srt)',
    title: 'Support and Resource Team (SRT)',
    shortDescription: 'Help students navigate the platform, resolve queries, and manage educational resources.',
    description: 'Be the first point of contact for our student community. You will assist users with platform navigation, answer academic queries, manage resource uploads, and ensure a smooth experience for all InvertisPrep users.',
    requirements: [
      'Strong communication and interpersonal skills',
      'Patient and empathetic approach to student queries',
      'Familiarity with InvertisPrep platform (or willingness to learn)',
      'Organizational skills for managing resources and schedules',
      'Available for scheduled shifts (hybrid/online)',
    ],
    skills: ['Communication', 'Problem Solving', 'Platform Knowledge', 'Resource Management', 'Student Support'],
    type: 'support',
    icon: Headphones,
  },
  {
    id: 'developers',
    title: 'Developers',
    shortDescription: 'Build and maintain the InvertisPrep platform — frontend, backend, and infrastructure.',
    description: 'Work on a modern tech stack (Next.js, React, Express, MongoDB, Redis) to build features that impact thousands of students. Contribute to frontend, backend, or full-stack development based on your strengths.',
    requirements: [
      'Proficiency in JavaScript/TypeScript and React/Next.js',
      'Experience with Node.js/Express and MongoDB',
      'Understanding of REST APIs, authentication, and database design',
      'Git version control and collaborative development workflow',
      'Portfolio or GitHub with relevant projects',
    ],
    skills: ['React', 'Next.js', 'Node.js', 'MongoDB', 'TypeScript', 'Git'],
    type: 'technical',
    icon: Code2,
  },
  {
    id: 'content-writer',
    title: 'Content Writer',
    shortDescription: 'Write educational content, blog posts, guides, and platform copy.',
    description: 'Create clear, engaging, and helpful content for students. This includes study guides, exam preparation tips, platform documentation, blog articles, and micro-copy for the product interface.',
    requirements: [
      'Excellent written English with strong grammar and style',
      'Ability to research and simplify complex academic topics',
      'Experience writing for students or educational audiences',
      'SEO basics and content structuring knowledge',
      'Writing samples or portfolio (blog, articles, academic writing)',
    ],
    skills: ['Content Writing', 'Research', 'SEO', 'Academic Writing', 'Editing'],
    type: 'creative',
    icon: PenTool,
  },
  {
    id: 'technical-support',
    title: 'Technical Support',
    shortDescription: 'Troubleshoot platform issues, manage deployments, and ensure system reliability.',
    description: 'Monitor platform health, respond to technical incidents, assist with deployments, and help maintain our infrastructure. Ideal for someone interested in DevOps, system administration, and backend reliability.',
    requirements: [
      'Basic Linux command line and server management',
      'Understanding of HTTP, APIs, and common web protocols',
      'Familiarity with monitoring tools and log analysis',
      'Problem-solving mindset and calm under pressure',
      'Willingness to learn cloud platforms (AWS, Vercel, Render)',
    ],
    skills: ['Linux', 'API Debugging', 'Monitoring', 'Cloud Basics', 'Incident Response'],
    type: 'technical',
    icon: Terminal,
  },
  {
    id: 'social-media-manager',
    title: 'Social Media Manager',
    shortDescription: 'Grow our social presence, engage with the community, and drive platform adoption.',
    description: 'Own our social media strategy across Instagram, LinkedIn, Twitter, and YouTube. Create content calendars, engage with followers, run campaigns, and analyze metrics to grow our student community.',
    requirements: [
      'Proven experience managing social media accounts',
      'Creative content ideation and copywriting skills',
      'Understanding of platform algorithms and best practices',
      'Basic design skills (Canva/Figma) for creating posts',
      'Analytics mindset with ability to track and report metrics',
    ],
    skills: ['Social Media Strategy', 'Content Creation', 'Community Management', 'Analytics', 'Copywriting'],
    type: 'marketing',
    icon: Megaphone,
  },
  {
    id: 'marketing',
    title: 'Marketing',
    shortDescription: 'Drive user acquisition, partnerships, and brand awareness for InvertisPrep.',
    description: 'Execute marketing campaigns, build partnerships with colleges and student communities, organize events, and analyze growth metrics. Help us reach more students who need quality educational resources.',
    requirements: [
      'Understanding of digital marketing fundamentals',
      'Experience with campaign planning and execution',
      'Strong networking and partnership-building skills',
      'Analytical mindset with data-driven decision making',
      'Creative thinking for growth experiments and initiatives',
    ],
    skills: ['Digital Marketing', 'Campaign Management', 'Partnerships', 'Analytics', 'Growth Strategy'],
    type: 'marketing',
    icon: TrendingUp,
  },
];

const TYPE_LABELS: Record<RoleType, string> = {
  creative: 'Creative',
  technical: 'Technical',
  support: 'Support',
  marketing: 'Marketing',
};

const TYPE_CHIP_STYLES: Record<RoleType, string> = {
  creative: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  technical: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  support: 'bg-blue-50 text-blue-700 border-blue-200',
  marketing: 'bg-amber-50 text-amber-700 border-amber-200',
};

const roleParam = (role: Role) => role.param ?? role.id;

export default function CareersClient() {
  const [filter, setFilter] = useState<RoleType | 'all'>('all');
  const visibleRoles = filter === 'all' ? ROLES : ROLES.filter(r => r.type === filter);

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Dot grid + brand glow, echoing the homepage texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 [background-image:radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-48 -right-32 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-300/30 via-purple-300/25 to-pink-300/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="ip-rise inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white/80 py-1.5 pl-3 pr-4 text-xs font-semibold uppercase tracking-widest text-gray-600 shadow-sm backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Hiring now · {ROLES.length} open roles
                </p>

                <h1 className="ip-rise mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-gray-950 [animation-delay:80ms] md:text-6xl lg:text-7xl">
                  Build the future of{' '}
                  <span className="text-purple-600">
                    student success.
                  </span>
                </h1>

                <p className="ip-rise mt-6 max-w-xl text-base leading-relaxed text-gray-600 [animation-delay:160ms] md:text-lg">
                  We&apos;re a student-first platform making quality educational resources
                  accessible to everyone. Small team, real ownership, and work that
                  thousands of students touch every day.
                </p>

                <div className="ip-rise mt-8 flex flex-col gap-3 sm:flex-row [animation-delay:240ms]">
                  <Link
                    href="#roles"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-gray-800"
                  >
                    View open roles
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                  <Link
                    href="#process"
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white/60 px-7 py-3 text-sm font-semibold text-gray-700 backdrop-blur transition-colors hover:border-gray-400 hover:text-gray-900"
                  >
                    Our hiring process
                  </Link>
                </div>

                <div className="ip-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 [animation-delay:320ms]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> Bareilly, UP
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4" aria-hidden="true" /> Hybrid-friendly
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users2 className="h-4 w-4" aria-hidden="true" /> Students first, always
                  </span>
                </div>
              </div>

              {/* Floating role index — real navigation, not decoration */}
              <div className="lg:col-span-5">
                <div className="ip-rise rounded-2xl border border-gray-200 bg-white/90 shadow-xl shadow-gray-200/60 backdrop-blur [animation-delay:200ms]">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">Open roles</p>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      {ROLES.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {ROLES.slice(0, 5).map((role) => {
                      const Icon = role.icon;
                      return (
                        <li key={role.id}>
                          <Link
                            href={`/careers/apply?role=${roleParam(role)}`}
                            className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-gray-50"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {role.title}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {TYPE_LABELS[role.type]}
                              </span>
                            </span>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-900" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href="#roles"
                    className="block border-t border-gray-100 px-5 py-3.5 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    See all {ROLES.length} roles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4">
            <StatItem value="8+" label="Open roles" />
            <StatItem value="50+" label="Team members" />
            <StatItem value="100K+" label="Students served" />
            <StatItem value="Hybrid" label="Work culture" />
          </div>
        </section>

        {/* ── Open positions ───────────────────────────────────────────── */}
        <section id="roles" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 md:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Open positions</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                Find where you fit.
              </h2>
              <p className="mt-3 text-gray-600">
                Every role is designed for impact. Pick one to see requirements and apply — takes about five minutes.
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:justify-end">
              {(['all', 'creative', 'technical', 'support', 'marketing'] as const).map((key) => {
                const count = key === 'all' ? ROLES.length : ROLES.filter(r => r.type === key).length;
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {key === 'all' ? 'All' : TYPE_LABELS[key]}
                    <span className={`ml-1.5 text-xs ${active ? 'text-white/60' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role rows — hairline list, not pastel cards */}
          <ul className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
            {visibleRoles.map((role) => {
              const Icon = role.icon;
              return (
                <li key={role.id}>
                  <Link
                    href={`/careers/apply?role=${roleParam(role)}`}
                    className="group -mx-4 flex flex-col gap-3 rounded-xl px-4 py-6 transition-colors hover:bg-gray-50 sm:mx-0 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:w-[30%] md:gap-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors group-hover:border-gray-900 group-hover:text-gray-900">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">{role.title}</h3>
                        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_CHIP_STYLES[role.type]}`}>
                          {TYPE_LABELS[role.type]}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-500 sm:flex-1 md:line-clamp-2">
                      {role.shortDescription}
                    </p>

                    <div className="hidden shrink-0 gap-1.5 lg:flex">
                      {role.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-900 transition-colors group-hover:text-black">
                      Apply
                      <ArrowUpRight className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-900" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-gray-300 px-6 py-6 sm:flex-row">
            <p className="text-sm text-gray-600">
              Don&apos;t see a role that fits? We&apos;re always open to hearing from talented people.
            </p>
            <Link
              href="/careers/apply"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Submit a general application
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Why join — bento grid ────────────────────────────────────── */}
        <section className="border-y border-gray-200 bg-gray-50/60 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Why InvertisPrep</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                Small team. Big impact.
              </h2>
              <p className="mt-3 text-gray-600">
                No layers of management, no throwaway work. Here&apos;s what working with us looks like.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6">
              {/* Featured — dark card */}
              <div className="relative overflow-hidden rounded-2xl bg-gray-950 p-7 text-white md:col-span-4">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-pink-500/40 blur-3xl"
                />
                <Award className="h-6 w-6 text-white/80" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">Your work reaches 100K+ students</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-300">
                  Every feature you build, every piece of content you create directly helps
                  students preparing for exams — you&apos;ll see your impact in the numbers, not a slide deck.
                </p>
              </div>

              <BenefitCard
                className="md:col-span-2"
                icon={Globe}
                title="Hybrid flexibility"
                description="Work from our Bareilly office or remotely — we trust you to do your best work wherever you are."
              />

              <BenefitCard
                className="md:col-span-2"
                icon={BookOpen}
                title="Learning budget"
                description="Annual budget for courses, books, and certifications. Your growth is our growth."
              />

              <BenefitCard
                className="md:col-span-2"
                icon={Shield}
                title="Real ownership"
                description="No micromanagement. You own your projects end-to-end, with support when you need it."
              />

              {/* Stack card — mono chips echo the technical brand */}
              <div className="rounded-2xl border border-gray-200 bg-white p-7 md:col-span-4">
                <div className="flex items-center gap-2.5">
                  <Database className="h-5 w-5 text-gray-700" aria-hidden="true" />
                  <h3 className="font-semibold text-gray-900">Modern stack</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Tools you&apos;ll actually enjoy — and the chance to influence how we build.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-gray-700">
                  {['Next.js 15', 'React 19', 'TypeScript', 'Tailwind', 'Node.js', 'MongoDB', 'Redis'].map((tech) => (
                    <span key={tech} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <BenefitCard
                className="md:col-span-2"
                icon={Zap}
                title="Ship weekly"
                description="Weekly syncs, monthly retros, short feedback loops. What you build goes live fast."
              />
            </div>
          </div>
        </section>

        {/* ── Hiring process ───────────────────────────────────────────── */}
        <section id="process" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 md:py-24">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">The process</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
              Five steps, one week.
            </h2>
            <p className="mt-3 text-gray-600">
              Transparent, respectful, and designed to be a two-way conversation.
            </p>
          </div>

          <ol className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-6">
            {/* Connector line */}
            <div aria-hidden="true" className="absolute left-4 right-4 top-4 hidden h-px bg-gray-200 md:block" />
            {[
              { title: 'Apply online', description: 'Submit through our form. Every application is read by a person.' },
              { title: 'Brief call', description: 'A 15–20 minute chat about your background and your questions.' },
              { title: 'Practical task', description: 'A paid take-home (2–4 hours) that mirrors real work. No puzzles.' },
              { title: 'Team discussion', description: 'Walk us through your task and how you think and collaborate.' },
              { title: 'Decision', description: 'We get back to you within a week — with feedback either way.' },
            ].map((step, i) => (
              <li key={step.title} className="relative">
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-xs font-bold text-gray-900">
                  {i + 1}
                </span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Step 0{i + 1}
                </p>
                <h3 className="mt-1 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gray-950 px-6 py-20 text-center md:py-28">
          <div
            aria-hidden="true"
            className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-pink-500/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Ready to build something students actually use?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-gray-400 md:text-lg">
              We&apos;re looking for builders, creators, and problem-solvers who care about
              education. If that&apos;s you, we&apos;d love to hear from you.
            </p>
            <Link
              href="/careers/apply"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-gray-950 shadow-xl transition-colors hover:bg-gray-200"
            >
              Apply now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <p className="mt-4 text-xs text-gray-500">
              Takes about five minutes · Reviewed by a person, not a bot
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="md:border-l md:border-gray-200 md:pl-8 md:first:border-l-0 md:first:pl-0">
      <p className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-7 transition-colors hover:border-gray-300 ${className}`}>
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-gray-700" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}
