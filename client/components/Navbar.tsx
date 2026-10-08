"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { optimizeAvatar } from '@/lib/avatar';
import { canEnterAdmin } from '@/lib/permissions';
import {
  ChevronDown,
  LogOut,
  Home,
  BookOpen,
  FileText,
  Brain,
  Target,
  FileCheck2,
  Briefcase,
  Users,
  CalendarDays,
  Trophy,
  Mail,
  Bug,
  Info,
  LifeBuoy,
  Shield,
  ScrollText,
  User,
  UploadCloud,
  LayoutDashboard,
  Wallet,
  X,
  Linkedin,
  Instagram,
  Share2,
  HandCoins,
  Heart,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { buildLoginHref } from '@/lib/canonical';

// ============================================================
// Social links — update these two URLs to your real profiles
// ============================================================
const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/invertisprep',
  instagram: 'https://www.instagram.com/invertisprep.in',
};

// ============================================================
// Badges
// ============================================================
function SoonBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-md border border-red-300 bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none text-red-700">
      Soon
    </span>
  );
}
function NewBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-md border border-green-300 bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none text-green-700">
      New
    </span>
  );
}

// ============================================================
// Small reusable social icon button — used in the navbar strip
// and in the mobile menu footer.
// ============================================================
const SOCIAL_HOVER_STYLES = {
  linkedin: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] focus-visible:ring-[#0A66C2]/40',
  instagram: 'hover:bg-gradient-to-br hover:from-[#f9ce34]/15 hover:via-[#ee2a7b]/15 hover:to-[#6228d7]/15 hover:text-[#ee2a7b] focus-visible:ring-[#ee2a7b]/40',
} as const;

function SocialIconLink({
  href,
  label,
  platform,
  children,
}: {
  href: string;
  label: string;
  platform: keyof typeof SOCIAL_HOVER_STYLES;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors focus:outline-none focus-visible:ring-2',
        SOCIAL_HOVER_STYLES[platform]
      )}
    >
      {children}
    </a>
  );
}

// ============================================================
// Types
// ============================================================
type MenuLink = {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  badge?: 'soon' | 'new';
  external?: boolean;
  hoverClass?: string;
};

type MenuGroup = {
  key: string;
  label: string;
  badge?: 'soon' | 'new';
  links: MenuLink[];
  width?: string; // tailwind width class for the panel
};

// ============================================================
// Desktop tile used inside each dropdown panel
// ============================================================
function MenuTile({ link, onNavigate }: { link: MenuLink; onNavigate?: () => void }) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 group-hover:text-zinc-800 transition-colors [&>svg]:size-4">{link.icon}</span>
        <span className="flex items-center text-sm font-semibold text-slate-900">
          {link.title}
          {link.badge === 'soon' && <SoonBadge />}
          {link.badge === 'new' && <NewBadge />}
        </span>
      </div>
      <p className="mt-1.5 pl-6 text-xs leading-snug text-slate-500">{link.description}</p>
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cn(
          'group block rounded-lg p-3 leading-none no-underline outline-none transition-colors',
          link.hoverClass ?? 'hover:bg-zinc-50 focus:bg-zinc-50'
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        'group block rounded-lg p-3 leading-none no-underline outline-none transition-colors',
        link.hoverClass ?? 'hover:bg-zinc-50 focus:bg-zinc-50'
      )}
    >
      {content}
    </Link>
  );
}

