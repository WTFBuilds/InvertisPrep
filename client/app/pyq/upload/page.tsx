'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

export default function StudentUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (hasPermission(user, 'papers.upload')) {
        router.replace('/admin/upload');
      } else {
        router.replace('/pyq');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
