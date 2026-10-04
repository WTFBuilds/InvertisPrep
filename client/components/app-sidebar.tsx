"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Calendar,
  Upload,
  FileText,
  BookOpen,
  Flag,
  Bug,
  CalendarDays,
  ShieldCheck,
  Users,
  HandCoins,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

export const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Branches", url: "/admin/branches", icon: GitBranch },
  { title: "Sessions", url: "/admin/sessions", icon: Calendar },
  { title: "Upload PYQ", url: "/admin/upload", icon: Upload },
  { title: "Manage Papers", url: "/admin/papers", icon: FileText },
  { title: "Syllabus", url: "/admin/syllabus", icon: BookOpen },
  { title: "Reports", url: "/admin/reports", icon: Flag },
  { title: "Bug Reports", url: "/admin/bugs", icon: Bug },
  { title: "Events", url: "/admin/events", icon: CalendarDays }
]

// SRT (Support & Resource Team) sees every admin page except User Management
const srtHiddenItems = ["/admin/users"]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const items = adminNavItems
    .filter((item) => user?.role !== "srt" || !srtHiddenItems.includes(item.url))
    .map((item) => ({
      ...item,
      isActive: pathname === item.url,
    }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">InvertisPrep</span>
                  <span className="truncate text-xs">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Management" items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || user?.email || "Admin",
            email: user?.email || "",
            avatar: user?.picture || "",
          }}
          onLogout={logout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