// ============================================================
// Self-positioned dropdown item — the actual fix.
// Each trigger owns a `relative` wrapper and its panel is
// `absolute top-full` INSIDE that same wrapper, so it always
// opens directly under its own button instead of a shared,
// fixed-position viewport.
// ============================================================
function NavDropdown({
  group,
  isOpen,
  onOpen,
  onClose,
}: {
  group: MenuGroup;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-expanded={isOpen}
        className={cn(
          'flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors',
          'hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200',
          isOpen && 'bg-zinc-100 text-zinc-900'
        )}
      >
        {group.label}
        {group.badge === 'new' && <NewBadge />}
        {group.badge === 'soon' && <SoonBadge />}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-zinc-900')}
        />
      </button>

      {/* Panel — same surface treatment as the navbar itself (white/95 + blur)
          so there's no visible seam between bar and panel. */}
      <div
        className={cn(
          'absolute left-0 top-full z-50 pt-2 transition-all duration-150',
          isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        )}
      >
        <div
          className={cn(
            'rounded-xl border border-slate-200/70 bg-white/95 p-2 shadow-xl backdrop-blur-md',
            group.width ?? 'w-[300px]'
          )}
        >
          <ul className="grid gap-1">
            {group.links.map((l) => (
              <li key={l.href}>
                <MenuTile link={l} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Navbar
// ============================================================
export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isHiddenByFooter, setIsHiddenByFooter] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Carry the current location into the login page so the user can be
  // returned here (on the canonical domain) after authentication.
  const handleSignInClick = (e: React.MouseEvent) => {
    const destination = buildLoginHref(window.location.pathname, window.location.search);
    if (destination === '/login') {
      return;
    }
    e.preventDefault();
    router.push(destination);
  };

  // Hide navbar on the protected PDF viewer pages
  const hideNavbar = pathname && pathname.startsWith('/view/');

  const handleOpen = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };

  const handleClose = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  // Listen for footer visibility
  useEffect(() => {
    const handleFooterVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ isVisible: boolean }>;
      setIsHiddenByFooter(customEvent.detail.isVisible);
    };

    window.addEventListener('footerVisibilityChange', handleFooterVisibility);
    return () => window.removeEventListener('footerVisibilityChange', handleFooterVisibility);
  }, []);

  // Close on outside click and on Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  if (hideNavbar) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // silent
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatDisplayName = () => (user ? user.email?.split('@')[0] || '' : '');

  // ---------- Menu catalogs ----------
  const academicLinks: MenuLink[] = [
    { title: 'PYQ Papers', href: '/pyq', description: 'Browse previous year question papers by department & semester.', icon: <BookOpen /> , badge: 'new'},
    { title: 'Syllabus', href: '/resources/syllabus', description: 'Download syllabus documents for every course.', icon: <FileText />, badge: 'new' },
    { title: 'Quizzo', href: '/quizz0', description: 'Practice quizzes & timed mock tests.', icon: <Brain />, badge: 'new' },
  ];

  const careerLinks: MenuLink[] = [
    { title: 'ATS Score Checker', href: '/ats-score', description: 'Check how your resume scores against ATS filters.', icon: <Target />, badge: 'new' },
    { title: 'Resume Builder', href: user ? '/resumes' : '/resume-builder', description: 'Create, manage and export ATS-friendly resumes.', icon: <FileCheck2 />, badge: 'new' },
    { title: 'Career Hub', href: '/coming-soon/career', description: 'Internships, jobs & hackathons for students.', icon: <Briefcase />, badge: 'soon' },
  ];

  const communityLinks: MenuLink[] = [
    { title: 'Clubs', href: '/club', description: 'Discover and join campus clubs.', icon: <Users />, badge: 'soon' },
    { title: 'Events', href: '/events', description: 'Calendar of fests, talks & workshops.', icon: <CalendarDays />, badge: 'new' },
    { title: 'Leaderboard', href: '/leaderboard', description: 'See top contributors & rank up.', icon: <Trophy />, badge: 'new' },
    { title: 'Our Team', href: '/our-team', description: 'Meet the people behind InvertisPrep.', icon: <Users />, badge: 'new' },
  ];

  const supportLinks: MenuLink[] = [
    { title: 'Contact', href: '/contact', description: 'Reach out to the InvertisPrep team.', icon: <Mail /> },
    { title: 'Report a Bug', href: '/report-bug', description: 'Found something broken? Tell us.', icon: <Bug /> },
    { title: 'Support', href: '/support', description: 'Help center & FAQs.', icon: <LifeBuoy /> },
    { title: 'About', href: '/about', description: 'What InvertisPrep is all about.', icon: <Info /> },
    { title: 'Socials', href: '/socials', description: 'Find us on LinkedIn, Instagram & more.', icon: <Share2 /> },
  ];

  const legalLinks = [
    { title: 'Privacy Policy', href: '/privacy-policy', icon: <Shield className="h-4 w-4" /> },
    { title: 'Terms of Service', href: '/terms-of-service', icon: <ScrollText className="h-4 w-4" /> },
  ];

  const groups: MenuGroup[] = [
    { key: 'academics', label: 'Academics', badge: 'new', links: academicLinks, width: 'w-[300px]' },
    { key: 'career', label: 'Career', badge: 'new', links: careerLinks, width: 'w-[300px]' },
    { key: 'community', label: 'Community', badge: 'soon', links: communityLinks, width: 'w-[320px]' },
    { key: 'support', label: 'Support', links: supportLinks, width: 'w-[300px]' },
  ];

  return (
    <nav
      ref={navRef}
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md transition-transform duration-500",
        isHiddenByFooter ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="InvertisPrep home">
  <span
    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-xl sm:text-2xl tracking-tighter text-transparent"
    style={{
      fontFamily: 'Inter, sans-serif',
      fontWeight: 900,
      WebkitTextStroke: '0.6px currentColor',
      paintOrder: 'stroke fill',
    }}
  >
    INVERTISPREP&nbsp;
  </span>
</Link>

        {/* ---------- Desktop nav ---------- */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
          <div className="flex items-center gap-0.5">
            {groups.map((g) => (
              <NavDropdown
                key={g.key}
                group={g}
                isOpen={openMenu === g.key}
                onOpen={() => handleOpen(g.key)}
                onClose={handleClose}
              />
            ))}
          </div>
        </div>

        {/* ---------- Right side: socials / auth / mobile ---------- */}
        <div className="flex items-center gap-2">
          {/* Social icons — visible on desktop, sit right before the auth control */}
          <div className="hidden items-center gap-0.5 border-r border-slate-200 pr-2 mr-1 lg:flex">
            <SocialIconLink href={SOCIAL_LINKS.linkedin} label="InvertisPrep on LinkedIn" platform="linkedin">
              <Linkedin className="h-4 w-4" />
            </SocialIconLink>
            <SocialIconLink href={SOCIAL_LINKS.instagram} label="InvertisPrep on Instagram" platform="instagram">
              <Instagram className="h-4 w-4" />
            </SocialIconLink>
          </div>

          {/* Mobile menu trigger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  <span className="relative block h-4 w-5">
                    <span
                      className={cn(
                        'absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
                        mobileOpen && 'top-[7px] rotate-45'
                      )}
                    />
                    <span
                      className={cn(
                        'absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
                        mobileOpen && 'opacity-0'
                      )}
                    />
                    <span
                      className={cn(
                        'absolute left-0 top-3.5 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
                        mobileOpen && 'top-[7px] -rotate-45'
                      )}
                    />
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[86%] max-w-[380px] overflow-y-auto border-l border-slate-200 p-0 shadow-2xl sm:max-w-sm [&_[data-slot=sheet-close]]:hidden [&>button]:hidden"
              >
                <MobileMenu
                  user={user}
                  academicLinks={academicLinks}
                  careerLinks={careerLinks}
                  communityLinks={communityLinks}
                  supportLinks={supportLinks}
                  legalLinks={legalLinks}
                  getInitials={getInitials}
                  formatDisplayName={formatDisplayName}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex lg:items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-1.5 py-1.5 pr-3 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50">
                    <Avatar className="h-7 w-7 ring-1 ring-zinc-200/50">
                      {user.picture && (
                        <AvatarImage
                          src={optimizeAvatar(user.picture)}
                          alt={user.name || 'User'}
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                        {user.name ? getInitials(user.name) : user.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
                      {user.name ? user.name.split(' ')[0] : formatDisplayName()}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10 ring-1 ring-zinc-200">
                      {user.picture && (
                        <AvatarImage
                          src={optimizeAvatar(user.picture)}
                          alt={user.name || 'User'}
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs font-bold">
                        {user.name ? getInitials(user.name) : user.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-col space-y-0.5">
                      <span className="block truncate text-sm font-semibold text-slate-800">{user.name || formatDisplayName()}</span>
                      <span className="block truncate text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4 text-slate-500" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="w-full cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4 text-slate-500" />
                      <span className="flex-1">QCWallet</span>
                      {user.qcoins !== undefined && (
                        <span className="ml-auto flex items-center gap-0.5 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                          {user.qcoins.toLocaleString('en-IN')} QC
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pyq/upload" className="w-full cursor-pointer">
                      <UploadCloud className="mr-2 h-4 w-4 text-slate-500" /> Upload PYQ
                    </Link>
                  </DropdownMenuItem>

                  {canEnterAdmin(user) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="w-full cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/papers" className="w-full cursor-pointer">
                          <BookOpen className="mr-2 h-4 w-4 text-slate-500" /> Manage Papers
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/upload" className="w-full cursor-pointer">
                          <UploadCloud className="mr-2 h-4 w-4 text-slate-500" /> Admin Upload
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" onClick={handleSignInClick}>
                <Button className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 rounded-md font-medium px-5">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// Mobile menu — categorized accordion inside the Sheet
// ============================================================
type MobileMenuProps = {
  user: ReturnType<typeof useAuth>['user'];
  academicLinks: MenuLink[];
  careerLinks: MenuLink[];
  communityLinks: MenuLink[];
  supportLinks: MenuLink[];
  legalLinks: { title: string; href: string; icon: React.ReactNode }[];
  getInitials: (n: string) => string;
  formatDisplayName: () => string;
  onNavigate: () => void;
  onLogout: () => void;
};

function MobileLinkRow({ link, onNavigate }: { link: MenuLink; onNavigate: () => void }) {
  const content = (
    <>
      <span className="text-zinc-400 group-hover:text-zinc-800 transition-colors [&>svg]:size-4">{link.icon}</span>
      <span className="flex items-center">
        {link.title}
        {link.badge === 'soon' && <SoonBadge />}
        {link.badge === 'new' && <NewBadge />}
      </span>
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors',
          link.hoverClass ?? 'hover:bg-zinc-100 hover:text-zinc-900'
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors',
        link.hoverClass ?? 'hover:bg-indigo-50 hover:text-indigo-600'
      )}
    >
      {content}
    </Link>
  );
}

function MobileMenu({
  user,
  academicLinks,
  careerLinks,
  communityLinks,
  supportLinks,
  legalLinks,
  getInitials,
  formatDisplayName,
  onNavigate,
  onLogout,
}: MobileMenuProps) {
  const router = useRouter();

  // Same deep-link preservation as the desktop navbar Sign In button.
  const handleSignInClick = (e: React.MouseEvent) => {
    const destination = buildLoginHref(window.location.pathname, window.location.search);
    if (destination === '/login') {
      return;
    }
    e.preventDefault();
    router.push(destination);
  };

  const groups: { value: string; label: string; links: MenuLink[] }[] = [
    { value: 'academics', label: 'Academics', links: academicLinks },
    { value: 'career', label: 'Career', links: careerLinks },
    { value: 'community', label: 'Community', links: communityLinks },
    { value: 'support', label: 'Support', links: supportLinks },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header: no repeated wordmark — just the close control and account state.
          The brand already lives in the navbar behind this full-width sheet. */}
      <div className="relative border-b border-slate-100 px-4 pb-5 pt-4">
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="absolute right-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          <X className="h-5 w-5" />
        </button>

        {user ? (
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <Avatar className="h-16 w-16 ring-1 ring-zinc-200 shadow-sm">
              {user.picture && (
                <AvatarImage
                  src={optimizeAvatar(user.picture)}
                  alt={user.name || 'User'}
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-zinc-100 text-zinc-700 text-lg font-bold">
                {user.name ? getInitials(user.name) : user.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-800">{user.name || formatDisplayName()}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="pt-2 text-center text-sm font-semibold text-slate-500">Menu</div>
        )}
      </div>

      {!user && (
        <div className="p-4 pb-1">
          <Link
            href="/login"
            onClick={(e) => {
              handleSignInClick(e);
              onNavigate();
            }}
          >
            <Button className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-md">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* Body: scrollable accordion menu */}
      <div className="flex-1 overflow-y-auto p-3">
        <Accordion type="multiple" defaultValue={['academics']} className="w-full">
          {groups.map((g) => (
            <AccordionItem key={g.value} value={g.value} className="border-0">
              <AccordionTrigger className="rounded-lg px-3 py-3 text-sm font-semibold capitalize text-zinc-800 hover:bg-zinc-100 hover:no-underline">
                {g.label}
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                {g.links.map((l) => (
                  <MobileLinkRow key={l.href} link={l} onNavigate={onNavigate} />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Account section (logged in) */}
        {user && (
          <div className="mt-2">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">My Account</p>
            <Link
              href="/profile"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-zinc-100 hover:text-zinc-900 group"
            >
              <User className="size-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" /> Profile
            </Link>
            <Link
              href="/wallet"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-zinc-100 hover:text-zinc-900 group"
            >
              <Wallet className="size-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
              <span className="flex-1">QCWallet</span>
              {user?.qcoins !== undefined && (
                <span className="flex items-center gap-0.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {user.qcoins.toLocaleString('en-IN')} QC
                </span>
              )}
            </Link>
            <Link
              href="/pyq/upload"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-zinc-100 hover:text-zinc-900 group"
            >
              <UploadCloud className="size-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" /> Upload PYQ
            </Link>

{canEnterAdmin(user) ? (
              <Link
                href="/admin/dashboard"
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-zinc-100 hover:text-zinc-900 group"
              >
                <LayoutDashboard className="size-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" /> Admin Dashboard
              </Link>
            ) : null}
          </div>
        )}

        {/* Legal */}
        <div className="mt-2 border-t border-slate-100 pt-2">
          {legalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {l.icon} {l.title}
            </Link>
          ))}
        </div>

        {/* Social icons */}
        <div className="mt-2 flex items-center gap-1 border-t border-slate-100 px-3 pt-3">
          <SocialIconLink href={SOCIAL_LINKS.linkedin} label="InvertisPrep on LinkedIn" platform="linkedin">
            <Linkedin className="h-4 w-4" />
          </SocialIconLink>
          <SocialIconLink href={SOCIAL_LINKS.instagram} label="InvertisPrep on Instagram" platform="instagram">
            <Instagram className="h-4 w-4" />
          </SocialIconLink>
        </div>
      </div>

      {/* Footer: logout */}
      {user && (
        <div className="border-t border-slate-200 p-4">
          <Button
            variant="outline"
            className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              onLogout();
              onNavigate();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>
      )}
    </div>
  );
}