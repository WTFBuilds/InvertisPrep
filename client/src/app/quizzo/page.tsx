'use client';

import Link from 'next/link';
import { BookOpen, ArrowLeft, Trophy, Zap, Users, Clock } from 'lucide-react';

export default function QuizzoPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quizzo Battles</h1>
          <p className="text-xl text-gray-600">Compete with peers in real-time quiz battles</p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-purple-100 p-12 text-center">
          <div className="flex justify-center gap-4 mb-8">
            <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center animate-pulse delay-100">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse delay-200">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-8">
            Get ready for an exciting quiz battle experience featuring:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-amber-50 rounded-lg p-4">
              <Trophy className="h-6 w-6 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">1v1 Battles</h3>
              <p className="text-sm text-gray-600">Challenge friends to quiz duels</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Fast-Paced</h3>
              <p className="text-sm text-gray-600">10 seconds per question</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Multiplayer</h3>
              <p className="text-sm text-gray-600">Real-time quiz competitions</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <Clock className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Live Results</h3>
              <p className="text-sm text-gray-600">Instant score updates</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-amber-900 mb-2">🎮 Game Modes</h3>
            <ul className="text-left text-sm text-amber-800 space-y-1">
              <li>• Solo Practice - Improve your knowledge</li>
              <li>• 1v1 Duel - Challenge a specific opponent</li>
              <li>• Tournament - Compete with multiple players</li>
              <li>• Daily Challenge - New questions every day</li>
            </ul>
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
