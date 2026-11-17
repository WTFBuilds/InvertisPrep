"use client"

import { usePathname } from "next/navigation"
import { LogOut, ShieldX } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppSidebar, adminNavItems } from "@/components/app-sidebar"
import Navbar from "@/components/Navbar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { canAccessAdminRoute } from "@/lib/permissions"

// Rendered when a signed-in staff member opens a page their role (or a custom
// role's permissions) doesn't cover — the sidebar already hides these links,
// but URLs can be opened directly.
function NoAccess({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <ShieldX className="h-7 w-7 text-slate-400" />
      </div>
      <h1 className="text-xl font-black tracking-tight text-slate-900">
        Access denied
      </h1>
      <p className="max-w-md text-sm text-slate-500">
        Your role doesn&apos;t include permission for{" "}
        <span className="font-semibold text-slate-700">{title}</span>. Ask a
        super admin if you need it.
      </p>
      <Button variant="outline" size="sm" className="mt-1 font-semibold" onClick={onBack}>
        Back to dashboard
      </Button>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Login page renders standalone (no sidebar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const visibleItems = adminNavItems.filter((item) =>
    canAccessAdminRoute(user, item.url)
  )
  const currentItem = visibleItems.find((item) => item.url === pathname)
  const denied = user ? !canAccessAdminRoute(user, pathname) : false

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Site navbar — shared chrome for admin pages too */}
          <Navbar />
          {/* Top Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <span className="text-sm text-muted-foreground">Admin</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {denied ? "Access denied" : (currentItem?.title ?? "Dashboard")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
            {denied ? (
              <NoAccess
                title={currentItem?.title ?? pathname.replace("/admin/", "")}
                onBack={() => window.location.assign("/admin/dashboard")}
              />
            ) : (
              children
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
