'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { rolesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminRole } from '@/types';
import {
  GRANTABLE_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  ROLE_COLORS,
  BUILTIN_PERMISSIONS,
} from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleDialog } from '@/components/admin/role-dialog';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Users,
  Lock,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label]))
);

// Human label + summary for the four built-in roles, which always exist.
const BUILTIN_ROLES = [
  {
    name: 'super-admin',
    label: 'Super Admin',
    description: 'Full access to everything, including roles and user management.',
    color: 'slate',
    permissions: 'all' as const,
  },
  {
    name: 'admin',
    label: 'Admin',
    description: 'Manages content and users, but cannot create roles or accounts.',
    color: 'indigo',
    permissions: BUILTIN_PERMISSIONS.admin,
  },
  {
    name: 'srt',
    label: 'SRT',
    description: 'Support & Resource Team — can view and verify, but not delete.',
    color: 'teal',
    permissions: BUILTIN_PERMISSIONS.srt,
  },
  {
    name: 'student',
    label: 'Student',
    description: 'Default role for learners. No admin access.',
    color: 'slate',
    permissions: [] as string[],
  },
];

export default function AdminRolesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.list();
      if (res.success && res.data) setRoles(res.data);
      else setError(res.message || 'Failed to load roles');
    } catch {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const totalMembers = useMemo(
    () => roles.reduce((sum, r) => sum + (r.memberCount || 0), 0),
    [roles]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await rolesApi.remove(deleteTarget.id);
      if (res.success) {
        setNotice(res.message || 'Role deleted');
        setDeleteTarget(null);
        fetchRoles();
      } else {
        setError(res.message || 'Failed to delete role');
        setDeleteTarget(null);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to delete role');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Roles & Permissions</h1>
          <p className="text-sm text-slate-500">
            Create custom roles, choose what each one can access, and assign colors.
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New role
          </Button>
        )}
      </div>

      {/* Notices */}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />
          Only super admins can create, edit or delete roles.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black leading-none text-slate-900">
              {loading ? '—' : BUILTIN_ROLES.length + roles.length}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Roles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black leading-none text-slate-900">
              {loading ? '—' : roles.length}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Custom Roles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black leading-none text-slate-900">
              {loading ? '—' : totalMembers}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Users
            </p>
          </div>
        </div>
      </div>

      {/* Built-in roles (read-only) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Built-in roles
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {BUILTIN_ROLES.map((role) => {
            const style = ROLE_COLORS[role.color] || ROLE_COLORS.slate;
            const count =
              role.permissions === 'all' ? GRANTABLE_PERMISSION_KEYS.length : role.permissions.length;
            return (
              <div
                key={role.name}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', style.badge)}>
                      {role.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      System
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {role.permissions === 'all'
                      ? 'All permissions'
                      : `${count} permission${count === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{role.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom roles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Custom roles
          </h2>
          {!loading && roles.length > 0 && (
            <span className="text-xs text-slate-400">{roles.length} role{roles.length === 1 ? '' : 's'}</span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="mt-3 h-3.5 w-48" />
                <Skeleton className="mt-3 h-8 w-full" />
              </div>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <ShieldCheck className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No custom roles yet</p>
            <p className="max-w-sm text-xs text-slate-400">
              Create a role, choose its permissions, then assign it to users from the Users page.
            </p>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 gap-1.5 font-semibold"
                onClick={() => {
                  setEditTarget(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                New role
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {roles.map((role) => {
              const style = ROLE_COLORS[role.color] || ROLE_COLORS.slate;
              const granted = role.permissions.filter((p) => GRANTABLE_PERMISSION_KEYS.includes(p));
              return (
                <div key={role.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', style.badge)}>
                          {role.label}
                        </span>
                        {role.memberCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            <Users className="h-3 w-3" />
                            {role.memberCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-slate-400">{role.name}</p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700"
                          onClick={() => {
                            setEditTarget(role);
                            setDialogOpen(true);
                          }}
                          title="Edit role"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          onClick={() => setDeleteTarget(role)}
                          title="Delete role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {role.description && (
                    <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {granted.length === 0 ? (
                      <span className="text-xs italic text-slate-400">No permissions granted</span>
                    ) : (
                      granted.slice(0, 6).map((key) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100"
                        >
                          <Check className="h-2.5 w-2.5 text-emerald-500" />
                          {PERMISSION_LABELS[key] || key}
                        </span>
                      ))
                    )}
                    {granted.length > 6 && (
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-100">
                        +{granted.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create / edit dialog */}
      <RoleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        role={editTarget}
        onSaved={(role, created) => {
          setNotice(created ? `Created role "${role.label}"` : `Updated role "${role.label}"`);
          fetchRoles();
        }}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete role?</h3>
                <p className="text-xs text-slate-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Delete <span className="font-semibold">{deleteTarget.label}</span>
              {deleteTarget.memberCount > 0 && (
                <> — this role still has {deleteTarget.memberCount} user
                  {deleteTarget.memberCount === 1 ? '' : 's'} assigned.</>
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={handleDelete}
                disabled={deleting || deleteTarget.memberCount > 0}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}