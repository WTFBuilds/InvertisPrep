'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
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
  Shield,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout, isSuperAdmin } = useAuth();

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
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">InvertisPrep Admin</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {user?.name} {isSuperAdmin && <Shield className="inline h-4 w-4 text-yellow-500" />}
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/">
                  <Button variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Site
                  </Button>
                </Link>
                <Button variant="destructive" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Management Dashboard</h2>
            <p className="text-gray-600">
              Manage all aspects of the PYQ system from this dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Departments</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Branches</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sessions</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Papers</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
