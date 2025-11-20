'use client';

import Link from "next/link";
import { BookOpen, Trophy, FileText, Medal, ArrowUpRight, Users, Brain, Laptop } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header/Navbar */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              INVERTISPREP
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-purple-600 transition font-medium">
              Home
            </Link>
            <Link href="/pyq" className="text-gray-700 hover:text-purple-600 transition font-medium">
              PYQ
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-purple-600 transition font-medium">
              Resources
            </Link>
            <Link href="/quizzo" className="text-gray-700 hover:text-purple-600 transition font-medium">
              Quizzo
            </Link>
            <Link href="/leaderboard" className="text-gray-700 hover:text-purple-600 transition font-medium">
              Leaderboard
            </Link>
            {user ? (
              <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
                Dashboard
              </Link>
            ) : (
              <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div
        className="relative isolate overflow-hidden min-h-screen flex items-center pt-16"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('/img1.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-indigo-900/40"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="max-w-xl mx-auto text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                <span className={`inline-block transition-all duration-700 delay-100 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
                  Your Gateway to
                </span>
                <br />
                <span className={`inline-block transition-all duration-700 delay-300 transform bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
                  Academic Excellence
                </span>
              </h1>

              <p className={`mt-6 text-lg leading-7 text-indigo-100 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                Access previous year papers, study materials, and compete in real-time quizzes. All in one place, designed specifically for Invertis University students.
              </p>

              <div className={`mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-700 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Link
                  href={user ? "/pyq" : "/admin"}
                  className="rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Get Started
                </Link>
                <Link
                  href="/pyq"
                  className="text-sm font-semibold leading-6 text-white flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg px-6 py-3 rounded-md"
                >
                  Learn more <span aria-hidden="true" className="ml-2">→</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Feature Card 1 - Leaderboard */}
              <div className={`rounded-xl bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40 p-5 shadow-xl backdrop-blur-sm border border-pink-300/50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'} hover:shadow-pink-500/30 hover:scale-105 hover:-translate-y-1 relative overflow-hidden`}>
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg shadow">
                  NEW
                </div>
                <Link href="/leaderboard" className="block">
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-200 to-pink-200 text-indigo-600">
                      <Medal className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-white">Leaderboard</h3>
                  </div>
                  <p className="text-sm text-gray-100 ml-14">
                    Compete, rank up, and show off your academic prowess!
                  </p>
                </Link>
              </div>

              {/* Feature Card 2 - Resources */}
              <div className={`rounded-xl bg-transparent p-5 shadow-xl backdrop-blur-sm border border-white/50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'} hover:shadow-indigo-500/30 hover:scale-105 hover:-translate-y-1`}>
                <Link href="/resources" className="block">
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-white">Resources</h3>
                  </div>
                  <p className="text-sm text-gray-200 ml-14">
                    Access comprehensive learning resources and study materials.
                  </p>
                </Link>
              </div>

              {/* Feature Card 3 - Quiz Battles */}
              <div className={`rounded-xl bg-transparent p-5 shadow-xl backdrop-blur-sm border border-white/50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'} hover:shadow-indigo-500/30 hover:scale-105 hover:-translate-y-1`}>
                <Link href="/quizzo" className="block">
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-white">Quiz Battles</h3>
                  </div>
                  <p className="text-sm text-gray-200 ml-14">
                    Compete with peers in real-time quiz battles.
                  </p>
                </Link>
              </div>

              {/* Feature Card 4 - PYQ Solutions */}
              <div className={`rounded-xl bg-transparent p-5 shadow-xl backdrop-blur-sm border border-white/50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'} hover:shadow-indigo-500/30 hover:scale-105 hover:-translate-y-1`}>
                <Link href="/pyq" className="block">
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-white">PYQ Solutions</h3>
                  </div>
                  <p className="text-sm text-gray-200 ml-14">
                    Access previous year question papers with detailed solutions.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-indigo-100 via-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-5 py-1.5 rounded-full mb-3 shadow">
              KEY FEATURES
            </span>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
              Everything You Need to Excel
            </h2>
            <p className="mt-4 text-lg text-gray-700">
              InvertisPrep combines academic resources with interactive learning to create the ultimate platform for Invertis University students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Previous Year Papers */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-purple-600">
                Previous Year Papers
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Access a comprehensive collection of previous year question papers from all semesters and departments.
              </p>
            </div>

            {/* Study Notes */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-pink-600">
                Study Notes
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Get access to detailed study notes created by top students and faculty members.
              </p>
            </div>

            {/* Quizzo Battles */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-amber-600">
                Quizzo Battles
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Compete with peers in real-time 1v1 quiz battles with 10-second timer per question.
              </p>
            </div>

            {/* Community Uploads */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-600">
                Community Uploads
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Share your notes and resources with the community and get recognition for your contributions.
              </p>
            </div>

            {/* Personalized Learning */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-600">
                Personalized Learning
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Track your progress, identify weak areas, and get personalized recommendations.
              </p>
            </div>

            {/* Anywhere, Anytime */}
            <div className="group p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center p-3 rounded-lg mb-3 transition-transform transform group-hover:scale-105 bg-white/80 shadow">
                <Laptop className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-indigo-600">
                Anywhere, Anytime
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Access all resources on any device, anytime, anywhere. Study on your schedule.
              </p>
            </div>
          </div>

          <div className="text-center mt-14">
            <Link href="/pyq">
              <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full hover:from-indigo-700 hover:to-purple-700 transition duration-300 shadow hover:shadow-indigo-400/30 transform hover:-translate-y-1">
                Start Learning Now
              </button>
            </Link>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">InvertisPrep</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 InvertisPrep. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition text-sm">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
