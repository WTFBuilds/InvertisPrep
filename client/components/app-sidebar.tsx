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
  FileQuestion,
  BookOpen,
  Flag,
  Bug,
  CalendarDays,
  ShieldCheck,
  Users,
  DatabaseBackup,
  KeyRound,
  Mail,
  Activity,
  Megaphone,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SidebarInstagramToggle } from "@/components/admin/sidebar-instagram-toggle"
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
import { canAccessAdminRoute } from "@/lib/permissions"

export const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Roles", url: "/admin/roles", icon: KeyRound },
  { title: "DB Backup", url: "/admin/backup", icon: DatabaseBackup },
  { title: "Activity Monitor", url: "/admin/activity", icon: Activity },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Branches", url: "/admin/branches", icon: GitBranch },
  { title: "Sessions", url: "/admin/sessions", icon: Calendar },
  { title: "Upload PYQ", url: "/admin/upload", icon: Upload },
  { title: "Manage Papers", url: "/admin/papers", icon: FileText },
  { title: "Syllabus", url: "/admin/syllabus", icon: BookOpen },
  { title: "Reports", url: "/admin/reports", icon: Flag },
  { title: "Paper Requests", url: "/admin/requests", icon: FileQuestion },
  { title: "Bug Reports", url: "/admin/bugs", icon: Bug },
  { title: "Events", url: "/admin/events", icon: CalendarDays },
  {
    title: "Mail",
    url: "/admin/mail",
    icon: Mail,
    items: [
      { title: "Automail", url: "/admin/mail/automail" },
      { title: "Mailbox", url: "/admin/mail/mailbox" },
      { title: "Compose", url: "/admin/mail/compose" },
      { title: "Logs", url: "/admin/mail/logs" },
      { title: "Notifications", url: "/admin/mail/notifications" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Permission-based filtering: each admin page's required permission lives in
  // NAV_PERMISSIONS (lib/permissions). Built-ins resolve through their fixed
  // sets; custom-role users through their granted permissions; super-admin
  // sees everything.
  const items = adminNavItems
    .filter((item) => canAccessAdminRoute(user, item.url))
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
        {user?.role === 'super-admin' && (
          <div className="px-2 py-1.5">
            <SidebarInstagramToggle />
          </div>
        )}
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
