'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { BookOpen, FileText, ArrowRight, Lightbulb } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── page header ── */}
        <div className="mb-12 text-center">
          <Badge variant="indigo" className="mb-3">Study Materials</Badge>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Resources</h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">Access all your study materials in one place.</p>
        </div>

        {/* ── resources grid ── */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* PYQ Card */}
          <GlowCard className="flex flex-col rounded-2xl border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Previous Year Questions</h2>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              Access previous year question papers for all programs.
            </p>
            <div className="flex-1" />
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Study with our comprehensive collection of previous year question papers. Download, view, and practice with papers from multiple years and departments.
            </p>
            <Link href="/pyq" className="w-full">
              <Button className="w-full bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800">
                Browse PYQs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </GlowCard>

          {/* Syllabus Card */}
          <GlowCard className="flex flex-col rounded-2xl border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Syllabus</h2>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              Complete syllabus for all programs and semesters.
            </p>
            <div className="flex-1" />
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Download complete syllabus documents for your program. Get detailed information about course structure, topics, and learning outcomes.
            </p>
            <Link href="/resources/syllabus" className="w-full">
              <Button className="w-full bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800">
                Browse Syllabus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </GlowCard>
        </div>

        {/* ── study tips box ── */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-slate-900">Study Tips</h3>
          </div>
          <Separator className="mb-4" />
          <ul className="space-y-2.5">
            {[
              'Download syllabus to understand course structure before starting',
              'Practice with previous year questions to assess your preparation',
              'Cross-reference with syllabus while solving papers',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
