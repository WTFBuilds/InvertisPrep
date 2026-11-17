'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  useAnimationFrame,
  AnimatePresence,
  Variants,
} from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Github,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  Rocket,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { cn } from '@/lib/utils';

/* ── Animation variants ─────────────────────────────────────────────── */
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 35 },
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
    transition: { staggerChildren: 0.1 },
  },
};

const JOIN_FORM_URL = 'https://forms.gle/itpqynriXxkC4bWTA';

/* ── Data ───────────────────────────────────────────────────────────── */
interface Member {
  name: string;
  role: string;
  image: string;
  tagline: string;
  bio: string;
  focus: string[];
  linkedin?: string;
  github?: string;
  instagram?: string;
}

const allMembers: Member[] = [
  {
    name: 'Ahqaf Ali',
    role: 'Founder & Lead',
    image: '/team/founder.jpg',
    tagline: 'Vision, product direction, and technical execution.',
    bio: 'Ahqaf Ali founded InvertisPrep to solve a problem he lived through every semester — great resources existed, but never in one place when they mattered. As Founder & Lead, he sets the platform\'s vision and product direction, deciding what gets built and how it reaches students. Day to day, he works across system architecture and technical execution, coordinating engineering, content, and design so everything from the PYQ library to the resume builder stays fast, reliable, and free for students.',
    focus: ['Product vision', 'System architecture', 'Technical execution'],
    linkedin: 'https://www.linkedin.com/in/ahqaf-ali/',
    github: 'https://github.com/AhqafCoder',
  },
  {
    name: 'Shivam Gupta',
    role: 'Chief Technology Officer',
    image: '/team/shivam-cto.png',
    tagline: 'Architecture, infrastructure, and engineering execution.',
    bio: 'Shivam Gupta leads technology at InvertisPrep as Chief Technology Officer. He owns the platform\'s architecture and core infrastructure — the systems that keep the PYQ library, resume builder, and quiz engine running smoothly under one roof. Beyond keeping InvertisPrep secure and scalable, he drives engineering execution across the team: shipping features, hardening performance, and setting the technical bar for everything that goes live.',
    focus: ['Platform architecture', 'Core infrastructure', 'Engineering execution'],
    github: 'https://github.com/ShivamCodesBS',
    instagram: 'https://instagram.com/cruxial.aep',
  },
  {
    name: 'Sumanjeet Raj',
    role: 'Content Lead',
    image: '/team/member2.jpg',
    tagline: 'Keeps the PYQ library accurate, complete, and semester-perfect.',
    bio: 'Sumanjeet Raj is the Content Lead at InvertisPrep. He oversees educational content curation, syllabus tracking, and continuous updates — making sure every question paper and syllabus document on the platform is accurate and genuinely useful before exams.',
    focus: ['Content curation', 'Syllabus tracking', 'Paper verification'],
    linkedin: 'https://www.linkedin.com/in/sumanjeet-raj-a59209380/',
    github: 'https://github.com/Sumanjeetraj',
  },
  {
    name: 'Rajan Sharma',
    role: 'Frontend Developer',
    image: '/team/member3.jpg',
    tagline: 'Builds the responsive, polished interfaces students use daily.',
    bio: 'Rajan Sharma is a Frontend Developer at InvertisPrep. He builds modern, highly-polished, responsive user experiences — the pages and flows students touch every day — keeping the platform accessible and engaging across devices.',
    focus: ['UI implementation', 'Responsive design', 'UX polish'],
    linkedin: 'https://linkedin.com/in/rajan-sharma-stack',
    github: 'https://github.com/rajan2436',
  },
  {
    name: 'Bakhtiyar Ali',
    role: 'Data Analyst',
    image: '/team/member4.jpg',
    tagline: 'Turns student feedback and usage data into better resources.',
    bio: 'Bakhtiyar Ali is the Data Analyst at InvertisPrep. He drives data analysis, feedback evaluation, and reporting — aligning our question banks and preparation resources with what students actually need, based on real usage patterns.',
    focus: ['Analytics', 'Feedback loops', 'Reporting'],
    linkedin: 'https://www.linkedin.com/in/bakhtiyar-ali-38526a37a',
    github: 'https://github.com/Bakhtiyarali291-png',
  },
  {
    name: 'Khanak Aggarwal',
    role: 'Operations Manager',
    image: '/team/member5.jpg',
    tagline: 'Keeps timelines, tasks, and teams moving in one direction.',
    bio: 'Khanak Aggarwal is the Operations Manager at InvertisPrep. She handles daily task management, timelines, and operational alignment — making sure designers, developers, and writers stay in sync and ship on schedule.',
    focus: ['Planning', 'Cross-team coordination', 'Timelines'],
    linkedin: 'https://www.linkedin.com/in/khanak-agarwal-24ka',
    instagram: 'https://insta.openinapp.co/ln1gy',
  },
  {
    name: 'Prarthna Gupta',
    role: 'Marketing Specialist',
    image: '/team/member6.jpg',
    tagline: 'Takes InvertisPrep to more students, on campus and online.',
    bio: 'Prarthna Gupta is the Marketing Specialist at InvertisPrep. She drives communication strategies, public relations, and outreach campaigns — growing InvertisPrep\'s student community and making sure new features reach the people they\'re built for.',
    focus: ['Campaigns', 'Public relations', 'Community outreach'],
    linkedin:
      'https://www.linkedin.com/in/prarthna-gupta-a7076037a?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    instagram: 'https://www.instagram.com/praru_20?igsh=MWdidGx1ejR5amRncw==',
  },
  {
    name: 'Krishu Kumar',
    role: 'Frontend Developer',
    image: '/team/member7.jpg',
    tagline: 'Maintains styling consistency and component quality everywhere.',
    bio: 'Krishu Kumar is a Frontend Developer at InvertisPrep. He works on design implementations, styling consistency, and the shared component library — enhancing performance and keeping the experience coherent across every device.',
    focus: ['Design systems', 'Components', 'Performance'],
    linkedin: 'https://www.linkedin.com/in/krishukumar72',
    github: 'https://github.com/kkrishu',
  },
];

