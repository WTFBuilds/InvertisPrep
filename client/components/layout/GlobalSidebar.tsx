"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  BookOpen,
  Target,
  FileCheck2,
  Briefcase,
  Users,
  CalendarDays,
  Trophy,
  HandCoins,
  Mail,
  Bug,
  LifeBuoy,
  Info,
  Share2,
  Brain,
  FileText,
  User,
  Wallet,
  UploadCloud,
  LayoutDashboard,
  LogOut,
  Heart,
  MenuSquare,
  ChevronsUpDown,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { optimizeAvatar } from "@/lib/avatar"
import SponsorPopover from "@/components/SponsorPopover"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function SoonBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-md border border-red-300 bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none text-red-700">
      Soon
    </span>
  )
}

function NewBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-md border border-green-300 bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none text-green-700">
      New
    </span>
  )
}

// ─── NAV DATA ─────────────────────────────────────────────────────────────

type NavLink = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  authHref?: string;
};

type NavGroup = {
  key: string;
  label: string;
  icon: React.ElementType;
  links: NavLink[];
};

const groups: NavGroup[] = [
  {
    key: "academics",
    label: "Academics",
    icon: BookOpen,
    links: [
      { title: "PYQ Papers", href: "/pyq", icon: BookOpen, badge: "new" },
      { title: "Syllabus", href: "/resources/syllabus", icon: FileText, badge: "new" },
      { title: "Quizzo", href: "/quizz0", icon: Brain, badge: "new" },
    ],
  },
  {
    key: "career",
    label: "Career",
    icon: Target,
    links: [
      { title: "ATS Score Checker", href: "/ats-score", icon: Target, badge: "new" },
      { title: "Resume Builder", href: "/resume-builder", authHref: "/resumes", icon: FileCheck2, badge: "new" },
      { title: "Career Hub", href: "/coming-soon/career", icon: Briefcase, badge: "soon" },
    ],
  },
  {
    key: "community",
    label: "Community",
    icon: Users,
    links: [
      { title: "Clubs", href: "/coming-soon/societies", icon: Users, badge: "soon" },
      { title: "Events", href: "/events", icon: CalendarDays, badge: "new" },
      { title: "Leaderboard", href: "/leaderboard", icon: Trophy, badge: "new" },
      { title: "Our Team", href: "/our-team", icon: Users, badge: "new" },
    ],
  },
  {
    key: "support",
    label: "Support",
    icon: LifeBuoy,
    links: [
      { title: "Sponsor Us", href: "/sponsor", icon: HandCoins, badge: "new" },
      { title: "Contact", href: "/contact", icon: Mail },
      { title: "Report a Bug", href: "/report-bug", icon: Bug },
      { title: "Support", href: "/support", icon: LifeBuoy },
      { title: "About", href: "/about", icon: Info },
      { title: "Socials", href: "/socials", icon: Share2 },
    ],
  },
]

