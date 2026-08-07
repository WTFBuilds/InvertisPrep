'use client';

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  Github,
  Twitter,
  Youtube,
  Linkedin,
  Instagram,
  ArrowUpRight,
  Globe,
  Copy,
  Check,
  Compass,
  Terminal,
  ExternalLink,
  MessageSquare,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

// Official Discord logo SVG Path
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.76,75.76,0,0,0,72.9,0c.8.71,1.65,1.39,2.53,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.58-18.83C129,54.65,122.68,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
);

// 21st.dev inspired Card with Mouse Spotlight Effect
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

function SpotlightCard({ children, className }: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 p-6 md:p-8 overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5",
        className
      )}
    >
      {/* Background Spotlight Radial Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              var(--spotlight-color),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
}

export default function SocialsPage() {
  const [copied, setCopied] = useState(false);
  const emailAddress = "contact@invertisprep.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      title: "GitHub",
      description: "Explore our open source templates, quiz engines, and study planners. Contribute to the future of learning.",
      handle: "@AhqafCoder",
      stat: "450+ Stars",
      link: "https://github.com",
      icon: Github,
      actionText: "Fork & Star",
    },
    {
      title: "YouTube",
      description: "Watch structured course tutorials, solution walkthroughs, and exam preparation live streams.",
      handle: "InvertisPrep Official",
      stat: "12.5k+ Subs",
      link: "https://youtube.com",
      icon: Youtube,
      actionText: "Subscribe",
    },
    {
      title: "Telegram",
      description: "Get instant notifications, study sheets, daily practice papers, and exam syllabus announcements.",
      handle: "@InvertisPrep",
      stat: "9.2k+ Students",
      link: "https://telegram.org",
      icon: Send,
      actionText: "Join Channel",
    },
    {
      title: "LinkedIn",
      description: "Follow InvertisPrep for professional updates, corporate announcements, and creator milestones.",
      handle: "InvertisPrep",
      stat: "3.1k+ Network",
      link: "https://linkedin.com",
      icon: Linkedin,
      actionText: "Connect",
    },
    {
      title: "Instagram",
      description: "Take a look behind the scenes, read quick infographics, daily tips, and visual feature walk-throughs.",
      handle: "@invertisprep",
      stat: "18.4k+ Reach",
      link: "https://instagram.com",
      icon: Instagram,
      actionText: "Follow Us",
    },
    {
      title: "X",
      description: "Follow us for product updates, engineering logs, feature polls, and fast customer queries.",
      handle: "@InvertisPrep",
      stat: "1.5k+ Readers",
      link: "https://x.com",
      icon: Twitter,
      actionText: "Follow",
    },
  ];

  const words = "CONNECT WITH US".split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    },
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-zinc-100 font-sans overflow-hidden py-16 md:py-8">
      {/* 21st.dev CSS custom properties */}
      <style jsx global>{`
        :root {
          --spotlight-color: rgba(0, 0, 0, 0.035);
        }
        .dark {
          --spotlight-color: rgba(255, 255, 255, 0.06);
        }
      `}</style>

      {/* Blueprint Grid Lines (Draws itself on render) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10">
        {/* Vertical lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`v-line-${i}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 }}
            className="absolute top-0 bottom-0 w-[1px] bg-zinc-300 dark:bg-zinc-800 origin-top"
            style={{ left: `${i * 25}%` }}
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`h-line-${i}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.2 }}
            className="absolute left-0 right-0 h-[1px] bg-zinc-300 dark:bg-zinc-800 origin-left"
            style={{ top: `${i * 33.3}%` }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-6xl">

        {/* Header Block */}
        <div className="max-w-3xl mb-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="text-4xl md:text-6xl lg:text-6xl font-black uppercase leading-none mb-6"
          >
            {words.map((word, idx) => (
              <span key={idx} className="inline-block mr-4 overflow-hidden">
                <motion.span variants={wordVariants} className="inline-block">
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg font-medium leading-relaxed tracking-tight"
          >
            Connect with our core communities. Ask doubts, stay updated on schedule alterations, access free study resources, and contribute to open source developments.
          </motion.p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {socialLinks.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 * idx + 0.3 }}
            >
              <SpotlightCard className="h-full">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md font-mono text-zinc-500">
                    {item.stat}
                  </span>
                </div>

                <div className="mb-6 flex-1">
                  <h4 className="font-bold text-lg text-black dark:text-white uppercase tracking-tight mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs font-mono text-zinc-500 font-semibold mb-3">
                    {item.handle}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <Link
                  href={item.link}
                  target="_blank"
                  className="flex justify-between items-center w-full border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-auto text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors group/item"
                >
                  <span>{item.actionText}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/item:translate-x-1 group-hover/item:-translate-y-1" />
                </Link>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Copy Mail Clipboard CTA & Footer */}
        <div className="flex flex-col items-center justify-center border-t border-zinc-200 dark:border-zinc-800 pt-16 gap-10">
          <div className="text-center max-w-md">
            <h4 className="font-bold text-lg uppercase tracking-wider mb-2">Business Inquiries</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              For partnerships, branding issues, or institutional queries, copy our official mail.
            </p>

            <button
              onClick={handleCopy}
              className={cn(
                "w-full flex justify-between items-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-xl font-mono text-sm tracking-tight transition-all duration-200 group",
                copied && "border-emerald-500/50 dark:border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/5"
              )}
            >
              <span className={cn("text-zinc-600 dark:text-zinc-300", copied && "text-emerald-500 dark:text-emerald-400")}>
                {emailAddress}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>COPY</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
