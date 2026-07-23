'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Search, ChevronRight, X } from 'lucide-react';
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/resources" className="hover:text-indigo-600 transition-colors">Resources</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Syllabus</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Syllabus Resources</h1>
          <Link href="/resources">
            <Button variant="outline" className="border-gray-200">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to All Resources
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, department, or year..."
              className="w-full pl-10 pr-10 h-11 border border-gray-200 bg-gray-50/50 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-sm text-gray-500 flex-shrink-0">
              {filteredSyllabus.length} result{filteredSyllabus.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table View */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-[55%]">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading syllabus items...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Failed to load syllabus. Please try again.</td>
                  </tr>
                ) : filteredSyllabus.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No syllabus files found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery
                              ? `No results for "${searchQuery}". Try different keywords.`
                              : 'No syllabus files available yet.'}
                          </p>
                        </div>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm text-indigo-600 hover:underline font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSyllabus.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-indigo-600" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm md:text-lg">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-gray-300 hover:text-white"
                            onClick={() => router.push(`/view/${item._id}?type=syllabus`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
