'use client';

import Link from 'next/link';
import { BookOpen, ArrowLeft, FileText, Video, Link as LinkIcon, Download } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                INVERTISPREP
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600">Study materials, notes, and learning resources</p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-purple-100 p-12 text-center">
          <div className="flex justify-center gap-4 mb-8">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Video className="h-8 w-8 text-blue-600" />
            </div>
            <div className="h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center">
              <LinkIcon className="h-8 w-8 text-pink-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-8">
            We're working hard to bring you comprehensive study resources including:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-purple-50 rounded-lg p-4">
              <FileText className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Study Notes</h3>
              <p className="text-sm text-gray-600">Comprehensive notes from top students</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <Video className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Video Tutorials</h3>
              <p className="text-sm text-gray-600">Visual learning resources</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4">
              <LinkIcon className="h-6 w-6 text-pink-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Reference Links</h3>
              <p className="text-sm text-gray-600">Curated external resources</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <Download className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Downloadable PDFs</h3>
              <p className="text-sm text-gray-600">Offline study materials</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
