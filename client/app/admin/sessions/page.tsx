'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { sessionApi } from '@/lib/api';
import type { Session, CreateSessionDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BadgeCheck,
  CalendarRange,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const inputClasses =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  // SRT can view sessions but cannot create or edit; deletion is super-admin only.
  const canModify = hasPermission(user, 'sessions.manage');
  const isSuperAdmin = user?.role === 'super-admin';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateSessionDTO>({
    id: '',
    name: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
  });

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.getAll();
      setSessions(response.data || []);
    } catch (err: unknown) {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.endYear <= formData.startYear) {
      setError('End year must be greater than start year');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await sessionApi.update(editingId, formData);
        setSuccess('Session updated successfully');
      } else {
        await sessionApi.create(formData);
        setSuccess('Session created successfully');
      }

      setFormData({
        id: '',
        name: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 1,
      });
      setShowForm(false);
      setEditingId(null);
      fetchSessions();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (session: Session) => {
    setFormData({
      id: session.id,
      name: session.name,
      startYear: session.startYear,
      endYear: session.endYear,
    });
    setEditingId(session._id);
    setShowForm(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (session: Session) => {
    if (!confirm(`Deactivate and remove "${session.name}"? Papers linked to it remain, but it will no longer be selectable.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(session._id);
    try {
      const res = await sessionApi.delete(session._id);
      if (res.success) {
        setSuccess(res.message || 'Session deleted successfully');
        fetchSessions();
      } else {
        setError(res.message || 'Failed to delete session');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      name: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-4xl p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                Sessions Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Academic sessions available across uploads and filters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canModify && !showForm && (
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add New Session
                </Button>
              )}
              <Link href="/admin/dashboard">
                <Button variant="outline" className="shadow-sm">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 border-rose-200 shadow-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50 shadow-sm">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="font-medium text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}
          {!isSuperAdmin && canModify && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              You can add and edit sessions. Deleting a session requires a super-admin.
            </div>
          )}

          {/* Create / edit form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="mb-6 border-slate-200 shadow-lg shadow-slate-200/50">
                  <CardHeader className="border-b border-slate-100 pb-5">
                    <CardTitle>{editingId ? 'Edit Session' : 'New Session'}</CardTitle>
                    <CardDescription>
                      Sessions follow the academic year, e.g. 2024–25.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Session ID" required>
                          <Input
                            value={formData.id}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData({ ...formData, id: e.target.value })
                            }
                            placeholder="e.g., 2024-25"
                            className={inputClasses}
                            required
                            disabled={!!editingId}
                          />
                        </Field>
                        <Field label="Session name" required>
                          <Input
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="e.g., Academic Year 2024-2025"
                            className={inputClasses}
                            required
                          />
                        </Field>
                        <Field label="Start year" required>
                          <Input
                            type="number"
                            value={formData.startYear}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData({
                                ...formData,
                                startYear: parseInt(e.target.value) || new Date().getFullYear(),
                              })
                            }
                            min="2000"
                            max="2100"
                            className={inputClasses}
                            required
                          />
                        </Field>
                        <Field label="End year" required>
                          <Input
                            type="number"
                            value={formData.endYear}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setFormData({
                                ...formData,
                                endYear: parseInt(e.target.value) || new Date().getFullYear() + 1,
                              })
                            }
                            min="2000"
                            max="2100"
                            className={inputClasses}
                            required
                          />
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
                        >
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingId ? 'Save changes' : 'Create session'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sessions list */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/70">
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <CalendarRange className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No sessions yet</p>
                <p className="text-xs text-slate-400">
                  Add your first academic session to start tagging papers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card
                  key={session._id}
                  className="border-slate-200 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                        <CalendarRange className="h-5 w-5 text-indigo-600" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-slate-900">{session.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                              session.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                : 'bg-slate-100 text-slate-500 ring-slate-200'
                            }`}
                          >
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          ID: {session.id} · {session.startYear} – {session.endYear}
                        </p>
                      </div>
                    </div>
                    {canModify && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs font-semibold"
                          onClick={() => handleEdit(session)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === session._id}
                            className="gap-1.5 border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => handleDelete(session)}
                          >
                            {deletingId === session._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
