'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Linkedin,
  Instagram,
  ArrowUpRight,
  Copy,
  Check,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';

// Official Discord logo SVG Path (no lucide equivalent)
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.76,75.76,0,0,0,72.9,0c.8.71,1.65,1.39,2.53,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.58-18.83C129,54.65,122.68,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
);

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

export default function SocialsPage() {
  const [copied, setCopied] = useState(false);
  const emailAddress = 'invertisprep@gmail.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      title: 'LinkedIn',
      handle: 'InvertisPrep',
      description:
        'Follow InvertisPrep for professional updates, university news, corporate announcements, and creator milestones.',
      stat: 'Network',
      link: 'https://www.linkedin.com/company/invertisprep/',
      icon: Linkedin,
      chipClass: 'bg-blue-100 text-blue-700',
      glowColor: 'rgba(37, 99, 235, 0.12)',
      actionText: 'Connect',
      soon: false,
    },
    {
      title: 'Instagram',
      handle: '@invertisprep.in',
      description:
        'Take a look behind the scenes, read quick infographics, daily tips, and visual feature walk-throughs.',
      stat: 'Community',
      link: 'https://www.instagram.com/invertisprep.in/',
      icon: Instagram,
      chipClass: 'bg-pink-100 text-pink-600',
      glowColor: 'rgba(236, 72, 153, 0.12)',
      actionText: 'Follow Us',
      soon: false,
    },
    {
      title: 'Discord',
      handle: 'InvertisPrep Server',
      description:
        'Join our community server for instant doubts, study rooms, announcements, and open source collaboration.',
      stat: 'Coming Soon',
      link: '#',
      icon: DiscordIcon,
      chipClass: 'bg-indigo-100 text-indigo-600',
      glowColor: 'rgba(99, 102, 241, 0.12)',
      actionText: 'Join Waitlist',
      soon: true,
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50">
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Community</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Connect With Us</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-500">
          Join our core communities to ask doubts, stay updated on schedule changes, access free study resources,
          and be part of the InvertisPrep journey.
        </p>
      </section>

      {/* Social Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {socialLinks.map((item) => (
            <motion.div key={item.title} variants={fadeInUp} className="h-full">
              <GlowCard
                glowColor={item.glowColor}
                className={`flex h-full flex-col rounded-3xl border-slate-200 bg-white p-6 transition-all duration-300 sm:p-7 ${
                  item.soon ? 'opacity-90' : 'hover:-translate-y-1'
                }`}
              >
                {/* Top row: icon chip + status badge */}
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.chipClass}`}>
                    <item.icon className="h-6 w-6" />
                  </span>
                  {item.soon ? (
                    <Badge variant="warning">Coming Soon</Badge>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="mb-6 flex-1">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">{item.title}</h3>
                  <p className="mb-3 text-xs font-semibold text-slate-400">{item.handle}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                </div>

                {/* CTA — same outer dimensions so buttons align perfectly */}
                {item.soon ? (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900/60 px-5 py-3 text-sm font-semibold text-white/60 shadow-sm cursor-not-allowed">
                    <MessageCircle className="h-4 w-4" />
                    Soon on Discord
                  </div>
                ) : (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    {item.actionText}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                )}
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Business Inquiries */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeInUp}
        >
          <GlowCard glowColor="rgba(168, 85, 247, 0.1)" className="overflow-hidden rounded-3xl border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Mail className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Business Inquiries</h2>
              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                For partnerships, branding issues, or institutional queries, copy our official mail.
              </p>

              <button
                onClick={handleCopy}
                className={`flex w-full max-w-lg items-center justify-between gap-3 rounded-xl border px-6 py-4 text-left font-mono text-sm tracking-tight transition-all duration-200 ${
                  copied
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white hover:shadow-sm'
                }`}
              >
                <span className="truncate">{emailAddress}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </GlowCard>
        </motion.div>
      </section>
    </div>
  );
}
