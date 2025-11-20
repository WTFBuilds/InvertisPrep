'use client';

import Link from 'next/link';
import { BookOpen, ArrowLeft, Trophy, Medal, Award, Crown } from 'lucide-react';

export default function LeaderboardPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Leaderboard</h1>
          <p className="text-xl text-gray-600">See where you rank among peers</p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-purple-100 p-12 text-center">
          <div className="flex justify-center gap-4 mb-8">
            <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
              <Crown className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-8">
            Compete for the top spot and earn bragging rights with features including:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
              <Trophy className="h-8 w-8 text-amber-600 mx-auto mb-3" />
              <h3 className="font-bold text-2xl text-amber-600 mb-1">#1</h3>
              <p className="text-sm text-gray-600">Gold Champion</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300">
              <Medal className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-bold text-2xl text-gray-600 mb-1">#2</h3>
              <p className="text-sm text-gray-600">Silver Elite</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
              <Award className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-2xl text-orange-600 mb-1">#3</h3>
              <p className="text-sm text-gray-600">Bronze Star</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-bold text-purple-900 mb-3">🏆 Leaderboard Features</h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Global Rankings - See how you compare to all users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Department Rankings - Compete within your department</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Weekly Champions - Fresh competition every week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Achievement Badges - Unlock special rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Points System - Earn points for quiz battles and contributions</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-900">
              <strong>💡 Pro Tip:</strong> Participate in Quizzo battles, contribute resources, and maintain study streaks to climb the leaderboard!
            </p>
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
