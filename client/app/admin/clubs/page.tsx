'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { clubApi } from '@/lib/api';
import type { Club, ClubRegistrationSummaryRow } from '@/types';
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
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  CalendarDays,
  Ticket,
  ArrowRight,
  GripVertical,
  Eye,
  EyeOff,
  Search,
  UploadCloud,
  AlertCircle,
  LayoutList,
} from 'lucide-react';

const GRADIENT_PRESETS = [
  { label: 'Blue', value: 'from-blue-500 via-indigo-600 to-cyan-500' },
  { label: 'Emerald', value: 'from-emerald-500 via-green-600 to-teal-600' },
  { label: 'Pink', value: 'from-pink-500 via-rose-500 to-red-500' },
  { label: 'Violet', value: 'from-violet-500 via-purple-600 to-indigo-600' },
  { label: 'Orange', value: 'from-orange-500 via-rose-500 to-pink-500' },
  { label: 'Amber', value: 'from-amber-500 via-orange-500 to-red-500' },
  { label: 'Slate', value: 'from-slate-600 via-slate-700 to-slate-800' },
  { label: 'Cyan', value: 'from-cyan-500 via-blue-500 to-indigo-500' },
];

const ICON_PRESETS = [
  'Paintbrush', 'Heart', 'Music', 'BookOpen', 'Cpu', 'Trophy', 'Briefcase', 'Users', 'Sparkles', 'Star',
];

/** A blank club, used as the starting point for the create form. */
const emptyClub = (): Partial<Club> => ({
  id: '',
  name: '',
  tagline: '',
  shortDescription: '',
  longDescription: '',
  mission: '',
  vision: '',
  coordinator: '',
  coordinatorRole: 'Faculty Coordinator',
  coordinatorNote: '',
  img: '',
  color: '#3B82F6',
  colorLight: '#EFF6FF',
  colorDark: '#1D4ED8',
  gradient: 'from-blue-500 via-indigo-600 to-cyan-500',
  icon: 'Users',
  highlights: [],
  stats: [],
  activities: [],
  wings: [],
  team: [],
  achievements: [],
  testimonials: [],
  faqs: [],
  logistics: [],
  joinProcess: [],
  events: [],
  displayOrder: 0,
  isActive: true,
  adminNote: '',
});

