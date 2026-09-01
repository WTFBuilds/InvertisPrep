'use client';

import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, FileCheck2, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative isolate overflow-hidden min-h-screen flex items-center"
      style={{
        paddingTop: '2rem',
        padding: '4rem 1rem 1rem 1rem',
        backgroundImage: `url('/img1.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Brighter overlay letting the campus image breathe and shine through */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70 backdrop-blur-[3px]"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 py-12 md:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-6 text-center lg:text-left pt-10 sm:pt-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              <span className={`block transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                Your Gateway to
              </span>
              <span className={`block transition-all duration-1000 ease-out delay-200 transform text-white/95 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                Academic Excellence.
              </span>
            </h1>

            {/* Brighter text for the paragraph to dramatically improve readability */}
            <p className={`mt-6 md:mt-8 text-base md:text-lg leading-relaxed text-zinc-100 transition-all duration-1000 ease-out delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-w-lg mx-auto lg:mx-0 font-medium drop-shadow-md`}>
              Access previous year papers, study materials, and compete in real-time quizzes. Designed for the modern student at Invertis University.
            </p>

            <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-1000 ease-out delay-600 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Link
                href="/pyq"
                className="group flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-lg hover:bg-zinc-200 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pyq"
                className="flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/60 px-8 py-3.5 text-sm font-semibold transition-all duration-300 shadow-sm"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4 mt-8 lg:mt-0">
            {/* 1. Resume Builder (Featured Card) */}
            <div className={`group relative rounded-2xl bg-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} hover:border-white/40 hover:bg-white/15 hover:shadow-white/10 overflow-hidden`}>
              {/* Premium subtle top-edge glow on hover */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="absolute top-5 right-5 bg-white/90 text-black text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
                New
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="p-3.5 rounded-2xl bg-white/10 text-white ring-1 ring-white/20 group-hover:bg-white/20 group-hover:text-white group-hover:ring-white/40 transition-all duration-300 shadow-inner">
                  <FileCheck2 className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="pt-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-white transition-colors mb-2">
                    Resume Builder
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-sm group-hover:text-zinc-100 transition-colors">
                    Craft ATS-friendly, professional resumes tailored for modern tech and corporate roles in minutes.
                  </p>
                  
                  <div className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                    <Link href="/resumes" className="flex items-center gap-1.5 after:absolute after:inset-0">
                      Try it now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2. New Session PYQs */}
              <div className={`rounded-2xl bg-white/5 p-5 shadow-xl backdrop-blur-xl border border-white/10 transition-all duration-700 ease-out delay-100 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} hover:border-white/30 hover:bg-white/10 hover:shadow-white/5 group`}>
                <Link href="/pyq" className="block h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10 group-hover:bg-white/20 group-hover:text-white group-hover:ring-white/40 transition-all duration-300">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors tracking-wide">Session PYQs</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-12 group-hover:text-zinc-200 transition-colors">
                    Access newly added papers from the latest academic session.
                  </p>
                </Link>
              </div>

              {/* 3. Quizzo */}
              <div className={`rounded-2xl bg-white/5 p-5 shadow-xl backdrop-blur-xl border border-white/10 transition-all duration-700 ease-out delay-200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} hover:border-white/30 hover:bg-white/10 hover:shadow-white/5 group`}>
                <Link href="/quizz0" className="block h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10 group-hover:bg-white/20 group-hover:text-white group-hover:ring-white/40 transition-all duration-300">
                      <Brain className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors tracking-wide">Quizzo</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-12 group-hover:text-zinc-200 transition-colors">
                    Test your knowledge with real-time competitive quizzes.
                  </p>
                </Link>
              </div>
            </div>

            {/* 4. Syllabus Hub (Slim Banner) */}
            <div className={`rounded-2xl bg-white/5 p-4 sm:p-5 shadow-xl backdrop-blur-xl border border-white/10 transition-all duration-700 ease-out delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} hover:border-white/30 hover:bg-white/10 hover:shadow-white/5 group relative overflow-hidden`}>
              <Link href="/resources/syllabus" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10 group-hover:bg-white/20 group-hover:text-white group-hover:ring-white/40 transition-all duration-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors tracking-wide">Syllabus Hub</h3>
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors mt-0.5 hidden sm:block">
                      Explore official course structures and references.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors mr-2" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
