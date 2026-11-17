'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { clubApi } from '@/lib/api';
import type {
  Club,
  ClubRegistration,
  ClubRegistrationStats,
  ClubRegistrationSummaryRow,
  ClubRegistrationStatus,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  ArrowLeft,
  Loader2,
  Ticket,
  Trash2,
  Search,
  Check,
  X,
  UserCheck,
  CalendarDays,
  Download,
  Eye,
  Plus,
  AlertCircle,
  Users,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';

/**
 * The booking states. Attendance is deliberately NOT here — it is a
 * separate optional flag, because most clubs have nobody scanning names
 * at the door and a status would simply sit empty.
 */
const STATUS_OPTIONS: { value: ClubRegistrationStatus; label: string; className: string }[] = [
  { value: 'pending', label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  { value: 'confirmed', label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700' },
  { value: 'waitlist', label: 'Waitlist', className: 'bg-violet-100 text-violet-700' },
  { value: 'cancelled', label: 'Cancelled', className: 'bg-slate-100 text-slate-600' },
];

const statusMeta = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

export default function AdminClubRegistrationsPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'clubs.manage');
  // Deleting a registration returns a seat, so it follows the same
  // permission as deleting clubs.
  const canDeleteAllowed = hasPermission(user, 'clubs.delete');

  const [clubs, setClubs] = useState<Club[]>([]);
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [stats, setStats] = useState<ClubRegistrationStats | null>(null);
  const [summary, setSummary] = useState<ClubRegistrationSummaryRow[]>([]);

  const [clubFilter, setClubFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The full record of the booking whose row was opened.
  const [detail, setDetail] = useState<ClubRegistration | null>(null);
  const [detailNote, setDetailNote] = useState('');

  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    clubId: '',
    eventId: '',
    name: '',
    email: '',
    branch: '',
    year: '',
    status: 'confirmed',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [clubRes, regRes, statsRes, summaryRes] = await Promise.all([
        clubApi.getAllForAdmin(),
        clubApi.getRegistrations({
          clubId: clubFilter === 'all' ? undefined : clubFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        clubApi.getRegistrationStats(clubFilter === 'all' ? undefined : clubFilter),
        clubApi.getRegistrationSummary(),
      ]);
      setClubs(clubRes.data || []);
      setRegistrations(regRes.data || []);
      if (statsRes.data) setStats(statsRes.data);
      if (summaryRes.data) setSummary(summaryRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }, [clubFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.eventTitle?.toLowerCase().includes(q) ||
        r.branch?.toLowerCase().includes(q)
    );
  }, [registrations, search]);

  const clubEvents = useMemo(() => {
    const club = clubs.find((c) => c.id === manual.clubId);
    return club?.events || [];
  }, [clubs, manual.clubId]);

  const setStatus = async (reg: ClubRegistration, status: ClubRegistrationStatus) => {
    try {
      setBusyId(reg._id);
      setError('');
      const res = await clubApi.updateRegistration(reg._id, { status });
      if (res.success) {
        setSuccess(`${reg.name} marked as ${status}.`);
        await load();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update the registration.');
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Toggle whether a student actually turned up. This is separate from
   * the booking state on purpose: the club may not have anybody at the
   * door, and toggling attendance must never erase the fact that the
   * student held a confirmed seat.
   */
  const toggleAttended = async (reg: ClubRegistration) => {
    try {
      setBusyId(reg._id);
      setError('');
      const next = !reg.attended;
      const res = await clubApi.updateRegistration(reg._id, { attended: next });
      if (res.success) {
        setSuccess(
          next ? `${reg.name} marked as having attended.` : `${reg.name} attendance cleared.`
        );
        await load();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update attendance.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (reg: ClubRegistration) => {
    if (!window.confirm(`Delete the registration for ${reg.name}? The seat is returned.`)) return;
    try {
      setBusyId(reg._id);
      setError('');
      await clubApi.deleteRegistration(reg._id);
      setSuccess('Registration deleted and the seat returned.');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete the registration.');
    } finally {
      setBusyId(null);
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.clubId || !manual.eventId || !manual.name || !manual.email) {
      setError('Club, event, name and email are all required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const res = await clubApi.createRegistration(manual);
      if (res.success) {
        setSuccess('Registration added.');
        setShowManual(false);
        setManual({
          clubId: '',
          eventId: '',
          name: '',
          email: '',
          branch: '',
          year: '',
          status: 'confirmed',
        });
        await load();
      } else {
        setError(res.message || 'Failed to add the registration.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add the registration.');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    // The export carries the full booking record, so a club can work
    // from the sheet without coming back to the console.
    const headers = [
      'Name',
      'Email',
      'Club',
      'Event',
      'Date',
      'Time',
      'Venue',
      'Branch',
      'Year',
      'Taking part as',
      'Seats',
      'Status',
      'Booked via',
      'Registered at',
      'Confirmed at',
      'Checked in at',
      'Cancelled at',
      "Student's note",
      'Internal note',
    ];
    const stamp = (v?: string | null) =>
      v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const rows = filtered.map((r) => [
      r.name,
      r.email,
      r.clubId,
      r.eventTitle || '',
      r.eventDate || '',
      r.eventTime || '',
      r.eventVenue || '',
      r.branch || '',
      r.year || '',
      r.interests?.join('; ') || '',
      String(r.seats || 1),
      r.status,
      r.bookingMethod === 'manual' ? 'Manual (admin)' : 'Online',
      stamp(r.createdAt),
      stamp(r.confirmedAt),
      stamp(r.checkedInAt),
      stamp(r.cancelledAt),
      r.studentNote || '',
      r.notes || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `club-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/clubs"
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              All clubs
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <Ticket className="h-6 w-6 text-slate-700" />
              Event RSVPs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Every registration students make from the club pages, with check-in and
              status control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage && (
              <Button
                onClick={() => {
                  setShowManual((s) => !s);
                  setError('');
                }}
              >
                <Plus className="h-4 w-4" />
                Add manually
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: 'Total', value: stats.total, icon: Users, tone: 'text-slate-900' },
              { label: 'Pending', value: stats.pending, icon: CalendarDays, tone: 'text-amber-600' },
              { label: 'Confirmed', value: stats.confirmed, icon: Check, tone: 'text-emerald-600' },
              { label: 'Waitlist', value: stats.waitlist ?? 0, icon: TrendingUp, tone: 'text-violet-600' },
              { label: 'Attended', value: stats.attended, icon: UserCheck, tone: 'text-blue-600' },
              { label: 'Cancelled', value: stats.cancelled, icon: X, tone: 'text-slate-500' },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    <item.icon className={`h-5 w-5 ${item.tone}`} />
                  </span>
                  <div>
                    <div className="text-xl font-black text-slate-900">{item.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {item.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Per-club breakdown */}
        {summary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By club</CardTitle>
              <CardDescription>Total registrations per club page.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {summary.map((row) => (
                  <button
                    key={row.clubId}
                    type="button"
                    onClick={() => setClubFilter(clubFilter === row.clubId ? 'all' : row.clubId)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      clubFilter === row.clubId
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-bold">{row.name}</span>
                      {!row.isActive && (
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black">{row.registrations}</span>
                      <span
                        className={`text-xs font-semibold ${
                          clubFilter === row.clubId ? 'text-white/70' : 'text-slate-500'
                        }`}
                      >
                        RSVPs · {row.events} events
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual registration */}
        {showManual && canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add a registration</CardTitle>
              <CardDescription>
                For students who registered in person. This consumes a seat just like an
                online RSVP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Club</Label>
                    <Select
                      value={manual.clubId}
                      onValueChange={(v) => setManual({ ...manual, clubId: v, eventId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Event</Label>
                    <Select
                      value={manual.eventId}
                      onValueChange={(v) => setManual({ ...manual, eventId: v })}
                      disabled={!manual.clubId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubEvents.map((ev) => (
                          <SelectItem key={ev._id} value={ev._id || ''}>
                            {ev.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-name">Name</Label>
                    <Input
                      id="m-name"
                      value={manual.name}
                      onChange={(e) => setManual({ ...manual, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-email">Email</Label>
                    <Input
                      id="m-email"
                      type="email"
                      value={manual.email}
                      onChange={(e) => setManual({ ...manual, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-branch">Branch</Label>
                    <Input
                      id="m-branch"
                      value={manual.branch}
                      onChange={(e) => setManual({ ...manual, branch: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-year">Year</Label>
                    <Input
                      id="m-year"
                      value={manual.year}
                      onChange={(e) => setManual({ ...manual, year: e.target.value })}
                      placeholder="3rd Year"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={manual.status}
                      onValueChange={(v) => setManual({ ...manual, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowManual(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add registration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, event or branch…"
                className="pl-9"
              />
            </div>
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clubs</SelectItem>
                {clubs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Registrations
              <span className="ml-2 text-sm font-medium text-slate-500">
                ({filtered.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <Ticket className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No registrations yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Students who RSVP from a club page will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Club / Event</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((reg) => {
                      const meta = statusMeta(reg.status);
                      const club = clubs.find((c) => c.id === reg.clubId);
                      return (
                        <TableRow key={reg._id}>
                          <TableCell>
                            <div className="font-semibold text-slate-900">{reg.name}</div>
                            <div className="text-xs text-slate-500">{reg.email}</div>
                            {(reg.branch || reg.year) && (
                              <div className="mt-0.5 text-xs text-slate-400">
                                {[reg.branch, reg.year].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-slate-800">
                              {reg.eventTitle || '—'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {club?.name || reg.clubId}
                              {reg.eventDate ? ` · ${reg.eventDate}` : ''}
                            </div>
                            {reg.interests && reg.interests.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {reg.interests.map((i) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                                  >
                                    {i}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {reg.createdAt
                              ? new Date(reg.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                            {reg.attended && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                                <UserCheck className="h-3 w-3" />
                                Attended
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDetail(reg);
                                  setDetailNote(reg.notes || '');
                                }}
                                title="View full booking record"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {canManage && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === reg._id}
                                  onClick={() => toggleAttended(reg)}
                                  title={
                                    reg.attended
                                      ? 'Clear attendance'
                                      : 'Mark as having attended'
                                  }
                                  className={
                                    reg.attended
                                      ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                      : ''
                                  }
                                >
                                  {busyId === reg._id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                              {canManage && reg.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === reg._id}
                                  onClick={() => setStatus(reg, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                              )}
                              {canManage && reg.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === reg._id}
                                  onClick={() => setStatus(reg, 'cancelled')}
                                  title="Cancel registration"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canDeleteAllowed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === reg._id}
                                  onClick={() => handleDelete(reg)}
                                  className="text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Booking detail drawer ────────────────────────────────── */}
        <AnimatePresence>
          {detail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setDetail(null)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 260 }}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
              >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Booking record
                    </p>
                    <h2 className="truncate text-lg font-black text-slate-900">
                      {detail.name}
                    </h2>
                    <p className="truncate text-sm text-slate-500">{detail.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDetail(null)}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  {/* Event */}
                  <section>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                      Event
                    </h3>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-900">{detail.eventTitle || '—'}</p>
                      <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                        {detail.eventDate && (
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {detail.eventDate}
                          </p>
                        )}
                        {detail.eventTime && (
                          <p className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {detail.eventTime}
                          </p>
                        )}
                        {detail.eventVenue && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {detail.eventVenue}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Student */}
                  <section>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                      Student details
                    </h3>
                    <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {[
                        { label: 'Name', value: detail.name },
                        { label: 'Email', value: detail.email },
                        { label: 'Branch', value: detail.branch || '—' },
                        { label: 'Year', value: detail.year || '—' },
                        {
                          label: 'Taking part as',
                          value: detail.interests?.length
                            ? detail.interests.join(', ')
                            : '—',
                        },
                        {
                          label: 'Seats',
                          value: String(detail.seats || 1),
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-start justify-between gap-4 px-4 py-2.5"
                        >
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {row.label}
                          </dt>
                          <dd className="text-right text-sm font-semibold text-slate-800">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  {/* Timeline */}
                  <section>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                      Timeline
                    </h3>
                    <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                      {[
                        { label: 'Registered', at: detail.createdAt },
                        {
                          label:
                            detail.status === 'waitlist'
                              ? 'Added to waitlist'
                              : 'Seat confirmed',
                          at: detail.confirmedAt,
                        },
                        { label: 'Marked as attended', at: detail.attendedAt },
                        { label: 'Cancelled', at: detail.cancelledAt },
                      ].map((entry) => (
                        <li key={entry.label} className="relative">
                          <span
                            className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                              entry.at ? 'bg-slate-800' : 'bg-slate-200'
                            }`}
                          />
                          <p className="text-sm font-semibold text-slate-700">
                            {entry.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.at
                              ? new Date(entry.at).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : 'Not yet'}
                          </p>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 text-xs text-slate-400">
                      Booked{' '}
                      {detail.bookingMethod === 'manual' ? 'by an admin' : 'online'}
                      {detail.source === 'admin' ? ' · entered manually' : ' · from the club page'}
                    </p>
                  </section>

                  {/* The student's note */}
                  {detail.studentNote && (
                    <section>
                      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        Note from the student
                      </h3>
                      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                        {detail.studentNote}
                      </p>
                    </section>
                  )}

                  {/* The admin's note */}
                  {canManage && (
                    <section>
                      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        Internal note
                      </h3>
                      <Textarea
                        value={detailNote}
                        onChange={(e) => setDetailNote(e.target.value)}
                        rows={3}
                        placeholder="Only visible to the club team."
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        disabled={busyId === detail._id}
                        onClick={async () => {
                          try {
                            setBusyId(detail._id);
                            const res = await clubApi.updateRegistration(detail._id, {
                              notes: detailNote,
                            });
                            if (res.success) {
                              setDetail({ ...detail, notes: detailNote });
                              setSuccess('Note saved.');
                              await load();
                            }
                          } catch (err: any) {
                            setError(
                              err.response?.data?.message || 'Failed to save the note.'
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {busyId === detail._id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Save note
                      </Button>
                    </section>
                  )}

                  {/* Booking state */}
                  {canManage && (
                    <section>
                      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        Booking status
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            size="sm"
                            variant={detail.status === option.value ? 'default' : 'outline'}
                            disabled={busyId === detail._id}
                            onClick={() => setStatus(detail, option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Cancelling a confirmed seat returns it to the pool and promotes
                        the next person on the waitlist.
                      </p>
                    </section>
                  )}

                  {/* Attendance — separate from the booking state, because
                      most clubs do not have anybody at the door. */}
                  {canManage && (
                    <section>
                      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        Attendance
                      </h3>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                        <Switch
                          checked={!!detail.attended}
                          disabled={busyId === detail._id}
                          onCheckedChange={(v) => {
                            const next = { ...detail, attended: v };
                            setDetail(next);
                            toggleAttended(next);
                          }}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">
                            Showed up
                          </span>
                          <span className="block text-xs text-slate-500">
                            Tick this if the student turned up. Most clubs have nobody
                            at the door, so it is optional.
                          </span>
                        </span>
                      </label>
                    </section>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
