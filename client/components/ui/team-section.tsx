"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Youtube, Linkedin, Instagram, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Define interfaces for props
export interface SocialLink {
  icon: React.ElementType; // For Shadcn/Lucide icons or any SVG component
  href: string;
}

export interface TeamMember {
  name: string;
  designation: string;
  imageSrc: string;
  description?: string;
  githubUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  socialLinks?: SocialLink[];
}

export interface TeamSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  members: TeamMember[];
  registerLink?: string;
  logo?: React.ReactNode;
  socialLinksMain?: SocialLink[];
}

const COLOR_PRESETS = [
  {
    bg: "bg-rose-500/10 dark:bg-rose-950/20",
    border: "border-transparent group-hover:border-rose-300 dark:group-hover:border-rose-800",
    glow: "from-rose-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900 dark:to-rose-800",
    avatarText: "text-rose-600 dark:text-rose-300",
    hoverBorder: "group-hover:border-rose-400 dark:group-hover:border-rose-500",
    cardBorder: "border-rose-400 dark:border-rose-600",
    imageBorder: "border-rose-400 dark:border-rose-600",
    textHighlight: "text-rose-600 dark:text-rose-400",
    hoverBg: "hover:bg-rose-600 dark:hover:bg-rose-500",
    cardShadow: "shadow-2xl shadow-rose-500/10 dark:shadow-rose-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#f43f5e_80%,#fda4af_100%)]",
  },
  {
    bg: "bg-indigo-500/10 dark:bg-indigo-950/20",
    border: "border-transparent group-hover:border-indigo-300 dark:group-hover:border-indigo-800",
    glow: "from-indigo-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800",
    avatarText: "text-indigo-600 dark:text-indigo-300",
    hoverBorder: "group-hover:border-indigo-400 dark:group-hover:border-indigo-500",
    cardBorder: "border-indigo-400 dark:border-indigo-600",
    imageBorder: "border-indigo-400 dark:border-indigo-600",
    textHighlight: "text-indigo-600 dark:text-indigo-400",
    hoverBg: "hover:bg-indigo-600 dark:hover:bg-indigo-500",
    cardShadow: "shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#6366f1_80%,#a5b4fc_100%)]",
  },
  {
    bg: "bg-amber-500/10 dark:bg-amber-950/20",
    border: "border-transparent group-hover:border-amber-300 dark:group-hover:border-amber-800",
    glow: "from-amber-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800",
    avatarText: "text-amber-600 dark:text-amber-300",
    hoverBorder: "group-hover:border-amber-400 dark:group-hover:border-amber-500",
    cardBorder: "border-amber-400 dark:border-amber-600",
    imageBorder: "border-amber-400 dark:border-amber-600",
    textHighlight: "text-amber-600 dark:text-amber-400",
    hoverBg: "hover:bg-amber-600 dark:hover:bg-amber-500",
    cardShadow: "shadow-2xl shadow-amber-500/10 dark:shadow-amber-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#f59e0b_80%,#fcd34d_100%)]",
  },
  {
    bg: "bg-emerald-500/10 dark:bg-emerald-950/20",
    border: "border-transparent group-hover:border-emerald-300 dark:group-hover:border-emerald-800",
    glow: "from-emerald-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800",
    avatarText: "text-emerald-600 dark:text-emerald-300",
    hoverBorder: "group-hover:border-emerald-400 dark:group-hover:border-emerald-500",
    cardBorder: "border-emerald-400 dark:border-emerald-600",
    imageBorder: "border-emerald-400 dark:border-emerald-600",
    textHighlight: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-600 dark:hover:bg-emerald-500",
    cardShadow: "shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#10b981_80%,#6ee7b7_100%)]",
  },
  {
    bg: "bg-violet-500/10 dark:bg-violet-950/20",
    border: "border-transparent group-hover:border-violet-300 dark:group-hover:border-violet-800",
    glow: "from-violet-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800",
    avatarText: "text-violet-600 dark:text-violet-300",
    hoverBorder: "group-hover:border-violet-400 dark:group-hover:border-violet-500",
    cardBorder: "border-violet-400 dark:border-violet-600",
    imageBorder: "border-violet-400 dark:border-violet-600",
    textHighlight: "text-violet-600 dark:text-violet-400",
    hoverBg: "hover:bg-violet-600 dark:hover:bg-violet-500",
    cardShadow: "shadow-2xl shadow-violet-500/10 dark:shadow-violet-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#8b5cf6_80%,#c4b5fd_100%)]",
  },
  {
    bg: "bg-sky-500/10 dark:bg-sky-950/20",
    border: "border-transparent group-hover:border-sky-300 dark:group-hover:border-sky-800",
    glow: "from-sky-500/20 to-transparent",
    avatarBg: "bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800",
    avatarText: "text-sky-600 dark:text-sky-300",
    hoverBorder: "group-hover:border-sky-400 dark:group-hover:border-sky-500",
    cardBorder: "border-sky-400 dark:border-sky-600",
    imageBorder: "border-sky-400 dark:border-sky-600",
    textHighlight: "text-sky-600 dark:text-sky-400",
    hoverBg: "hover:bg-sky-600 dark:hover:bg-sky-500",
    cardShadow: "shadow-2xl shadow-sky-500/10 dark:shadow-sky-950/30",
    conic: "bg-[conic-gradient(from_0deg,transparent_50%,#0ea5e9_80%,#7dd3fc_100%)]",
  },
];

