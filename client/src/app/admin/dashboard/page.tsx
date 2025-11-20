'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Upload,
  FileText,
  Download,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  Clock,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/api';
import { AdminStatistics } from '@/types';

interface RecentPaper {
  _id: string;
  subjectName: string;
  subjectCode: string;
  department: { name: string };
  branch: { name: string };
  uploadedAt: string;
  downloads: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [recentPapers, setRecentPapers] = useState<RecentPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/admin');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, papersData] = await Promise.all([
        adminApi.getStatistics(),
        adminApi.getAllPapers({ page: 1, limit: 5 }),
      ]);

      setStatistics(stats);
      setRecentPapers(papersData.papers as any);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  INVERTISPREP
                </span>
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Admin Panel
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <img
                src={user?.picture || '/default-avatar.png'}
                alt={user?.name}
                className="h-10 w-10 rounded-full border-2 border-purple-200"
              />
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your platform today.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Papers</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.totalPapers || 0}</p>
              </div>
              <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.totalDownloads || 0}</p>
              </div>
              <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.totalUsers || 0}</p>
              </div>
              <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recent Uploads</p>
                <p className="text-3xl font-bold text-gray-900">{statistics?.recentUploads?.length || 0}</p>
              </div>
              <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/upload"
            className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Upload className="h-10 w-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">Upload Paper</h3>
            <p className="text-purple-100">Add new PYQ papers to the database</p>
          </Link>

          <Link
            href="/admin/papers"
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <FileText className="h-10 w-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">Manage Papers</h3>
            <p className="text-blue-100">View, edit, and delete existing papers</p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Settings className="h-10 w-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">Settings</h3>
            <p className="text-gray-300">Configure departments and sessions</p>
          </Link>
        </div>

        {/* Recent Papers */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Uploads</h2>
            <Link
              href="/admin/papers"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>

          {recentPapers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No papers uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="pb-3 text-sm font-semibold text-gray-600">Department</th>
                    <th className="pb-3 text-sm font-semibold text-gray-600">Branch</th>
                    <th className="pb-3 text-sm font-semibold text-gray-600">Downloads</th>
                    <th className="pb-3 text-sm font-semibold text-gray-600">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPapers.map((paper) => (
                    <tr key={paper._id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{paper.subjectName}</p>
                        <p className="text-sm text-gray-500">{paper.subjectCode}</p>
                      </td>
                      <td className="py-4 text-gray-700">{paper.department.name}</td>
                      <td className="py-4 text-gray-700">{paper.branch.name}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Download className="h-4 w-4" />
                          {paper.downloads}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500 text-sm">
                        {new Date(paper.uploadedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
