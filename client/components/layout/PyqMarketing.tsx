'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PyqMarketing() {
  return (
    <section className="relative bg-[#fafafa] pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden border-t border-zinc-100 font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Yellow Badge */}
          <div className="relative mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-[#facc15] text-zinc-900 px-4 py-1.5 font-bold text-sm tracking-wide rounded-sm inline-block shadow-sm"
            >
              WHY STUDENTS USE INVERTISPREP
            </motion.div>
            {/* Hand-drawn sparks SVG */}
            <svg className="absolute -right-8 -top-4 w-6 h-6 text-indigo-600" viewBox="0 0 60 60" fill="none">
              <path d="M10,25 C20,15 35,10 45,5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <path d="M5,35 C20,32 40,32 50,32" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <path d="M10,45 C20,50 35,50 45,55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          
          {/* Headline monochrome */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-black text-zinc-900 tracking-tight leading-[1.05] uppercase italic"
          >
            PAST PAPERS DON'T GIVE ANSWERS <br className="hidden md:block"/>
            <span className="text-zinc-500">THEY REVEAL THE PATTERN</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="mt-6 md:mt-8 text-base md:text-lg text-zinc-700 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Thousands of questions, organized papers, detailed solutions, and real exam patterns — all in one academic workspace.
          </motion.p>
        </div>

        {/* Features Grid - CARTOON / HAND-DRAWN VISUALS */}
        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: Exam Patterns */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="h-full"
          >
            <Link href="/pyq" className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-zinc-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 w-full h-full cursor-pointer">
              {/* Text Side */}
              <div className="w-full md:w-3/5 flex flex-col items-start pr-4">
                <div className="bg-indigo-600 text-white text-sm font-bold w-9 h-9 flex items-center justify-center rounded mb-4">
                  01
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-3">
                  DISCOVER <br/>
                  <span className="text-indigo-600">EXAM PATTERNS</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed group-hover:text-zinc-700 transition-colors">
                  Understand what professors repeatedly ask and identify high-frequency topics before exams.
                </p>
              </div>
              
              {/* Visual Side (Hand-drawn SVG) */}
              <div className="w-full md:w-2/5 mt-8 md:mt-0 flex justify-center md:justify-end relative">
                 <div className="relative w-40 h-32 flex items-center justify-center">
                   {/* Hand-drawn document SVG */}
                   <svg className="w-24 h-24 text-zinc-900 transform -rotate-6 transition-transform group-hover:-rotate-3 group-hover:scale-105 duration-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M20,10 L70,10 L85,25 L85,90 L20,90 Z" fill="white" />
                     <path d="M70,10 L70,25 L85,25" />
                     <path d="M30,35 L60,35" />
                     <path d="M30,50 L75,50" />
                     <path d="M30,65 L50,65" />
                     {/* Magnifying glass highlighting a spot */}
                     <circle cx="65" cy="70" r="16" className="text-indigo-500" fill="currentColor" fillOpacity="0.15" strokeWidth="4"/>
                     <path d="M75,80 L90,95" className="text-indigo-600" strokeWidth="6"/>
                     <path d="M55,70 L70,70" className="text-indigo-600" strokeWidth="3"/>
                   </svg>
                   {/* Hand-drawn sparks */}
                   <svg className="absolute top-0 right-2 w-10 h-10 text-amber-400 transform rotate-12 transition-transform group-hover:rotate-45 group-hover:scale-110 duration-500" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M25,5 L25,15" />
                      <path d="M25,35 L25,45" />
                      <path d="M5,25 L15,25" />
                      <path d="M35,25 L45,25" />
                      <path d="M10,10 L18,18" />
                      <path d="M32,32 L40,40" />
                   </svg>
                 </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Department-Wise Papers */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <Link href="/pyq" className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-zinc-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 w-full h-full cursor-pointer">
              <div className="w-full md:w-3/5 flex flex-col items-start pr-4">
                <div className="bg-indigo-600 text-white text-sm font-bold w-9 h-9 flex items-center justify-center rounded mb-4">
                  02
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-3">
                  ACCESS <br/>
                  <span className="text-indigo-600">DEPT. PAPERS</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed group-hover:text-zinc-700 transition-colors">
                  Organized structurally by department, semester, and subject so you can instantly find what you need.
                </p>
              </div>
              
              {/* Visual Side (Hand-drawn SVG Stack) */}
              <div className="w-full md:w-2/5 mt-8 md:mt-0 flex justify-center md:justify-end relative">
                 <div className="relative w-40 h-32 flex items-center justify-center">
                   <svg className="w-28 h-28 text-zinc-900 transition-transform group-hover:-translate-y-1 group-hover:rotate-2 duration-300" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     {/* Back folder (Indigo tint) */}
                     <path d="M30,30 L55,30 L65,40 L100,40 L100,90 L30,90 Z" className="text-indigo-400" fill="currentColor" fillOpacity="0.2" />
                     {/* Paper sticking out */}
                     <path d="M25,45 L25,20 L60,20 L75,35 L75,45" stroke="currentColor" fill="white" />
                     <path d="M60,20 L60,35 L75,35" stroke="currentColor" />
                     <path d="M35,35 L50,35" stroke="currentColor" />
                     <path d="M35,45 L50,45" stroke="currentColor" />
                     {/* Front folder (Black) */}
                     <path d="M15,45 L40,45 L50,55 L95,55 L95,105 L15,105 Z" fill="white" />
                     <path d="M25,65 L50,65" className="text-indigo-500" strokeWidth="4" />
                   </svg>
                   {/* Floating star */}
                   <svg className="absolute top-2 left-2 w-6 h-6 text-indigo-500 transform -rotate-12 transition-transform group-hover:rotate-12 group-hover:-translate-y-2 duration-300" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z"/>
                   </svg>
                 </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Learn From Solutions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="h-full"
          >
            <Link href="/coming-soon" className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-zinc-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 w-full h-full cursor-pointer">
              <div className="w-full md:w-3/5 flex flex-col items-start pr-4">
                <div className="bg-indigo-600 text-white text-sm font-bold w-9 h-9 flex items-center justify-center rounded mb-4">
                  03
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-3">
                  LEARN <br/>
                  <span className="text-indigo-600">FROM SOLUTIONS</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed group-hover:text-zinc-700 transition-colors">
                  Don't just read questions. Learn the concepts behind them using detailed, verified academic solutions.
                </p>
              </div>
              
              {/* Visual Side (Hand-drawn SVG Paper with Checkmark) */}
              <div className="w-full md:w-2/5 mt-8 md:mt-0 flex justify-center md:justify-end relative">
                 <div className="relative w-36 h-36 flex items-center justify-center">
                   <svg className="w-24 h-32 text-zinc-900 transform rotate-3 transition-transform group-hover:rotate-6 group-hover:scale-105 duration-300" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M10,10 L90,10 L90,110 L10,110 Z" fill="white" />
                     <path d="M20,25 L80,25" />
                     <path d="M20,40 L60,40" />
                     {/* Squiggly solution box */}
                     <path d="M15,60 C30,55 70,65 85,60 L85,100 C70,105 30,95 15,100 Z" className="text-green-500" fill="currentColor" fillOpacity="0.1" strokeDasharray="4 4" />
                     <path d="M25,75 L75,75" className="text-green-500" strokeWidth="3"/>
                     <path d="M25,85 L55,85" className="text-green-500" strokeWidth="3"/>
                   </svg>
                   {/* Giant hand-drawn checkmark */}
                   <svg className="absolute -right-2 top-8 w-16 h-16 text-green-500 transform -rotate-12 transition-transform group-hover:-rotate-6 group-hover:scale-110 duration-300" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M10,25 L20,35 L45,10" />
                   </svg>
                 </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 4: Study Smarter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <Link href="/resources" className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-zinc-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 w-full h-full cursor-pointer">
              <div className="w-full md:w-3/5 flex flex-col items-start pr-4">
                <div className="bg-indigo-600 text-white text-sm font-bold w-9 h-9 flex items-center justify-center rounded mb-4">
                  04
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-3">
                  STUDY <br/>
                  <span className="text-indigo-600">SMARTER</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed group-hover:text-zinc-700 transition-colors">
                  Reduce random preparation and focus purely on what actually matters in your final exams.
                </p>
              </div>
              
              {/* Visual Side (Hand-drawn Sticky Note & Wavy Roadmap exactly like Reference) */}
              <div className="w-full md:w-2/5 mt-8 md:mt-0 flex justify-center md:justify-end relative">
                 <div className="relative w-48 h-36 bg-[#fffcf0] transform -rotate-2 p-3 transition-transform group-hover:-translate-y-1 group-hover:rotate-1 duration-300" style={{ border: '1px solid #fde047', borderRadius: '3px 8px 4px 6px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                   {/* Blue Tape */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-blue-600 transform rotate-3 shadow-sm"></div>
                   
                   <div className="text-[11px] font-black uppercase text-zinc-900 mt-2 text-center" style={{ fontFamily: 'comic sans ms, cursive, sans-serif' }}>
                      YOUR ROADMAP
                   </div>
                   
                   {/* Wavy roadmap SVG */}
                   <div className="relative w-full h-20 mt-1">
                     <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 150 70" fill="none">
                       {/* Wavy dashed line */}
                       <path d="M 15 35 Q 45 65, 80 45 T 125 35 L 140 15" stroke="#18181b" strokeWidth="2.5" strokeDasharray="5 5" fill="none" strokeLinecap="round" />
                       
                       {/* Nodes matching reference colors (blue/yellow) */}
                       {/* Node 1: PYQ */}
                       <circle cx="15" cy="35" r="5" fill="#2563eb" stroke="#18181b" strokeWidth="2.5" />
                       {/* Node 2: Analyze */}
                       <circle cx="65" cy="53" r="4.5" fill="#eab308" stroke="#18181b" strokeWidth="2.5" />
                       {/* Node 3: Learn */}
                       <circle cx="105" cy="40" r="5" fill="#2563eb" stroke="#18181b" strokeWidth="2.5" />
                       {/* Node 4: Exam */}
                       <circle cx="132" cy="27" r="4.5" fill="#eab308" stroke="#18181b" strokeWidth="2.5" />
                       
                       {/* Checkered Flag at end */}
                       <path d="M140 15 L140 -2 L152 4 L140 10" fill="white" stroke="#18181b" strokeWidth="2" strokeLinejoin="round" />
                       
                       {/* Hand-drawn Text Labels */}
                       <text x="15" y="52" fontSize="6.5" fontWeight="bold" fill="#18181b" textAnchor="middle" style={{ fontFamily: 'comic sans ms, cursive, sans-serif' }}>PYQ</text>
                       <text x="65" y="68" fontSize="6.5" fontWeight="bold" fill="#18181b" textAnchor="middle" style={{ fontFamily: 'comic sans ms, cursive, sans-serif' }}>ANALYZE</text>
                       <text x="105" y="27" fontSize="6.5" fontWeight="bold" fill="#18181b" textAnchor="middle" style={{ fontFamily: 'comic sans ms, cursive, sans-serif' }}>LEARN</text>
                       <text x="132" y="42" fontSize="6.5" fontWeight="bold" fill="#18181b" textAnchor="middle" style={{ fontFamily: 'comic sans ms, cursive, sans-serif' }}>EXAM</text>
                     </svg>
                   </div>
                   
                   {/* Floating hand-drawn blue arrow pointing to sticky note */}
                   <svg className="absolute -bottom-6 -left-6 w-12 h-12 text-blue-600 transform rotate-12 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:rotate-6 duration-300" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M10,25 C20,35 30,35 40,25" />
                     <path d="M30,15 L40,25 L30,35" />
                   </svg>
                 </div>
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
