'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600">Access all your study materials in one place</p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* PYQ Card */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <CardTitle>Previous Year Questions</CardTitle>
              </div>
              <CardDescription>
                Access previous year question papers for all programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Study with our comprehensive collection of previous year question papers. Download, view, and practice with papers from multiple years and departments.
              </p>
              <Link href="/pyq" className="w-full">
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  Browse PYQs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Syllabus Card */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-8 w-8 text-purple-600" />
                <CardTitle>Syllabus</CardTitle>
              </div>
              <CardDescription>
                Complete syllabus for all programs and semesters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Download complete syllabus documents for your program. Get detailed information about course structure, topics, and learning outcomes.
              </p>
              <Link href="/resources/syllabus" className="w-full">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  Browse Syllabus
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">📚 Study Tips</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Download syllabus to understand course structure before starting</li>
            <li>• Practice with previous year questions to assess your preparation</li>
            <li>• Cross-reference with syllabus while solving papers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
