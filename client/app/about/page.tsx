'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  BookOpen,
  Target,
  Heart,
  Award,
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookMarked,
  Users,
  CheckCircle2,
  ChevronDown,
  Compass,
  Zap,
  Globe
} from 'lucide-react';

// Animation variants
const letterContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const letterVariants: Variants = {
  hidden: { y: 100, opacity: 0, rotateX: -90 },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 100,
    },
  },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function AboutPage() {
  const brandName = "About Us";
  const brandLetters = Array.from(brandName);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 overflow-x-hidden relative transition-colors duration-300">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -top-[10%] right-[10%] w-[600px] h-[600px] bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Subtle grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Hero / Landing Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0 w-full text-left">

        {/* Text Landing Animation */}
        <motion.div
          variants={letterContainerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 flex flex-wrap justify-start items-center gap-x-1 sm:gap-x-2 select-none"
        >
          {brandLetters.map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-4xl sm:text-7xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 drop-shadow-sm"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>

      </section>

      {/* Who We Are Section (Scroll Slide-in) */}
      <section className="pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={slideInLeft}
            className="lg:col-span-7 space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bridging the Gap in <span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">Academic Resources</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
              InvertisPrep is an educational platform dedicated to providing comprehensive study materials for students. We believe that access to quality resources should not be a barrier to educational success.
            </p>
            <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
              Our platform aggregates Previous Year Question papers (PYQs), syllabus documents, and interactive test-taking modules to support student learning. We strive to reduce stress before exams by giving you everything you need in one organized, beautiful dashboard.
            </p>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Structured Library</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">Department and semester wise categorizations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Student First</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">Completely open-access, modern and user-friendly.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={slideInRight}
            className="lg:col-span-5 relative group lg:-translate-y-[25%]"
          >
            {/* Background glowing rings */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-pink-500 to-blue-500 rounded-3xl blur-2xl opacity-20 dark:opacity-10 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500 -z-10" />

            {/* The University Image Card */}
            <div className="relative max-w-xs sm:max-w-lg mx-auto aspect-[4/3] sm:aspect-square overflow-hidden rounded-3xl border-4 border-white dark:border-zinc-900 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              <Image
                src="/university.jpg"
                alt="Invertis University Campus"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-w-7xl) 100vw, 400px"
              />
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-1">Our Inspiration</p>
                <h3 className="text-lg sm:text-xl font-bold font-sans">Invertis University, Bareilly</h3>
                <p className="text-xs text-slate-300">Empowering future leaders through education.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Vision Section (Scroll Slide-in Alternating) */}
      <section className="py-24 bg-gradient-to-b from-indigo-50/50 via-pink-50/20 to-transparent dark:from-indigo-950/10 dark:via-zinc-950 to-transparent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Logo illustration container */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
              variants={slideInLeft}
              className="lg:col-span-5 order-2 lg:order-1 relative flex justify-center items-center"
            >
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Floating animations */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
                  className="absolute inset-4 border border-dashed border-indigo-500/30 dark:border-indigo-400/20 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
                  className="absolute inset-10 border border-dashed border-pink-500/20 dark:border-pink-400/10 rounded-full"
                />

                {/* Center glass badge with logo */}
                <div className="absolute inset-16 bg-white/70 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center p-6 group cursor-pointer transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/invlogo.png"
                    alt="InvertisPrep Shield Logo"
                    width={110}
                    height={110}
                    className="object-contain transition-transform duration-500 group-hover:rotate-6"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Vision Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
              variants={slideInRight}
              className="lg:col-span-7 order-1 lg:order-2 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 dark:bg-pink-500/5 text-pink-600 dark:text-pink-400 text-xs font-semibold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                Our Vision
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Democratizing Education, <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">One Semester</span> at a Time
              </h2>
              <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
                We envision a world where every student has immediate access to comprehensive, organized, and verified study materials. By leveraging modern tech stacks and collaborative contributions, we aim to build the ultimate digital academic library.
              </p>
              <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
                Through our vision, students can focus their energy on *understanding concepts* and mastering material, rather than wasting countless hours hunting down old question papers or syllabus drafts.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-6">
                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm flex-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Guidance</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Helping students map their academic roadmap.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm flex-1">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Efficiency</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Saving valuable study hours before exams.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section (Scroll-Triggered Grid) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            The Core Values that <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Guide InvertisPrep</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-zinc-400">
            We are built by students, for students. These core pillars define every resource we add and every feature we implement.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Value 1 */}
          <motion.div
            variants={fadeInUp}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-6 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Accessibility</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
              We make academic resources freely available to every single student without paywalls or restrictive signup blocks.
            </p>
          </motion.div>

          {/* Value 2 */}
          <motion.div
            variants={fadeInUp}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-6 shadow-md hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 to-rose-500" />
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Quality</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
              Ensuring that all syllabus docs and past papers are verified, official, and properly organized. No broken links.
            </p>
          </motion.div>

          {/* Value 3 */}
          <motion.div
            variants={fadeInUp}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Community</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
              Building a vibrant collective of student contributors who upload papers, share insights, and help peers succeed.
            </p>
          </motion.div>

          {/* Value 4 */}
          <motion.div
            variants={fadeInUp}
            className="group relative bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-6 shadow-md hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Innovation</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
              Adding interactive features like ATS scores, customized resumes, gamified quizzes, and user milestones.
            </p>
          </motion.div>
        </motion.div>
      </section>

</div>
  );
}
