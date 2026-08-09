'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, CalendarDays, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi } from '@/lib/api';
import { createStarterResume } from '@/components/resume-builder/ResumeBuilder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { ShinyButton } from '@/components/ui/shiny-button';
import type { Resume } from '@/types';

function ResumeCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-5 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-4 h-3 w-1/3" />
      <Skeleton className="mt-4 h-9 w-full rounded-lg" />
    </div>
  );
}

export default function ResumesDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadResumes = async () => {
    try {
      const response = await resumeApi.list();
      setResumes(response.data || []);
    } catch {
      toast.error('Could not load your resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) {
      const timer = window.setTimeout(() => { void loadResumes(); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [user, loading, router]);

  const createResume = async () => {
    setCreating(true);
    try {
      const response = await resumeApi.create(createStarterResume());
      if (!response.data) throw new Error();
      router.push(`/resume-builder?id=${response.data._id}`);
    } catch {
      toast.error('Could not create a new resume');
    } finally {
      setCreating(false);
    }
  };

  const deleteResume = async (id: string) => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await resumeApi.delete(id);
      setResumes((current) => current.filter((resume) => resume._id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Could not delete this resume');
    }
  };

  if (loading || loadingResumes) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Skeleton className="mb-8 h-10 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <ResumeCardSkeleton key={i} />)}
          </div>
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

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* ── page header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Career Tools</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">My Resumes</h1>
            <p className="mt-2 text-slate-500">Create a tailored, ATS-friendly resume for every opportunity.</p>
          </div>
          <ShinyButton isActive onClick={createResume} className="px-5">
            {creating ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> New Resume
              </span>
            )}
          </ShinyButton>
        </div>

        {resumes.length === 0 ? (
          /* ── empty state ── */
          <GlowCard className="rounded-3xl border-slate-200 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">No resumes yet</h2>
            <p className="mt-1 text-sm text-slate-500">Start from the ATS-friendly InvertisPrep template.</p>
            <Button
              onClick={createResume}
              disabled={creating}
              className="mt-6 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create your first resume
            </Button>
          </GlowCard>
        ) : (
          /* ── resume grid ── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <GlowCard
                key={resume._id}
                className="group flex flex-col rounded-2xl border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <FileText className="h-5 w-5" />
                  </span>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => deleteResume(resume._id)}
                    aria-label={`Delete ${resume.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-4 truncate text-base font-bold text-slate-900">{resume.title}</h2>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                  {resume.personal?.name || 'Untitled resume'}
                  {resume.personal?.headline ? ` — ${resume.personal.headline}` : ''}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="hidden border-indigo-100 text-indigo-600 sm:inline-flex">
                    ATS-ready
                  </Badge>
                </div>

                <Link
                  href={`/resume-builder?id=${resume._id}`}
                  className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Edit resume
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </GlowCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
