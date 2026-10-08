'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUserApi, rolesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminRole, AdminUser, UserRole, UserStats } from '@/types';
import { BUILTIN_ROLE_META, ROLE_COLORS } from '@/lib/permissions';
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
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { UserDetailDialog } from '@/components/admin/user-detail-dialog';
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'srt', label: 'SRT' },
  { value: 'staff', label: 'Custom roles' },
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

// Value used by the per-row role Select. Custom roles are addressed as
// "role:<roleId>" so a single Select can cover built-ins + custom roles.
const ROLE_SELECT_BUILTINS: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'srt', label: 'SRT' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super Admin' },
];

const roleBadge = (user: Pick<AdminUser, 'role' | 'roleLabel' | 'roleColor'>) => {
  if (user.role === 'staff') {
    const style = ROLE_COLORS[user.roleColor || 'violet'] || ROLE_COLORS.violet;
    return <Badge className={style.badge}>{user.roleLabel || 'Custom'}</Badge>;
  }
  const meta = BUILTIN_ROLE_META[user.role] || BUILTIN_ROLE_META.student;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
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
  const [customRoles, setCustomRoles] = useState<AdminRole[]>([]);

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

  // Create-user dialog (super-admin only)
  const [createOpen, setCreateOpen] = useState(false);

  // Permanent deletion (super-admin only) — gated behind a typed-email dialog.
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  // Load custom roles once so the role pickers/selects can list them
  const loadRoles = useCallback(() => {
    if (!isSuperAdmin) return;
    rolesApi
      .list()
      .then((res) => {
        if (res.success && res.data) setCustomRoles(res.data);
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const totalPages = useMemo(() => meta.pages, [meta.pages]);

  // Resolve the Select value for a user: custom roles use "role:<id>" so they
  // share one dropdown with the built-ins.
  const roleSelectValue = (u: AdminUser) =>
    u.role === 'staff' && u.roleId ? `role:${u.roleId}` : u.role;

  const handleRoleChange = async (id: string, value: string) => {
    const isCustom = value.startsWith('role:');
    const customRoleId = isCustom ? value.slice(5) : null;
    const builtinRole = (isCustom ? 'staff' : value) as UserRole;

    const roleName = isCustom
      ? customRoles.find((r) => r.id === customRoleId)?.label || 'custom role'
      : builtinRole;
    if (!window.confirm(`Change this user's role to "${roleName}"?`)) return;

    setNotice(null);
    try {
      const res = await adminUserApi.updateRole(id, builtinRole, customRoleId);
      if (res.success) {
        // Refresh the row from the server so roleLabel/roleColor stay accurate
        fetchUsers();
        setNotice(res.message || 'Role updated');
        adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
      } else {
        setError(res.message || 'Failed to update role');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to update role');
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">
            Search, create, manage roles, and moderate all InvertisPrep accounts.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create user
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
          <ShieldAlert className="h-4 w-4 shrink-0" />
          You have read-only access. Only super admins can change roles or ban accounts.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Total Users', value: stats?.total, icon: Users, tint: 'bg-slate-100 text-slate-700' },
          { label: 'Active', value: stats?.active, icon: UserRound, tint: 'bg-emerald-100 text-emerald-600' },
          { label: 'Admins', value: stats?.admins, icon: ShieldAlert, tint: 'bg-indigo-100 text-indigo-600' },
          { label: 'Custom Roles', value: stats?.staff, icon: ShieldAlert, tint: 'bg-violet-100 text-violet-600' },
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
                        value={roleSelectValue(u)}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                      >
                        <SelectTrigger size="sm" className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_SELECT_BUILTINS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                          {customRoles.length > 0 && (
                            <>
                              <div className="my-1 h-px bg-slate-100" />
                              {customRoles.map((r) => (
                                <SelectItem key={r.id} value={`role:${r.id}`}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      roleBadge(u)
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
                    <div className="flex items-center justify-end gap-1.5">
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
                      {isSuperAdmin && u.id !== currentUser?.id && u.role !== 'super-admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => {
                            setDeleteTarget(u);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
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
        onDeleted={(message) => {
          setNotice(message);
          fetchUsers();
          adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
        }}
      />

      {/* Create user dialog (super-admin only) */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        customRoles={customRoles}
        onCreated={(message) => {
          setNotice(message);
          fetchUsers();
          adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
        }}
      />

      {/* Permanent deletion dialog (super-admin only) */}
      <DeleteUserDialog
        user={
          deleteTarget
            ? { id: deleteTarget.id, name: deleteTarget.name, email: deleteTarget.email }
            : null
        }
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={(message) => {
          setNotice(message);
          // Refresh both the list and the stats (counts just changed).
          fetchUsers();
          adminUserApi.stats().then((s) => s.success && s.data && setStats(s.data));
        }}
      />
    </div>
  );
}
