'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  Heart,
  Award,
  Sparkles,
  ArrowRight,
  Compass,
  Zap,
  Globe,
  Users,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const values = [
  {
    icon: Globe,
    chipClass: 'bg-indigo-100 text-indigo-600',
    title: 'Accessibility',
    description:
      'We make academic resources freely available to every single student without paywalls or restrictive signup blocks.',
  },
  {
    icon: Award,
    chipClass: 'bg-pink-100 text-pink-600',
    title: 'Quality',
    description:
      'Ensuring that all syllabus docs and past papers are verified, official, and properly organized. No broken links.',
  },
  {
    icon: Users,
    chipClass: 'bg-blue-100 text-blue-600',
    title: 'Community',
    description:
      'Building a vibrant collective of student contributors who upload papers, share insights, and help peers succeed.',
  },
  {
    icon: Sparkles,
    chipClass: 'bg-purple-100 text-purple-600',
    title: 'Innovation',
    description:
      'Adding interactive features like ATS scores, customized resumes, gamified quizzes, and user milestones.',
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50">
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">InvertisPrep</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">About Us</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-500">
          The story, vision, and values behind your favourite academic resource platform.
        </p>
      </section>

      {/* Who We Are */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="space-y-6 lg:col-span-7"
          >
            <Badge variant="indigo">Who We Are</Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Bridging the gap in <span className="text-indigo-600">academic resources</span>
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              InvertisPrep is an educational platform dedicated to providing comprehensive study materials for
              students. We believe that access to quality resources should not be a barrier to educational success.
            </p>
            <p className="text-base leading-relaxed text-slate-600">
              Our platform aggregates Previous Year Question papers (PYQs), syllabus documents, and interactive
              test-taking modules to support student learning. We strive to reduce stress before exams by giving you
              everything you need in one organized, beautiful dashboard.
            </p>
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Structured Library</h4>
                  <p className="text-sm text-slate-500">Department and semester wise categorizations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">Student First</h4>
                  <p className="text-sm text-slate-500">Completely open-access, modern and user-friendly.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* University Image */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="lg:col-span-5"
          >
            <GlowCard
              glowColor="rgba(99, 102, 241, 0.15)"
              className="overflow-hidden rounded-3xl border-slate-200 bg-white p-2.5"
            >
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/university.jpg"
                  alt="Invertis University Campus"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-pink-300">
                    Our Inspiration
                  </p>
                  <h3 className="font-bold text-white">Invertis University, Bareilly</h3>
                  <p className="text-xs text-slate-300">Empowering future leaders through education.</p>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Logo */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
              className="order-2 flex items-center justify-center lg:col-span-5 lg:order-1"
            >
              <GlowCard
                glowColor="rgba(168, 85, 247, 0.12)"
                className="flex items-center justify-center rounded-full border-slate-200 bg-white p-12"
              >
                <Image
                  src="/invlogo.png"
                  alt="InvertisPrep Shield Logo"
                  width={140}
                  height={140}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/logo.jpeg';
                  }}
                />
              </GlowCard>
            </motion.div>

            {/* Vision content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
              className="order-1 space-y-6 lg:col-span-7 lg:order-2"
            >
              <Badge variant="indigo">Our Vision</Badge>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Democratizing education, <span className="text-purple-600">one semester</span> at a time
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                We envision a world where every student has immediate access to comprehensive, organized, and verified
                study materials. By leveraging modern tech stacks and collaborative contributions, we aim to build the
                ultimate digital academic library.
              </p>
              <p className="text-base leading-relaxed text-slate-600">
                Through our vision, students can focus their energy on understanding concepts and mastering material,
                rather than wasting countless hours hunting down old question papers or syllabus drafts.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Compass className="h-6 w-6" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">Guidance</h4>
                    <p className="text-xs text-slate-500">Helping students map their academic roadmap.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                    <Zap className="h-6 w-6" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">Efficiency</h4>
                    <p className="text-xs text-slate-500">Saving valuable study hours before exams.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mx-auto mb-12 max-w-3xl space-y-4 text-center"
        >
          <Badge variant="outline">Our Values</Badge>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            The core values that <span className="text-indigo-600">guide InvertisPrep</span>
          </h2>
          <p className="text-base text-slate-500">
            We are built by students, for students. These core pillars define every resource we add and every feature
            we implement.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {values.map((value) => (
            <motion.div key={value.title} variants={fadeInUp}>
              <GlowCard className="group h-full rounded-3xl border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1">
                <span
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${value.chipClass}`}
                >
                  <value.icon className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900">{value.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{value.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeInUp}
        >
          <GlowCard className="overflow-hidden rounded-3xl border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Heart className="h-6 w-6" />
              </span>
              <h2 className="max-w-xl text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Built by students, for students
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
                Have a suggestion or want to contribute? We&apos;d love to hear from you. Together we can make exam
                preparation easier for every student at Invertis.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
                >
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Link>
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
                >
                  Explore Resources
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </section>
    </div>
  );
}