export default function AdminClubsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canManage = hasPermission(user, 'clubs.manage');
  const canDelete = hasPermission(user, 'clubs.delete');

  const [clubs, setClubs] = useState<Club[]>([]);
  const [summary, setSummary] = useState<ClubRegistrationSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<Partial<Club>>(emptyClub());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [clubRes, summaryRes] = await Promise.all([
        clubApi.getAllForAdmin(),
        clubApi.getRegistrationSummary().catch(() => null),
      ]);
      setClubs(clubRes.data || []);
      if (summaryRes?.data) setSummary(summaryRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load clubs from the API server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const registrationCount = useMemo(() => {
    const map = new Map<string, number>();
    summary.forEach((row) => map.set(row.clubId, row.registrations));
    return map;
  }, [summary]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [clubs, search]);

  const setField = <K extends keyof Club>(key: K, value: Club[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const res = await clubApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setField('img', res.data.url);
        setSuccess('Image uploaded successfully!');
      } else {
        setError('Failed to upload image to server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during image upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.id || !draft.name || !draft.tagline) {
      setError('Slug, name and tagline are all required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await clubApi.create(draft);
      if (res.success) {
        setShowCreate(false);
        setDraft(emptyClub());
        setSuccess(`Club "${res.data?.name}" created.`);
        await fetchData();
        router.push(`/admin/clubs/${res.data?.id}`);
      } else {
        setError(res.message || 'Failed to create the club.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create the club.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club: Club) => {
    if (
      !window.confirm(
        `Delete "${club.name}"? This removes its public page and every registration attached to it. This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setDeletingId(club.id);
      setError('');
      await clubApi.remove(club.id);
      setSuccess(`Club "${club.name}" deleted.`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete the club.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (club: Club) => {
    try {
      setError('');
      const res = await clubApi.update(club.id, { isActive: !club.isActive });
      if (res.success) {
        setSuccess(`"${club.name}" is now ${club.isActive ? 'hidden from' : 'visible on'} the public page.`);
        await fetchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update the club.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <Users className="h-6 w-6 text-slate-700" />
              Clubs
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the Abhiruchi club pages — every section is editable, and RSVPs are
              tracked here.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/clubs/registrations">
                <Ticket className="h-4 w-4" />
                RSVPs
              </Link>
            </Button>
            {canManage && (
              <Button
                onClick={() => {
                  setDraft(emptyClub());
                  setShowCreate((s) => !s);
                  setError('');
                }}
              >
                <Plus className="h-4 w-4" />
                New club
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

        {!canManage && (
          <Alert>
            <AlertDescription>
              You have read-only access. Ask a super-admin for the <strong>Manage clubs</strong>{' '}
              permission to make changes.
            </AlertDescription>
          </Alert>
        )}

        {/* Create form */}
        {showCreate && canManage && (
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Create a club</CardTitle>
                  <CardDescription>
                    The essentials. You can fill in every other section from the club editor
                    right after.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="club-id">Slug (URL) *</Label>
                    <Input
                      id="club-id"
                      value={draft.id || ''}
                      onChange={(e) =>
                        setField(
                          'id',
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                        )
                      }
                      placeholder="e.g. panache"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Public page: <code className="text-slate-700">/club/{draft.id || '…'}</code>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="club-name">Name *</Label>
                    <Input
                      id="club-name"
                      value={draft.name || ''}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="e.g. Panache"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="club-tagline">Tagline *</Label>
                  <Input
                    id="club-tagline"
                    value={draft.tagline || ''}
                    onChange={(e) => setField('tagline', e.target.value)}
                    placeholder="e.g. The Arts Club"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="club-short">Short description</Label>
                  <Textarea
                    id="club-short"
                    value={draft.shortDescription || ''}
                    onChange={(e) => setField('shortDescription', e.target.value)}
                    placeholder="One or two sentences — this shows on the club card and at the top of the club page."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="club-color">Accent colour</Label>
                    <div className="flex gap-2">
                      <Input
                        id="club-color"
                        type="color"
                        value={draft.color || '#3B82F6'}
                        onChange={(e) => {
                          setField('color', e.target.value);
                          setField('colorDark', e.target.value);
                        }}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={draft.colorDark || ''}
                        onChange={(e) => setField('colorDark', e.target.value)}
                        placeholder="Dark"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="club-light">Light tint</Label>
                    <Input
                      id="club-light"
                      type="color"
                      value={draft.colorLight || '#EFF6FF'}
                      onChange={(e) => setField('colorLight', e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="club-order">Display order</Label>
                    <Input
                      id="club-order"
                      type="number"
                      value={draft.displayOrder ?? 0}
                      onChange={(e) => setField('displayOrder', Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Gradient</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setField('gradient', preset.value)}
                        className={`h-9 w-20 rounded-lg bg-gradient-to-br ${preset.value} ring-offset-2 transition-all ${
                          draft.gradient === preset.value
                            ? 'ring-2 ring-slate-900'
                            : 'ring-1 ring-slate-200 hover:ring-slate-400'
                        }`}
                        title={preset.label}
                        aria-label={preset.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create club
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs…"
            className="pl-9"
          />
        </div>

        {/* Club list */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <LayoutList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">
                {clubs.length === 0 ? 'No clubs yet' : 'No clubs match your search'}
              </p>
              {clubs.length === 0 && canManage && (
                <p className="mt-1 text-sm text-slate-500">
                  Create one, or the seven seeded clubs may not have been loaded yet — hit
                  refresh.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((club) => (
              <Card
                key={club.id}
                className="group flex flex-col overflow-hidden border-slate-200 transition-shadow hover:shadow-lg"
              >
                <div
                  className={`relative h-28 bg-gradient-to-br ${club.gradient || 'from-slate-500 to-slate-700'}`}
                >
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="absolute left-4 top-4 flex items-center gap-2.5">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/95 p-1.5 shadow">
                      {club.img ? (
                        <Image
                          src={club.img}
                          alt={club.name}
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                          Logo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold leading-tight text-white drop-shadow">
                        {club.name}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                        {club.tagline}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      club.isActive
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    {club.isActive ? 'Live' : 'Hidden'}
                  </span>
                </div>

                <CardContent className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-2 flex-1 text-sm text-slate-600">
                    {club.shortDescription || 'No description yet.'}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {club.events?.length || 0}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Events
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {club.team?.length || 0}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Members
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {registrationCount.get(club.id) || 0}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        RSVPs
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" className="flex-1 bg-slate-900 hover:bg-slate-700">
                      <Link href={`/admin/clubs/${club.id}`}>
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/club/${club.id}`} target="_blank">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(club)}
                        title={club.isActive ? 'Hide from public page' : 'Show on public page'}
                      >
                        {club.isActive ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingId === club.id}
                        onClick={() => handleDelete(club)}
                        className="text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      >
                        {deletingId === club.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
