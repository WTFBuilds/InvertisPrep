'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { Eye, FileText, Search, ChevronRight, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fuzzySearch } from '@/lib/search';
import type { APIResponse } from '@/types';

interface Syllabus {
  _id: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  department: string;
  year: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
}

export default function SyllabusPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response, error, isLoading } = useSWR<APIResponse<Syllabus[]>>(
    '/syllabus',
    fetcher,
    { revalidateOnFocus: false }
  );

  const syllabus = response?.data || [];

  const filteredSyllabus = useMemo(() => {
    return fuzzySearch(
      syllabus,
      searchQuery,
      (item) => [item.name, item.department, item.year],
    );
  }, [searchQuery, syllabus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/resources" className="transition-colors hover:text-indigo-600">Resources</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900">Syllabus</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Resources</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Syllabus</h1>
            <p className="mt-2 text-slate-500">Download complete syllabus documents for every course.</p>
          </div>
          <Link href="/resources">
            <Button variant="outline" className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Resources
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, department, or year..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="flex-shrink-0 text-sm text-slate-500">
              {filteredSyllabus.length} result{filteredSyllabus.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table View */}
        <GlowCard className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="w-[55%] px-6 py-4 text-sm font-semibold text-slate-900">Name</th>
                  <th className="w-[20%] px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 py-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <Skeleton className="h-5 w-64" />
                        </div>
                      ))}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-sm text-slate-500">
                      Failed to load syllabus. Please try again.
                    </td>
                  </tr>
                ) : filteredSyllabus.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">No syllabus files found</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {searchQuery
                              ? `No results for "${searchQuery}". Try different keywords.`
                              : 'No syllabus files available yet.'}
                          </p>
                        </div>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSyllabus.map((item) => (
                    <tr key={item._id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-3 py-5 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-900 md:text-lg">{item.name}</span>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              {item.department && (
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] normal-case">
                                  {item.department}
                                </Badge>
                              )}
                              {item.year && (
                                <span className="text-xs text-slate-400">{item.year}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 md:px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-indigo-200 bg-white px-3 font-semibold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                          onClick={() => router.push(`/view/${item._id}?type=syllabus`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
