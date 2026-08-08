'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
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
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // If on login redirect, don't show the layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      name: 'Departments',
      icon: Building2,
      href: '/admin/departments',
    },
    {
      name: 'Branches',
      icon: GitBranch,
      href: '/admin/branches',
    },
    {
      name: 'Sessions',
      icon: Calendar,
      href: '/admin/sessions',
    },
    {
      name: 'Upload PYQ',
      icon: Upload,
      href: '/admin/upload',
    },
    {
      name: 'Manage Papers',
      icon: FileText,
      href: '/admin/papers',
    },
    {
      name: 'Syllabus',
      icon: BookOpen,
      href: '/admin/syllabus',
    },
    {
      name: 'Reports',
      icon: Flag,
      href: '/admin/reports',
    },
    {
      name: 'Bug Reports',
      icon: Bug,
      href: '/admin/bugs',
    },
    {
      name: 'Events',
      icon: CalendarDays,
      href: '/admin/events',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
        
        {/* Left Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-white text-slate-600 border-r border-slate-200 shrink-0">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span className="font-black text-slate-900 text-lg tracking-tight">
              InvertisPrep Admin
            </span>
          </div>

          {/* User Section */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || user?.email}</p>
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-450 group-hover:text-slate-600'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-50 hover:text-red-650 text-slate-500 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 text-slate-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Right Area (Main Contents) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Mobile Top Navbar */}
          <header className="md:hidden h-16 bg-white border-b border-slate-200 text-slate-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span className="font-extrabold text-sm tracking-tight text-slate-900">IP Admin</span>
            </div>
            
            {/* Horizontal Mobile Nav Links */}
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/admin/events" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Events
              </Link>
              <button onClick={logout} className="text-xs font-semibold text-red-650 hover:text-red-500 flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5 text-slate-450" />
              </button>
            </div>
          </header>

          {/* Scrollable Sub-View Content Wrapper */}
          <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
