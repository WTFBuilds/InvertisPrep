'use client';

import { useAuth } from '@/contexts/AuthContext';
import { InstagramGateControl } from '@/components/admin/instagram-gate-control';
import { Settings, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <ShieldAlert className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          Super Admin Access Required
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          Platform settings are restricted to Super Admins only.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2 font-semibold">
          <Link href="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Platform Settings
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage platform-wide feature flags, verification gates, and student interaction controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <InstagramGateControl />
      </div>
    </div>
  );
}
