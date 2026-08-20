'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUserApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminUser, UserRole, UserStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  ShieldAlert,
  UserRound,
  Users,
} from 'lucide-react';
import { UserDetailDialog } from '@/components/admin/user-detail-dialog';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'srt', label: 'SRT' },
  { value: 'admin', label: 'Admins' },
  { value: 'super-admin', label: 'Super Admins' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'points', label: 'Most points' },
  { value: 'lastLogin', label: 'Recently active' },
];

const LIMIT_OPTIONS = [10, 25, 50];

const roleBadge = (role: UserRole) => {
  switch (role) {
    case 'super-admin':
      return <Badge className="bg-slate-900 text-white">Super Admin</Badge>;
    case 'admin':
      return <Badge variant="indigo">Admin</Badge>;
    case 'srt':
      return <Badge className="bg-teal-600 text-white">SRT</Badge>;
    default:
      return <Badge variant="outline">Student</Badge>;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'points' | 'lastLogin'>('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminUserApi.list({
        page: meta.page,
        limit: meta.limit,
        search: debouncedSearch || undefined,
        role,
        status,
        sort,
      });
      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) setMeta(res.meta);
      } else {
        setError(res.message || 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, debouncedSearch, role, status, sort]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    adminUserApi
      .stats()
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  const totalPages = useMemo(() => meta.pages, [meta.pages]);

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setNotice(null);
    try {
      const res = await adminUserApi.updateRole(id, newRole);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
        setNotice(res.message || 'Role updated');
        // Refresh stats (admin counts may have changed)
        adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
      } else {
        setError(res.message || 'Failed to update role');
      }
    } catch {
      setError('Failed to update role');
    }
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    const action = isActive ? 'reactivate' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;
    setNotice(null);
    try {
      const res = await adminUserApi.updateStatus(id, isActive);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive } : u)));
        setNotice(res.message || (isActive ? 'Account reactivated' : 'Account banned'));
        adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
      } else {
        setError(res.message || 'Failed to update account status');
      }
    } catch {
      setError('Failed to update account status');
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setMeta((m) => ({ ...m, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500">
          Search, manage roles, and moderate all InvertisPrep accounts.
        </p>
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
          <ShieldAlert className="h-4 w-4 shrink-0" />
          You have read-only access. Only super admins can change roles or ban accounts.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Users', value: stats?.total, icon: Users, tint: 'bg-slate-100 text-slate-700' },
          { label: 'Active', value: stats?.active, icon: UserRound, tint: 'bg-emerald-100 text-emerald-600' },
          { label: 'Admins', value: stats?.admins, icon: ShieldAlert, tint: 'bg-indigo-100 text-indigo-600' },
          { label: 'SRT', value: stats?.srt, icon: ShieldAlert, tint: 'bg-teal-100 text-teal-600' },
          { label: 'Super Admins', value: stats?.superAdmins, icon: ShieldAlert, tint: 'bg-slate-900 text-white' },
          { label: 'Banned', value: stats?.banned, icon: ShieldAlert, tint: 'bg-rose-100 text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-black leading-none text-slate-900">
                {stats ? s.value : '—'}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((m) => ({ ...m, page: 1 }));
            }}
            placeholder="Search by name, email, or student ID..."
            className="h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v as UserRole | 'all');
              setMeta((m) => ({ ...m, page: 1 }));
            }}
          >
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as 'all' | 'active' | 'banned');
              setMeta((m) => ({ ...m, page: 1 }));
            }}
          >
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as 'newest' | 'oldest' | 'name' | 'points' | 'lastLogin');
              setMeta((m) => ({ ...m, page: 1 }));
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-bold text-slate-600">User</TableHead>
              <TableHead className="font-bold text-slate-600">Role</TableHead>
              <TableHead className="font-bold text-slate-600">Points</TableHead>
              <TableHead className="font-bold text-slate-600">Q-Coins</TableHead>
              <TableHead className="font-bold text-slate-600">Last Login</TableHead>
              <TableHead className="font-bold text-slate-600">Joined</TableHead>
              <TableHead className="font-bold text-slate-600">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="flex items-center gap-3 py-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && !error && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/60">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {u.picture && <AvatarImage src={u.picture} alt={u.name} />}
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isSuperAdmin ? (
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                      >
                        <SelectTrigger size="sm" className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="srt">SRT</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      roleBadge(u.role)
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700">{u.points}</TableCell>
                  <TableCell className="text-sm font-semibold text-indigo-600">{u.qcoins}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(u.lastLogin)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{formatDate(u.joinedAt)}</TableCell>
                  <TableCell>
                    {isSuperAdmin ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.isActive}
                          disabled={u.id === currentUser?.id}
                          onCheckedChange={(v) => handleStatusChange(u.id, v)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            u.isActive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Banned'}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        className={
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }
                      >
                        {u.isActive ? 'Active' : 'Banned'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-semibold"
                      onClick={() => {
                        setDetailUserId(u.id);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Footer: result count + pagination */}
        {!loading && !error && users.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
            <p className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-600">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-600">{meta.total}</span> users
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(meta.limit)}
                onValueChange={(v) => {
                  setMeta((m) => ({ ...m, limit: Number(v), page: 1 }));
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={meta.page <= 1}
                  onClick={() => goToPage(meta.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[80px] text-center text-xs font-semibold text-slate-600">
                  Page {meta.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={meta.page >= totalPages}
                  onClick={() => goToPage(meta.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User detail dialog */}
      <UserDetailDialog
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