const leadership = allMembers.slice(0, 2);
const coreTeam = allMembers.slice(2);

/* ── Helpers ────────────────────────────────────────────────────────── */
function socialsOf(member: Member) {
  const links = [
    { icon: Linkedin, href: member.linkedin, label: 'LinkedIn' },
    { icon: Github, href: member.github, label: 'GitHub' },
    { icon: Instagram, href: member.instagram, label: 'Instagram' },
  ].filter((l): l is { icon: typeof Linkedin; href: string; label: string } => Boolean(l.href));

  return (
    <div className="flex items-center gap-2">
      {links.map(({ icon: Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} on ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-all duration-200 hover:scale-110 hover:bg-slate-700"
        >
          <Icon className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

/* ── Member detail overlay with Motion.dev Layout Shared ID ─────────── */
function MemberOverlay({ member, onClose }: { member: Member; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid sm:grid-cols-[260px_1fr]">
          <div
            className="relative h-72 w-full bg-slate-100 sm:h-auto sm:min-h-[480px]"
          >
            <Image
              src={member.image}
              alt={member.name}
              fill
              sizes="(min-width: 640px) 260px, 100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-5 pt-16 sm:hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">{member.role}</p>
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
            </div>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            <div>
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-xs font-bold uppercase tracking-widest text-indigo-600">{member.role}</motion.p>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{member.name}</motion.h3>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-1 text-sm font-medium text-slate-500">{member.tagline}</motion.p>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-sm leading-relaxed text-slate-600">{member.bio}</motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Focus areas</p>
              <div className="flex flex-wrap gap-2">
                {member.focus.map((f) => (
                  <span key={f} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{f}</span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              {socialsOf(member)}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Scrolling team strip with smooth mouse drag & infinite scroll ─── */
function TeamScrollStrip({ onMemberClick }: { onMemberClick: (m: Member) => void }) {
  const orderedMembers = [...allMembers, ...allMembers, ...allMembers];
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [singleWidth, setSingleWidth] = useState(0);

  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const dragDistance = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);

  // Measure exact pixel width of 1 complete set of members
  useEffect(() => {
    const calculate = () => {
      if (!trackRef.current) return;
      const children = Array.from(trackRef.current.children) as HTMLElement[];
      if (children.length >= allMembers.length * 2) {
        const first = children[0];
        const nextSetFirst = children[allMembers.length];
        if (first && nextSetFirst) {
          const width = nextSetFirst.offsetLeft - first.offsetLeft;
          if (width > 0) setSingleWidth(width);
        }
      }
    };
    calculate();
    const timer = setTimeout(calculate, 200);
    window.addEventListener('resize', calculate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculate);
    };
  }, []);

  // Continuous animation frame loop
  useAnimationFrame((time, delta) => {
    // When dragging with mouse, movement is handled by mouseMove
    if (isDragging.current) return;

    // Apply friction to momentum velocity after drag release
    if (Math.abs(velocity.current) > 0.1) {
      velocity.current *= 0.94;
    } else {
      velocity.current = 0;
    }

    // Base auto-scroll speed (pixels/sec). Constantly scrolls — never stops on hover.
    const baseSpeed = 38;
    const move = (baseSpeed + velocity.current) * (delta / 1000);

    let cur = x.get() - move;

    // Infinite wrapping logic
    if (singleWidth > 0) {
      if (cur <= -singleWidth) {
        cur += singleWidth;
      } else if (cur > 0) {
        cur -= singleWidth;
      }
    }

    x.set(cur);
  });

  // Only horizontal trackpad/mouse scroll — normal vertical wheel scrolls page freely
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept if explicitly scrolling horizontally (e.g. trackpad swipe left/right)
      // Never block normal vertical page scrolling!
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
        e.preventDefault();
        let cur = x.get() - e.deltaX * 0.9;
        if (singleWidth > 0) {
          if (cur <= -singleWidth) cur += singleWidth;
          if (cur > 0) cur -= singleWidth;
        }
        x.set(cur);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [singleWidth, x]);

  // Ensure dragging stops even if mouse is released outside window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    lastX.current = e.clientX;
    dragDistance.current = 0;
    velocity.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastX.current;
    dragDistance.current += Math.abs(delta);
    lastX.current = e.clientX;
    velocity.current = -delta * 14;

    let cur = x.get() + delta;
    if (singleWidth > 0) {
      if (cur <= -singleWidth) cur += singleWidth;
      if (cur > 0) cur -= singleWidth;
    }
    x.set(cur);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <section className="relative mt-14 sm:mt-20 py-4 select-none">
      {/* Arch top curve */}
      <div className="absolute -top-16 sm:-top-20 left-0 right-0 h-20 sm:h-24 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" className="absolute bottom-0 h-full w-full">
          <path d="M0 100V65C200 15 450 0 720 0s520 15 720 65v35H0Z" className="fill-slate-50" />
        </svg>
      </div>

      {/* Subtle edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50/85 via-slate-50/40 to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50/85 via-slate-50/40 to-transparent sm:w-28" />

      {/* Interactive Drag & Scroll Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDragging.current = false;
        }}
        className="w-full overflow-hidden py-14 sm:py-20 cursor-grab active:cursor-grabbing"
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex flex-nowrap w-max items-end gap-6 sm:gap-8 will-change-transform"
        >
          {orderedMembers.map((member, i) => (
            <div
              key={`${member.name}-${i}`}
              onClick={() => {
                if (dragDistance.current > 6) return;
                onMemberClick(member);
              }}
              className="group relative flex-shrink-0 cursor-pointer focus:outline-none"
            >
              <div
                className="relative overflow-hidden rounded-[1.75rem] bg-slate-200 shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.08] group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:shadow-indigo-500/20"
                style={{
                  width: 'clamp(185px, 20vw, 270px)',
                  height: 'clamp(255px, 28vw, 370px)',
                }}
              >
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="270px"
                  draggable={false}
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-85 pointer-events-none" />

                {/* Arrow hint badge */}
                <div className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75 pointer-events-none">
                  <ArrowUpRight className="h-4 w-4 text-indigo-600" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 transition-transform duration-300 text-left pointer-events-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {member.role}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-white leading-tight sm:text-lg">
                    {member.name}
                  </h3>
                  <div className="mt-1.5 flex h-0 items-center gap-1.5 overflow-hidden text-[11px] font-medium text-indigo-300 transition-all duration-400 group-hover:h-5">
                    <span>View profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Arch bottom curve */}
      <div className="absolute -bottom-16 sm:-bottom-20 left-0 right-0 h-20 sm:h-24 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" className="absolute top-0 h-full w-full">
          <path d="M0 0v35c200 50 450 65 720 65s520-15 720-65V0H0Z" className="fill-slate-50" />
        </svg>
      </div>
    </section>
  );
}

/* ── Animated timeline ──────────────────────────────────────────────── */
function TimelineDot({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute left-4 top-1 sm:left-1/2 sm:-translate-x-1/2">
      <div className="relative flex h-6 w-6 items-center justify-center">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.8, 1.4], opacity: [0.6, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute h-6 w-6 rounded-full bg-indigo-400"
            />
          )}
        </AnimatePresence>
        <motion.div
          initial={{ scale: 0 }}
          animate={isActive ? { scale: 1 } : { scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="relative z-10 h-4 w-4 rounded-full border-[3px] border-indigo-500 bg-white shadow-md shadow-indigo-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isActive ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
            className="absolute inset-[3px] rounded-full bg-indigo-500"
          />
        </motion.div>
      </div>
    </div>
  );
}

function TeamTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ['0%', '100%']);

  const points = [
    { title: 'The problem we lived', body: 'Question papers scattered across group chats, drives, and notice boards. Never there when exams were close.', icon: BookOpen, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { title: 'A student effort', body: 'What started as sharing PDFs between friends grew into a structured library — then a full platform.', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Built in the open', body: 'No external investors, no corporate backing. Just students building the tool they needed with the skills they had.', icon: Rocket, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { title: 'Where we are now', body: 'A verified PYQ library, syllabus tracking, resume tools, quizzes, and more — free, for every Invertis student.', icon: Sparkles, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  ];

  return (
    <div ref={timelineRef} className="relative">
      <div className="absolute left-[1.6rem] top-0 h-full w-0.5 bg-slate-200 sm:left-1/2 sm:-translate-x-px">
        <motion.div className="w-full bg-indigo-600" style={{ height: lineHeight }} />
      </div>

      <div className="space-y-16 sm:space-y-20">
        {points.map((point, i) => {
          function TimelinePoint() {
            const ref = useRef<HTMLDivElement>(null);
            const isInView = useInView(ref, { once: true, margin: '-40%' });

            return (
              <motion.div
                ref={ref}
                key={point.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20%' }}
                variants={{
                  hidden: { opacity: 0, x: i % 2 === 0 ? -50 : 50 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                }}
                className={cn(
                  'relative grid grid-cols-1 gap-4 pl-16 sm:grid-cols-2 sm:gap-12 sm:pl-0',
                  i % 2 === 0 ? 'sm:text-right' : ''
                )}
              >
                <TimelineDot isActive={isInView} />

                {i % 2 === 0 ? (
                  <>
                    <div className="sm:pr-14">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                        className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm', point.color, 'sm:ml-auto')}
                      >
                        <point.icon className="h-5 w-5" />
                      </motion.div>
                      <h4 className="text-xl font-bold text-slate-900">{point.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">{point.body}</p>
                    </div>
                    <div />
                  </>
                ) : (
                  <>
                    <div className="hidden sm:block" />
                    <div className="sm:pl-14">
                      <motion.div
                        initial={{ scale: 0, rotate: 20 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                        className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm', point.color)}
                      >
                        <point.icon className="h-5 w-5" />
                      </motion.div>
                      <h4 className="text-xl font-bold text-slate-900">{point.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">{point.body}</p>
                    </div>
                  </>
                )}
              </motion.div>
            );
          }
          return <TimelinePoint key={point.title} />;
        })}
      </div>
    </div>
  );
}

/* ── Leadership Card with 3D Tilt & Ambient Glow (Balanced width) ─── */
function LeadershipCard({
  member,
  index,
  onSelect,
}: {
  member: Member;
  index: number;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 180, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 180, damping: 20 });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function resetMouse() {
    x.set(0);
    y.set(0);
  }

  const isAlt = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-sm transition-all duration-500 group-hover:border-indigo-400 group-hover:shadow-xl group-hover:shadow-indigo-500/5">
        <div className="relative z-10 grid grid-cols-1 items-center gap-0 md:grid-cols-12">
          <div className={cn('md:col-span-5', isAlt && 'md:order-2')}>
            <button
              type="button"
              onClick={onSelect}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 text-left focus:outline-none md:aspect-auto md:h-full md:min-h-[440px]"
            >
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(min-width: 768px) 38vw, 100vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-25" />
              <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
                <ArrowUpRight className="h-4 w-4 text-indigo-600" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 pt-16 md:hidden">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  {member.role}
                </p>
                <h3 className="text-xl font-bold text-white">{member.name}</h3>
              </div>
            </button>
          </div>

          <div className={cn('space-y-4 p-6 sm:p-9 md:col-span-7', isAlt && 'md:order-1')}>
            <div>
              <Badge variant="indigo">{member.role}</Badge>
              <h3 className="mt-2.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {member.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{member.tagline}</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{member.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {member.focus.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              {socialsOf(member)}
              <button
                type="button"
                onClick={onSelect}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 transition-colors hover:text-indigo-600"
              >
                Full profile
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Core Team Card with 3D Tilt & Interactive Photo ───────────────── */
function CoreTeamCard({
  member,
  index,
  onSelect,
}: {
  member: Member;
  index: number;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function resetMouse() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      variants={{
        hidden: { opacity: 0, y: 35 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className="group relative h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all duration-500 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5">
        <button
          type="button"
          onClick={onSelect}
          aria-label={`View ${member.name}'s full profile`}
          className="relative block w-full cursor-pointer overflow-hidden rounded-xl text-left focus:outline-none"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
            <Image
              src={member.image}
              alt={member.name}
              fill
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />

          {/* Action icon with smooth hover expansion */}
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 transition-colors duration-300 group-hover:text-indigo-200">
              {member.role}
            </p>
            <h3 className="text-base font-bold text-white sm:text-lg">{member.name}</h3>
          </div>
        </button>

        <div className="flex flex-1 flex-col p-3.5">
          <p className="text-sm leading-relaxed text-slate-500">{member.tagline}</p>
          <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-slate-100/80">
            {socialsOf(member)}
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 transition-colors hover:text-indigo-600"
            >
              Full bio
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function OurTeamPage() {
  const [overlayMember, setOverlayMember] = useState<Member | null>(null);

  const tooltipItems = allMembers.map((m, i) => ({
    id: i + 1,
    name: m.name,
    designation: m.role,
    image: m.image,
  }));

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 pt-14 sm:pt-20 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mx-auto max-w-3xl text-center">
          {/* Aceternity Animated Tooltip — cleanly positioned with bottom pop */}
          <motion.div variants={fadeInUp} className="mb-8 flex items-center justify-center">
            <AnimatedTooltip items={tooltipItems} />
          </motion.div>

          <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Meet the team</motion.p>

          <motion.h1 variants={fadeInUp} className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            We&apos;re a team of{' '}
            <span className="text-indigo-600">students</span>{' '}
            building for students
          </motion.h1>

          <motion.p variants={fadeInUp} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            A small, hands-on crew from Invertis University — creating the academic platform we always wished we had.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Scrolling team images ─────────────────────────────── */}
      <TeamScrollStrip onMemberClick={setOverlayMember} />

      {/* ── Member overlay with Motion.dev Layout Shared ID ─── */}
      <AnimatePresence>
        {overlayMember && <MemberOverlay member={overlayMember} onClose={() => setOverlayMember(null)} />}
      </AnimatePresence>

      {/* ── Leadership (Wider, balanced container) ───────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeInUp} className="mx-auto mb-14 max-w-2xl text-center">
          <Badge variant="indigo">Leadership</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            The people who <span className="text-purple-600">set the direction</span>
          </h2>
          <p className="mt-3 text-base text-slate-500">Students themselves — deciding what gets built, and holding the bar for how it ships.</p>
        </motion.div>

        <div className="space-y-8">
          {leadership.map((member, i) => (
            <LeadershipCard
              key={member.name}
              member={member}
              index={i}
              onSelect={() => setOverlayMember(member)}
            />
          ))}
        </div>
      </section>

      {/* ── Core team (Wider, balanced container) ────────────── */}
      <section className="border-y border-slate-100 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeInUp} className="mx-auto mb-14 max-w-2xl text-center">
            <Badge variant="outline">Core Team</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              The specialists who <span className="text-indigo-600">build it all</span>
            </h2>
            <p className="mt-3 text-base text-slate-500">Click a profile to see what each person owns and how they contribute.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreTeam.map((member, i) => (
              <CoreTeamCard
                key={member.name}
                member={member}
                index={i}
                onSelect={() => setOverlayMember(member)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Want to build with us? CTA (Clean, professional, full-width) ── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeInUp}
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm sm:p-14 lg:p-16">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Heart className="h-7 w-7 text-indigo-600" />
            </div>

            <Badge variant="indigo" className="mb-4">
              Join Our Team
            </Badge>

            <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Want to build with <span className="text-indigo-600">InvertisPrep</span>?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
              We&apos;re always looking for students passionate about education and technology — writers, designers, developers, and creators who want their work used by thousands of peers every day.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <a
                href={JOIN_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md"
              >
                Apply to Join
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