export interface ProfileCardProps {
  name?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  themeIndex?: number;
  onClose: () => void;
  className?: string;
}

export function ProfileCard(props: ProfileCardProps) {
  const {
    name = "Michael Chen",
    title = "Senior Software Engineer, Cloud Infrastructure",
    description = "Michael Chen is a seasoned software engineer at TechFlow Solutions with over 8 years of experience building scalable cloud infrastructure and microservices. He specializes in DevOps automation and leads the platform engineering team that serves millions of users daily.",
    imageUrl = "https://plus.unsplash.com/premium_photo-1689977807477-a579eda91fa2?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    githubUrl = "#",
    twitterUrl = "#",
    youtubeUrl = "#",
    linkedinUrl = "#",
    instagramUrl = "#",
    themeIndex = 0,
    onClose,
    className,
  } = props;

  const [imageError, setImageError] = React.useState(false);
  const initials = React.useMemo(() => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  const themeStyles = COLOR_PRESETS[themeIndex % COLOR_PRESETS.length];

  const socialIcons = [
    { icon: Github, url: githubUrl, label: "GitHub" },
    { icon: Twitter, url: twitterUrl, label: "Twitter" },
    { icon: Youtube, url: youtubeUrl, label: "YouTube" },
    { icon: Linkedin, url: linkedinUrl, label: "LinkedIn" },
    { icon: Instagram, url: instagramUrl, label: "Instagram" },
  ].filter((item) => item.url && item.url !== "#" && item.url !== "");

  return (
    <div className={cn("w-full max-w-5xl mx-auto px-4 relative", className)}>
      {/* Premium custom close button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute -top-3 right-1 md:-top-4 md:-right-4 p-2.5 rounded-full bg-white dark:bg-zinc-950 border border-solid text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 z-50 shadow-xl hover:scale-110 active:scale-95 cursor-pointer",
          themeStyles.cardBorder
        )}
        aria-label="Close details"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Desktop */}
      <div className='hidden md:flex relative items-center justify-center py-6'>
        {/* Square Image */}
        <div className={cn('w-[440px] h-[440px] rounded-3xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center border-4 border-solid shadow-2xl relative z-20', themeStyles.imageBorder)}>
          {!imageUrl || imageError ? (
            <div className="flex h-full w-full items-center justify-center font-black text-7xl select-none bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 text-indigo-600 dark:text-indigo-300">
              {initials}
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={name}
              className='w-full h-full object-cover'
              draggable={false}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        {/* Overlapping Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn('bg-white dark:bg-zinc-900 border border-solid rounded-3xl p-10 pl-24 ml-[-60px] z-10 max-w-xl flex-1 relative overflow-hidden', themeStyles.cardBorder, themeStyles.cardShadow)}
        >
          {/* Animated Border Beam */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-3xl">
            <div className={cn("absolute inset-[-200%] animate-[spin_5s_linear_infinite] opacity-60", themeStyles.conic)} />
          </div>
          {/* Inner Mask */}
          <div className="absolute inset-[1.5px] rounded-[22px] bg-white dark:bg-zinc-900 z-0" />

          {/* Card Content */}
          <div className="relative z-10">
            <div className='mb-6'>
              <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight'>
                {name}
              </h2>

              <p className={cn('text-sm font-semibold uppercase tracking-wider', themeStyles.textHighlight)}>
                {title}
              </p>
            </div>

            <p className='text-gray-600 dark:text-zinc-300 text-base leading-relaxed mb-8'>
              {description}
            </p>

            <div className='flex space-x-4'>
              {socialIcons.map(({ icon: Icon, url, label }) => (
                <Link
                  key={label}
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn('w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md group', themeStyles.hoverBg)}
                  aria-label={label}
                >
                  <Icon className='w-5 h-5 text-white dark:text-zinc-900 transition-colors group-hover:text-white' />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn('md:hidden max-w-sm mx-auto text-center bg-white dark:bg-zinc-900 border border-solid rounded-3xl p-6 pt-8 relative overflow-hidden', themeStyles.cardBorder, themeStyles.cardShadow)}
      >
        {/* Animated Border Beam */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-3xl">
          <div className={cn("absolute inset-[-200%] animate-[spin_5s_linear_infinite] opacity-60", themeStyles.conic)} />
        </div>
        {/* Inner Mask */}
        <div className="absolute inset-[1.5px] rounded-[22px] bg-white dark:bg-zinc-900 z-0" />

        {/* Content */}
        <div className="relative z-10">
          {/* Square Mobile Image */}
          <div className={cn('w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border-2 border-solid shadow-md', themeStyles.imageBorder)}>
            {!imageUrl || imageError ? (
              <div className="flex h-full w-full items-center justify-center font-black text-6xl select-none bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 text-indigo-600 dark:text-indigo-300">
                {initials}
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={name}
                className='w-full h-full object-cover'
                draggable={false}
                onError={() => setImageError(true)}
              />
            )}
          </div>

          <div className='px-2'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight'>
              {name}
            </h2>

            <p className={cn('text-sm font-semibold uppercase tracking-wider mb-4', themeStyles.textHighlight)}>
              {title}
            </p>

            <p className='text-gray-600 dark:text-zinc-300 text-sm leading-relaxed mb-6'>
              {description}
            </p>

            <div className='flex justify-center space-x-4'>
              {socialIcons.map(({ icon: Icon, url, label }) => (
                <Link
                  key={label}
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn('w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md group', themeStyles.hoverBg)}
                  aria-label={label}
                >
                  <Icon className='w-5 h-5 text-white dark:text-zinc-900 transition-colors group-hover:text-white' />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for individual Team Members to manage error states and animations
const TeamMemberCard = ({
  member,
  index,
  onClick,
}: {
  member: TeamMember;
  index: number;
  onClick: () => void;
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Generate initials for fallback avatar
  const initials = React.useMemo(() => {
    return member.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [member.name]);

  // Premium background & border color classes matching different member profiles
  const themeStyles = React.useMemo(() => {
    return COLOR_PRESETS[index % COLOR_PRESETS.length];
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl p-6 text-center border border-solid transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5 cursor-pointer",
        themeStyles.bg,
        themeStyles.border
      )}
    >
      {/* Animated Border Beam on hover */}
      <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none rounded-2xl">
        <div className={cn("absolute inset-[-200%] animate-[spin_4s_linear_infinite] opacity-60", themeStyles.conic)} />
      </div>
      {/* Inner mask to construct the 1.5px border */}
      <div className="absolute inset-[1.5px] rounded-[14px] bg-white dark:bg-zinc-950 z-0 transition-colors duration-300" />
      {/* Subtle tint match for light/dark theme inside mask */}
      <div className={cn("absolute inset-[1.5px] rounded-[14px] z-0 pointer-events-none", themeStyles.bg)} />

      {/* Background wave / glow animation */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1/2 origin-bottom scale-y-0 transform rounded-t-full bg-gradient-to-t transition-transform duration-500 ease-out group-hover:scale-y-100 z-10",
          themeStyles.glow
        )}
        style={{ transitionDelay: `${index * 30}ms` }}
      />

      {/* Member Image with mask and border animation */}
      <div
        className={cn(
          "relative z-20 h-32 w-32 overflow-hidden rounded-full border-4 border-transparent shadow-md transition-all duration-500 ease-out group-hover:scale-105",
          themeStyles.hoverBorder
        )}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
        {!member.imageSrc || imageError ? (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center font-bold text-3xl select-none",
              themeStyles.avatarBg,
              themeStyles.avatarText
            )}
          >
            {initials}
          </div>
        ) : (
          <img
            src={member.imageSrc}
            alt={member.name}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        )}
      </div>

      <h3 className="relative z-20 mt-5 font-semibold text-lg text-foreground tracking-tight sm:text-xl">
        {member.name}
      </h3>
      <p className="relative z-20 text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
        {member.designation}
      </p>

      {/* Social Links for individual members */}
      {member.socialLinks && member.socialLinks.length > 0 && (
        <div className="relative z-20 mt-5 flex gap-3.5 opacity-85 md:opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
          {member.socialLinks.map((link, linkIndex) => (
            <a
              key={linkIndex}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-all duration-200 transform hover:scale-110 p-1.5 rounded-full hover:bg-background/80 hover:shadow-sm"
            >
              <link.icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// TeamSection Component
export const TeamSection = React.forwardRef<HTMLDivElement, TeamSectionProps>(
  (
    {
      title,
      description,
      members,
      registerLink,
      logo,
      socialLinksMain,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    return (
      <section
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden bg-background py-5 md:py-6 lg:py-6",
          className
        )}
        {...props}
      >
        {/* Background Grid - for visual appeal */}
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-[0.03] pointer-events-none">
          <svg className="h-full w-full" fill="none">
            <defs>
              <pattern
                id="grid-pattern"
                x="0"
                y="0"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-foreground"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/10 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/10 -z-10 h-72 w-72 rounded-full bg-rose-500/5 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-centerflex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between mb-16 border-b border-border/40 pb-8">
            <div className="space-y-3 flex flex-wrap items-center justify-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-2xl md:text-4xl lg:text-5xl text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-sm leading-relaxed font-normal">
                {description}
              </p>
            </div>
          </div>

          {/* Team Members Grid */}
          <div className="mx-auto grid w-100% max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-center">
            {members.map((member, index) => (
              <TeamMemberCard
                key={index}
                member={member}
                index={index}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>

          {/* Main Social Links */}
          {socialLinksMain && socialLinksMain.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12 py-3 bg-muted/40 rounded-xl max-w-lg mx-auto border border-border/30">
              <div className="flex items-center gap-4">
                {socialLinksMain.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  >
                    <link.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <span className="text-muted-foreground/80 text-xs sm:text-sm font-medium border-l border-border/60 pl-6">
                www.invertisprep.com
              </span>
            </div>
          )}
        </div>

        {/* Profile Card Modal */}
        <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
          <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none sm:rounded-none [&>button]:hidden">
            {selectedIndex !== null && (
              <ProfileCard
                name={members[selectedIndex].name}
                title={members[selectedIndex].designation}
                description={members[selectedIndex].description}
                imageUrl={members[selectedIndex].imageSrc}
                githubUrl={members[selectedIndex].githubUrl}
                twitterUrl={members[selectedIndex].twitterUrl}
                youtubeUrl={members[selectedIndex].youtubeUrl}
                linkedinUrl={members[selectedIndex].linkedinUrl}
                instagramUrl={members[selectedIndex].instagramUrl}
                themeIndex={selectedIndex}
                onClose={() => setSelectedIndex(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </section>
    );
  }
);

TeamSection.displayName = "TeamSection";
