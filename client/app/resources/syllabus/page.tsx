'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

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
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [filteredSyllabus, setFilteredSyllabus] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/syllabus');
        if (!response.ok) throw new Error('Failed to fetch syllabus');
        const data = await response.json();
        setSyllabus(data.data || []);
        setFilteredSyllabus(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load syllabus');
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabus();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = syllabus.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    );
    setFilteredSyllabus(filtered);
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
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Search Syllabus files..." 
            className="pl-10 h-11 border-gray-200 bg-gray-50/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table View */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-[55%]">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-[25%]">Upload Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading syllabus items...</td>
                  </tr>
                ) : filteredSyllabus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No syllabus files found</td>
                  </tr>
                ) : (
                  filteredSyllabus.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm md:text-base">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(item.uploadDate)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 text-gray-700 border-gray-200"
                            onClick={() => window.open(item.cloudinaryUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.cloudinaryUrl;
                              link.download = item.fileName;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            Download
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
