'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap } from 'lucide-react';
import { departmentApi } from '@/services/api';
import { Department } from '@/types';

export default function PYQPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                INVERTISPREP
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-purple-600 transition">
                Home
              </Link>
              <Link href="/pyq" className="text-purple-600 font-semibold">
                PYQ
              </Link>
              <Link href="/admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Select Your Department
          </h1>
          <p className="text-xl text-gray-600">
            Choose your department to access previous year question papers
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {departments.map((dept) => (
              <Link
                key={dept._id}
                href={`/pyq/${dept.id}`}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-purple-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-3xl group-hover:bg-purple-100 transition">
                    {dept.icon || <GraduationCap className="h-7 w-7 text-purple-600" />}
                  </div>
                  <GraduationCap className="h-8 w-8 text-gray-300 group-hover:text-purple-600 transition" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition">
                  {dept.name}
                </h3>
                <p className="text-gray-500 mb-4">{dept.displayName}</p>
                <p className="text-gray-600 text-sm line-clamp-2">{dept.description}</p>

                <div className="mt-6 flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Question Papers →
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && departments.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No departments found</p>
          </div>
        )}
      </main>
    </div>
  );
}
