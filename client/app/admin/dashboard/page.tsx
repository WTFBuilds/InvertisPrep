'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { departmentApi, branchApi, sessionApi, pyqApi, bugApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  BookOpen,
  Building2,
  GitBranch,
  Calendar,
  Upload,
  FileText,
  LogOut,
  Flag,
  Bug,
  CalendarDays,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    departments: 0,
    branches: 0,
    sessions: 0,
    papers: 0,
    bugs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [depts, branches, sessions, papers, bugsData] = await Promise.all([
          departmentApi.getAll().catch(() => ({ data: [] })),
          branchApi.getAll().catch(() => ({ data: [] })),
          sessionApi.getAll().catch(() => ({ data: [] })),
          pyqApi.getAll().catch(() => ({ data: [], total: 0 })),
          bugApi.getAll().catch(() => ({ data: [] })),
        ]);

        setStats({
          departments: depts.data?.length || 0,
          branches: branches.data?.length || 0,
          sessions: sessions.data?.length || 0,
          // API returns paged results; use the `total` field when available
          papers: typeof (papers as any).total === 'number' ? (papers as any).total : papers.data?.length || 0,
          bugs: bugsData.data?.length || 0,
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const managementCards = [
    {
      title: 'Departments',
      description: 'Manage departments (B.Tech, BCA, MBA, BBA)',
      icon: Building2,
      href: '/admin/departments',
      color: 'bg-blue-500',
    },
    {
      title: 'Branches',
      description: 'Manage branches for each department',
      icon: GitBranch,
      href: '/admin/branches',
      color: 'bg-green-500',
    },
    {
      title: 'Sessions',
      description: 'Manage academic sessions and years',
      icon: Calendar,
      href: '/admin/sessions',
      color: 'bg-purple-500',
    },
    {
      title: 'Upload PYQ',
      description: 'Upload new question papers',
      icon: Upload,
      href: '/admin/upload',
      color: 'bg-orange-500',
    },
    {
      title: 'Manage Papers',
      description: 'View, verify, and delete uploaded papers',
      icon: FileText,
      href: '/admin/papers',
      color: 'bg-red-500',
    },
    {
      title: 'Syllabus',
      description: 'Upload and manage syllabus PDFs',
      icon: BookOpen,
      href: '/admin/syllabus',
      color: 'bg-indigo-500',
    },
    {
      title: 'Reports',
      description: 'View and resolve user reports for incorrect uploads',
      icon: Flag,
      href: '/admin/reports',
      color: 'bg-rose-500',
    },
    {
      title: 'Bug Reports',
      description: 'View and manage system bug reports and glitches',
      icon: Bug,
      href: '/admin/bugs',
      color: 'bg-red-600',
    },
    {
      title: 'Events',
      description: 'Manage campus fests, hackathons, and activities',
      icon: CalendarDays,
      href: '/admin/events',
      color: 'bg-emerald-600',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Title */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Management</h1>
          <p className="text-xs text-slate-450 mt-1">Logged in as {user?.email} ({user?.role})</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow border-slate-200/80 rounded-3xl cursor-pointer h-full">
                <CardHeader>
                  <div className={`${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-3`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-base font-extrabold">{card.title}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full text-xs font-bold rounded-xl border-slate-200">
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">System Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-slate-200/80 rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Departments</CardDescription>
                <CardTitle className="text-2xl font-black text-slate-900">{loading ? '-' : stats.departments}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Branches</CardDescription>
                <CardTitle className="text-2xl font-black text-slate-900">{loading ? '-' : stats.branches}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Sessions</CardDescription>
                <CardTitle className="text-2xl font-black text-slate-900">{loading ? '-' : stats.sessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Total Papers</CardDescription>
                <CardTitle className="text-2xl font-black text-slate-900">{loading ? '-' : stats.papers}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Active Bugs</CardDescription>
                <CardTitle className="text-2xl font-black text-slate-900">{loading ? '-' : stats.bugs}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