export function GlobalSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { state, setOpenMobile, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
  }

  const formatDisplayName = () => (user ? user.email?.split("@")[0] || "" : "")

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/70 bg-white/95 backdrop-blur-md">
      {/* ─── HEADER: BRANDING ────────────────────────────────────────────── */}
      <SidebarHeader className={cn(
        "border-b border-slate-100 transition-all",
        isCollapsed ? "p-3 py-4 flex-col gap-6" : "p-4"
      )}>
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center gap-6 w-full">
            {/* Premium Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="size-[22px]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild className="hover:bg-transparent px-0 w-auto">
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <div className="flex shrink-0 items-center">
                      <span
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-xl font-black tracking-tighter text-transparent"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          WebkitTextStroke: "0.6px currentColor",
                          paintOrder: "stroke fill",
                        }}
                      >
                        INVERTISPREP
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Premium Desktop Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="size-[18px]" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* ─── CONTENT: TREE-LINE NAVIGATION ─────────────────────────────────── */}
      <SidebarContent className={isCollapsed ? "px-0 py-4 gap-2" : "px-2 py-4"}>
        {groups.map((group) => {
          if (isCollapsed) {
            return (
              <button
                key={group.key}
                onClick={toggleSidebar}
                className="mx-auto flex w-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 transition-all duration-300 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group/collink focus:outline-none"
                title={`Expand ${group.label}`}
              >
                <group.icon className="size-[24px] transition-transform duration-300 group-hover/collink:scale-110 group-hover/collink:-translate-y-0.5" />
                <span className="text-[10px] font-bold tracking-wide transition-transform duration-300 group-hover/collink:translate-y-0.5">
                  {group.label}
                </span>
              </button>
            )
          }

          return (
            <Collapsible key={group.key} defaultOpen className="group/collapsible">
              <SidebarGroup className="py-2">
                {/* Group Label / Node */}
                <SidebarGroupLabel asChild className="flex items-center gap-2 px-2 py-1 bg-transparent hover:bg-slate-100/50 cursor-pointer transition-colors rounded-md w-full">
                  <CollapsibleTrigger title={group.label}>
                    <span className="relative flex size-5 items-center justify-center rounded-[5px] bg-slate-100 text-slate-500">
                      <group.icon className="size-3" />
                      {/* Vertical tree root line */}
                      <span className="absolute left-1/2 top-full h-[8px] w-px -translate-x-1/2 bg-slate-200" />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-500">
                      {group.label}
                    </span>
                    <ChevronDown className="ml-auto size-4 text-slate-400 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent className="relative mt-1 pl-2">
                    {/* Vertical continuous tree line */}
                    <div className="absolute inset-y-0 left-[18px] w-px bg-slate-200" />

                    <SidebarMenu className="gap-1">
                      {group.links.map((link) => {
                        const href = link.authHref && user ? link.authHref : link.href
                        const isActive = pathname === href || pathname.startsWith(`${href}/`)

                        return (
                          <SidebarMenuItem key={link.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={link.title}
                              className={cn(
                                "relative ml-2 rounded-xl transition-all duration-300 group/link",
                                "hover:bg-slate-100/70 hover:text-slate-900 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]",
                                "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 data-[active=true]:font-semibold data-[active=true]:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                              )}
                            >
                              <Link href={href} onClick={() => setOpenMobile(false)}>
                                {/* Animated Active Pill */}
                                {isActive && (
                                  <motion.span
                                    layoutId="activeNavPill"
                                    className="pointer-events-none absolute left-[-6px] top-1/2 z-10 h-[60%] w-[3px] -translate-y-1/2 rounded-full bg-slate-900"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                )}
                                <link.icon className="size-4 shrink-0 transition-transform duration-300 group-hover/link:scale-110" />
                                <span className="flex-1 truncate transition-transform duration-300 group-hover/link:translate-x-0.5">
                                  {link.title}
                                </span>
                                {link.badge === "new" && <NewBadge />}
                                {link.badge === "soon" && <SoonBadge />}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      {/* ─── FOOTER: SPONSOR, ACCOUNT, LEGAL ──────────────────────────────── */}
      <SidebarFooter className={isCollapsed ? "border-t border-slate-100 p-3 pb-4" : "border-t border-slate-100 p-4 pb-4"}>
        <SidebarMenu className={isCollapsed ? "items-center" : "gap-2"}>
          {/* Sponsor Popover Hook */}
          {!isCollapsed && (
            <SidebarMenuItem>
              <div className="px-2">
                <SponsorPopover />
              </div>
            </SidebarMenuItem>
          )}

          {/* User Account / Auth */}
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className={cn(
                      "data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 transition-colors",
                      isCollapsed && "size-12 justify-center rounded-2xl"
                    )}
                  >
                    <Avatar className={isCollapsed ? "size-10 ring-1 ring-slate-200" : "h-8 w-8 ring-1 ring-slate-200"}>
                      {user.picture && (
                        <AvatarImage
                          src={optimizeAvatar(user.picture)}
                          alt={user.name || "User"}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className={isCollapsed ? "bg-slate-200 text-xs font-bold text-slate-700" : "bg-slate-200 text-[10px] font-bold text-slate-700"}>
                        {user.name ? getInitials(user.name) : user.email ? getInitials(user.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    {!isCollapsed && (
                      <>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold text-slate-800">
                            {user.name || formatDisplayName()}
                          </span>
                          <span className="truncate text-[11px] text-slate-500">
                            {user.qcoins !== undefined ? `${user.qcoins.toLocaleString("en-IN")} QC` : user.email}
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4 text-slate-500" />
                      </>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="right"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/profile" onClick={() => setOpenMobile(false)} className="cursor-pointer flex items-center gap-2">
                      <User className="size-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" onClick={() => setOpenMobile(false)} className="cursor-pointer flex items-center gap-2">
                      <Wallet className="size-4" /> QCWallet
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === "admin" || user.role === "super-admin" || user.role === "srt") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" onClick={() => setOpenMobile(false)} className="cursor-pointer flex items-center gap-2">
                        <LayoutDashboard className="size-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      setOpenMobile(false)
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="size-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            !isCollapsed && (
              <SidebarMenuItem>
                <Link href="/login" onClick={() => setOpenMobile(false)}>
                  <Button className="w-full bg-slate-900 font-medium text-white hover:bg-slate-800">
                    Sign In
                  </Button>
                </Link>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
