'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const isStaffRole = (role?: string) =>
  role === 'admin' || role === 'super-admin' || role === 'srt' || role === 'staff';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // A logged-in staff member landing here must escape to the dashboard —
    // sending them to /login?role=admin while authenticated ping-pongs.
    if (user && isStaffRole(user.role)) {
      router.replace('/admin/dashboard');
      return;
    }
    router.replace('/login?role=admin');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Redirecting to Team Login...</p>
      </div>
    </div>
  );
}
