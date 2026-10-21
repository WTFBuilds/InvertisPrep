'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { clubApi } from '@/lib/api';
import type { Club, ClubEvent } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StringListEditor,
  PairListEditor,
} from '@/components/admin/club-list-editor';
import {
  ArrowLeft,
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Eye,
  LayoutList,
  CalendarDays,
  Users,
  Award,
  MessageSquareQuote,
  HelpCircle,
  Settings2,
  LogOut,
  MapPin,
  Clock,
  Ticket,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const GRADIENT_PRESETS = [
  'from-blue-500 via-indigo-600 to-cyan-500',
  'from-emerald-500 via-green-600 to-teal-600',
  'from-pink-500 via-rose-500 to-red-500',
  'from-violet-500 via-purple-600 to-indigo-600',
  'from-orange-500 via-rose-500 to-pink-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-slate-600 via-slate-700 to-slate-800',
  'from-cyan-500 via-blue-500 to-indigo-500',
];

const ACHIEVEMENT_KINDS = ['Award', 'Milestone', 'Record', 'Recognition'] as const;

/**
 * The club being edited. A draft always belongs to a loaded club, so the
 * identity fields are non-optional even though the update payload is
 * partial.
 */
type ClubDraft = Omit<Partial<Club>, 'id' | 'name' | 'tagline'> & {
  id: string;
  name: string;
  tagline: string;
  activities: Club['activities'];
  wings: Club['wings'];
  team: Club['team'];
  achievements: Club['achievements'];
  testimonials: Club['testimonials'];
  faqs: Club['faqs'];
  logistics: Club['logistics'];
  joinProcess: Club['joinProcess'];
  highlights: string[];
  stats: { label: string; value: string }[];
};

const emptyEvent = (): ClubEvent => ({
  title: '',
  description: '',
  month: 'Jan',
  day: '01',
  time: '10:00 AM',
  venue: '',
  category: 'Event',
  agenda: [],
  seats: 100,
  seatsLeft: 100,
  audience: '',
  rsvpDeadline: '',
  perks: [],
  registrationOpen: true,
  isPublished: true,
});

export default function AdminClubEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clubId = params.clubId as string;
  const canManage = hasPermission(user, 'clubs.manage');

  const [club, setClub] = useState<ClubDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Event editor state
  const [editingEvent, setEditingEvent] = useState<(ClubEvent & { _key: string }) | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await clubApi.getById(clubId);
      if (res.success && res.data) {
        setClub({
          ...res.data,
          highlights: res.data.highlights || [],
          stats: res.data.stats || [],
          activities: res.data.activities || [],
          wings: res.data.wings || [],
          team: res.data.team || [],
          achievements: res.data.achievements || [],
          testimonials: res.data.testimonials || [],
          faqs: res.data.faqs || [],
          logistics: res.data.logistics || [],
          joinProcess: res.data.joinProcess || [],
          events: res.data.events || [],
        });
      } else {
        setError(res.message || 'Club not found.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load the club.');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof ClubDraft>(key: K, value: ClubDraft[K]) => {
    setClub((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  };

  const setList = <K extends keyof ClubDraft>(key: K, value: ClubDraft[K]) => {
    setClub((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!club) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await clubApi.update(club.id, club as Partial<Club>);
      if (res.success) {
        setSuccess('Changes saved. The public page is updated immediately.');
        setDirty(false);
      } else {
        setError(res.message || 'Failed to save the club.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save the club.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const res = await clubApi.uploadImage(file);
      if (res.success && res.data?.url) {
        set('img', res.data.url);
        setSuccess('Image uploaded. Remember to save.');
      } else {
        setError('Failed to upload image to server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during image upload.');
    } finally {
      setUploading(false);
    }
  };

  // ── Event handlers ────────────────────────────────────────────────────

  const saveEvent = async () => {
    if (!club || !editingEvent) return;
    const { _key, eventId, ...payload } = editingEvent as ClubEvent & {
      _key: string;
      eventId?: string;
    };
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await clubApi.saveEvent(club.id, {
        ...payload,
        eventId: eventId || undefined,
      });
      if (res.success) {
        setSuccess(
          eventId ? 'Event updated.' : 'Event added to the club page.'
        );
        setEditingEvent(null);
        await load();
        setDirty(false);
      } else {
        setError(res.message || 'Failed to save the event.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save the event.');
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (event: ClubEvent) => {
    if (!club || !event._id) return;
    if (!window.confirm(`Remove "${event.title}" from this club?`)) return;
    try {
      setSaving(true);
      setError('');
      const res = await clubApi.deleteEvent(club.id, event._id);
      if (res.success) {
        setSuccess('Event removed.');
        await load();
        setDirty(false);
      } else {
        setError(res.message || 'Failed to remove the event.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove the event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!club) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-xl font-bold text-slate-900">Club not found</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'This club does not exist.'}</p>
          <Button asChild className="mt-6">
            <Link href="/admin/clubs">
              <ArrowLeft className="h-4 w-4" />
              Back to clubs
            </Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/clubs"
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              All clubs
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                {club.img ? (
                  <Image src={club.img} alt={club.name} fill className="object-contain" sizes="48px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-slate-400">
                    Logo
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                  {club.name}
                </h1>
                <p className="text-sm text-slate-500">
                  {club.tagline} · <code className="text-slate-600">/club/{club.id}</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/club/${club.id}`} target="_blank">
                <Eye className="h-4 w-4" />
                View page
              </Link>
            </Button>
            {canManage && (
              <Button onClick={handleSave} disabled={saving || !dirty}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {dirty ? 'Save changes' : 'Saved'}
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
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {success}
            </AlertDescription>
          </Alert>
        )}

        {!canManage && (
          <Alert>
            <AlertDescription>
              Read-only access. You can review every section, but editing needs the{' '}
              <strong>Manage clubs</strong> permission.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">
              <LayoutList className="mr-1.5 h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Events
            </TabsTrigger>
            <TabsTrigger value="content">
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="people">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              People
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
              FAQs
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity</CardTitle>
                <CardDescription>
                  The name, tagline and copy shown at the top of the club page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={club.name || ''}
                      onChange={(e) => set('name', e.target.value)}
                      disabled={!canManage}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={club.tagline || ''}
                      onChange={(e) => set('tagline', e.target.value)}
                      disabled={!canManage}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="short">Short description</Label>
                  <Textarea
                    id="short"
                    value={club.shortDescription || ''}
                    onChange={(e) => set('shortDescription', e.target.value)}
                    rows={2}
                    disabled={!canManage}
                  />
                  <p className="text-xs text-slate-500">
                    Shown on the club card in the grid and under the club name.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="long">Full description</Label>
                  <Textarea
                    id="long"
                    value={club.longDescription || ''}
                    onChange={(e) => set('longDescription', e.target.value)}
                    rows={6}
                    disabled={!canManage}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="mission">Mission</Label>
                    <Textarea
                      id="mission"
                      value={club.mission || ''}
                      onChange={(e) => set('mission', e.target.value)}
                      rows={3}
                      disabled={!canManage}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vision">Vision</Label>
                    <Textarea
                      id="vision"
                      value={club.vision || ''}
                      onChange={(e) => set('vision', e.target.value)}
                      rows={3}
                      disabled={!canManage}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Colours, gradient and the logo used across the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="color">Accent</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={club.color || '#3B82F6'}
                        onChange={(e) => {
                          set('color', e.target.value);
                          set('colorDark', e.target.value);
                        }}
                        className="h-10 w-14 p-1"
                        disabled={!canManage}
                      />
                      <Input
                        value={club.colorDark || ''}
                        onChange={(e) => set('colorDark', e.target.value)}
                        disabled={!canManage}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="light">Light tint</Label>
                    <Input
                      id="light"
                      type="color"
                      value={club.colorLight || '#EFF6FF'}
                      onChange={(e) => set('colorLight', e.target.value)}
                      className="h-10 w-14 p-1"
                      disabled={!canManage}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order">Display order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={club.displayOrder ?? 0}
                      onChange={(e) => set('displayOrder', Number(e.target.value) || 0)}
                      disabled={!canManage}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Gradient</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => set('gradient', preset)}
                        disabled={!canManage}
                        className={`h-9 w-20 rounded-lg bg-gradient-to-br ${preset} ring-offset-2 transition-all ${
                          club.gradient === preset
                            ? 'ring-2 ring-slate-900'
                            : 'ring-1 ring-slate-200 hover:ring-slate-400'
                        }`}
                        aria-label={preset}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="img">Logo</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
                      {club.img ? (
                        <Image
                          src={club.img}
                          alt="Club logo"
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-slate-400">
                          None
                        </div>
                      )}
                    </div>
                    <Input
                      value={club.img || ''}
                      onChange={(e) => set('img', e.target.value)}
                      placeholder="/images/club.png or a full URL"
                      className="min-w-[220px] flex-1"
                      disabled={!canManage}
                    />
                    {canManage && (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Visible on the public page</p>
                    <p className="text-xs text-slate-500">
                      Turn off to hide this club from the grid without deleting it.
                    </p>
                  </div>
                  <Switch
                    checked={club.isActive !== false}
                    onCheckedChange={(v) => set('isActive', v)}
                    disabled={!canManage}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminNote">Internal note</Label>
                  <Textarea
                    id="adminNote"
                    value={club.adminNote || ''}
                    onChange={(e) => set('adminNote', e.target.value)}
                    rows={2}
                    placeholder="Visible only in this console."
                    disabled={!canManage}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Headline stats</CardTitle>
                <CardDescription>
                  The three numbers in the band under the hero.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PairListEditor
                  value={club.stats || []}
                  onChange={(v) => setList('stats', v)}
                  labelPlaceholder="Label"
                  valuePlaceholder="Value"
                  addLabel="Add stat"
                  disabled={!canManage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What we do</CardTitle>
                <CardDescription>
                  The bullet list in the sidebar of the club page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StringListEditor
                  value={club.highlights || []}
                  onChange={(v) => setList('highlights', v)}
                  placeholder="e.g. Annual Art Exhibition"
                  addLabel="Add highlight"
                  disabled={!canManage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── EVENTS ───────────────────────────────────────────── */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Events &amp; bookings</CardTitle>
                    <CardDescription>
                      Each event carries its own agenda, seat count and registration window.
                      Students RSVP against these from the club page.
                    </CardDescription>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setEditingEvent({ ...emptyEvent(), _key: `new-${Date.now()}` })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Add event
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(club.events || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
                    <CalendarDays className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No events yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add one so students can register for it.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(club.events || []).map((ev) => {
                      const seats = ev.seats ?? 0;
                      const left = ev.seatsLeft ?? 0;
                      const pct = seats > 0 ? Math.round(((seats - left) / seats) * 100) : 0;
                      return (
                        <div
                          key={ev._id || ev.title}
                          className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white">
                                  {ev.month} {ev.day}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                                  {ev.category}
                                </span>
                                {ev.isPublished === false && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
                                    Unpublished
                                  </span>
                                )}
                                {ev.registrationOpen === false && (
                                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700">
                                    Registration closed
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 font-bold text-slate-900">{ev.title}</p>
                              {ev.venue && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                  <MapPin className="h-3 w-3" />
                                  {ev.venue}
                                </p>
                              )}
                              {ev.time && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {ev.time}
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {canManage && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingEvent({
                                        ...(ev as ClubEvent),
                                        _key: ev._id || ev.title,
                                      })
                                    }
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() => removeEvent(ev as ClubEvent)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-500">Seats</span>
                              <span className="text-slate-700">
                                {seats - left} / {seats} filled
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-800"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event editor */}
            {editingEvent && (
              <Card className="border-slate-900/20 ring-1 ring-slate-900/5">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {editingEvent._id ? 'Edit event' : 'New event'}
                      </CardTitle>
                      <CardDescription>
                        Everything here appears on the event card and in the RSVP panel.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEvent(null)}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="ev-title">Title</Label>
                    <Input
                      id="ev-title"
                      value={editingEvent.title || ''}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ev-desc">Description</Label>
                    <Textarea
                      id="ev-desc"
                      value={editingEvent.description || ''}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-month">Month</Label>
                      <Input
                        id="ev-month"
                        value={editingEvent.month || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, month: e.target.value })
                        }
                        placeholder="Nov"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-day">Day</Label>
                      <Input
                        id="ev-day"
                        value={editingEvent.day || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, day: e.target.value })
                        }
                        placeholder="22"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-category">Category</Label>
                      <Input
                        id="ev-category"
                        value={editingEvent.category || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, category: e.target.value })
                        }
                        placeholder="Flagship"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-time">Time</Label>
                      <Input
                        id="ev-time"
                        value={editingEvent.time || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, time: e.target.value })
                        }
                        placeholder="10:00 AM – 6:00 PM"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-venue">Venue</Label>
                      <Input
                        id="ev-venue"
                        value={editingEvent.venue || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, venue: e.target.value })
                        }
                        placeholder="University Central Auditorium"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-seats">Total seats</Label>
                      <Input
                        id="ev-seats"
                        type="number"
                        value={editingEvent.seats ?? 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            seats: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-seatsleft">Seats remaining</Label>
                      <Input
                        id="ev-seatsleft"
                        type="number"
                        value={editingEvent.seatsLeft ?? 0}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            seatsLeft: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-deadline">RSVP deadline</Label>
                      <Input
                        id="ev-deadline"
                        value={editingEvent.rsvpDeadline || ''}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, rsvpDeadline: e.target.value })
                        }
                        placeholder="November 15, 2026"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ev-audience">Who it is for</Label>
                    <Textarea
                      id="ev-audience"
                      value={editingEvent.audience || ''}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, audience: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Run of show</Label>
                    <StringListEditor
                      value={editingEvent.agenda || []}
                      onChange={(v) => setEditingEvent({ ...editingEvent, agenda: v })}
                      placeholder="e.g. 10:00 AM — Doors open"
                      addLabel="Add slot"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>What participants get</Label>
                    <StringListEditor
                      value={editingEvent.perks || []}
                      onChange={(v) => setEditingEvent({ ...editingEvent, perks: v })}
                      placeholder="e.g. Certificate of participation"
                      addLabel="Add perk"
                    />
                  </div>

                  <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 p-4">
                    <label className="flex items-center gap-2.5">
                      <Switch
                        checked={editingEvent.registrationOpen !== false}
                        onCheckedChange={(v) =>
                          setEditingEvent({ ...editingEvent, registrationOpen: v })
                        }
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Registration open
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5">
                      <Switch
                        checked={editingEvent.isPublished !== false}
                        onCheckedChange={(v) =>
                          setEditingEvent({ ...editingEvent, isPublished: v })
                        }
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Show on public page
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setEditingEvent(null)}>
                      Cancel
                    </Button>
                    <Button onClick={saveEvent} disabled={saving}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {editingEvent._id ? 'Save event' : 'Add event'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── CONTENT ──────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activities &amp; programmes</CardTitle>
                <CardDescription>
                  The recurring programmes, with when they run.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.activities || []).map((activity, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Input
                          value={activity.title}
                          onChange={(e) => {
                            const next = [...(club.activities || [])];
                            next[i] = { ...activity, title: e.target.value };
                            setList('activities', next);
                          }}
                          placeholder="Activity title"
                          disabled={!canManage}
                        />
                        <Input
                          value={activity.cadence || ''}
                          onChange={(e) => {
                            const next = [...(club.activities || [])];
                            next[i] = { ...activity, cadence: e.target.value };
                            setList('activities', next);
                          }}
                          placeholder="When it runs — e.g. Wednesdays · 5:00 PM"
                          disabled={!canManage}
                        />
                        <Textarea
                          value={activity.description}
                          onChange={(e) => {
                            const next = [...(club.activities || [])];
                            next[i] = { ...activity, description: e.target.value };
                            setList('activities', next);
                          }}
                          rows={3}
                          placeholder="What happens in it"
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'activities',
                              (club.activities || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('activities', [
                        ...(club.activities || []),
                        { title: '', description: '', cadence: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add activity
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal structure</CardTitle>
                <CardDescription>
                  The sub-groups or wings inside this club.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.wings || []).map((wing, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Input
                          value={wing.name}
                          onChange={(e) => {
                            const next = [...(club.wings || [])];
                            next[i] = { ...wing, name: e.target.value };
                            setList('wings', next);
                          }}
                          placeholder="Wing name"
                          disabled={!canManage}
                        />
                        <Textarea
                          value={wing.description}
                          onChange={(e) => {
                            const next = [...(club.wings || [])];
                            next[i] = { ...wing, description: e.target.value };
                            setList('wings', next);
                          }}
                          rows={2}
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'wings',
                              (club.wings || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove wing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('wings', [...(club.wings || []), { name: '', description: '' }])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add wing
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
                <CardDescription>
                  Awards, milestones and records shown on the club page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.achievements || []).map((ach, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                          <Input
                            value={ach.title}
                            onChange={(e) => {
                              const next = [...(club.achievements || [])];
                              next[i] = { ...ach, title: e.target.value };
                              setList('achievements', next);
                            }}
                            placeholder="Title"
                            disabled={!canManage}
                          />
                          <select
                            value={ach.kind || 'Award'}
                            onChange={(e) => {
                              const next = [...(club.achievements || [])];
                              next[i] = {
                                ...ach,
                                kind: e.target.value as (typeof ACHIEVEMENT_KINDS)[number],
                              };
                              setList('achievements', next);
                            }}
                            disabled={!canManage}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 outline-none"
                          >
                            {ACHIEVEMENT_KINDS.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                          <Input
                            value={ach.year || ''}
                            onChange={(e) => {
                              const next = [...(club.achievements || [])];
                              next[i] = { ...ach, year: e.target.value };
                              setList('achievements', next);
                            }}
                            placeholder="2026"
                            className="w-24"
                            disabled={!canManage}
                          />
                        </div>
                        <Textarea
                          value={ach.detail || ''}
                          onChange={(e) => {
                            const next = [...(club.achievements || [])];
                            next[i] = { ...ach, detail: e.target.value };
                            setList('achievements', next);
                          }}
                          rows={2}
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'achievements',
                              (club.achievements || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove achievement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('achievements', [
                        ...(club.achievements || []),
                        { title: '', detail: '', year: '', kind: 'Award' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add achievement
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testimonials</CardTitle>
                <CardDescription>
                  Quotes from members, shown near the bottom of the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.testimonials || []).map((t, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Textarea
                          value={t.quote}
                          onChange={(e) => {
                            const next = [...(club.testimonials || [])];
                            next[i] = { ...t, quote: e.target.value };
                            setList('testimonials', next);
                          }}
                          rows={3}
                          placeholder="The quote"
                          disabled={!canManage}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={t.name}
                            onChange={(e) => {
                              const next = [...(club.testimonials || [])];
                              next[i] = { ...t, name: e.target.value };
                              setList('testimonials', next);
                            }}
                            placeholder="Name"
                            disabled={!canManage}
                          />
                          <Input
                            value={t.detail || ''}
                            onChange={(e) => {
                              const next = [...(club.testimonials || [])];
                              next[i] = { ...t, detail: e.target.value };
                              setList('testimonials', next);
                            }}
                            placeholder="Role, year"
                            disabled={!canManage}
                          />
                        </div>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'testimonials',
                              (club.testimonials || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove testimonial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('testimonials', [
                        ...(club.testimonials || []),
                        { quote: '', name: '', detail: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add testimonial
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Practical details</CardTitle>
                <CardDescription>
                  Fees, timings and eligibility — the info students check first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PairListEditor
                  value={club.logistics || []}
                  onChange={(v) => setList('logistics', v)}
                  labelPlaceholder="Label"
                  valuePlaceholder="Value"
                  addLabel="Add row"
                  disabled={!canManage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to join</CardTitle>
                <CardDescription>The step-by-step joining process.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.joinProcess || []).map((step, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
                          <Input
                            value={step.step || ''}
                            onChange={(e) => {
                              const next = [...(club.joinProcess || [])];
                              next[i] = { ...step, step: e.target.value };
                              setList('joinProcess', next);
                            }}
                            placeholder="01"
                            disabled={!canManage}
                          />
                          <Input
                            value={step.title}
                            onChange={(e) => {
                              const next = [...(club.joinProcess || [])];
                              next[i] = { ...step, title: e.target.value };
                              setList('joinProcess', next);
                            }}
                            placeholder="Step title"
                            disabled={!canManage}
                          />
                        </div>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const next = [...(club.joinProcess || [])];
                            next[i] = { ...step, description: e.target.value };
                            setList('joinProcess', next);
                          }}
                          rows={2}
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'joinProcess',
                              (club.joinProcess || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove step"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('joinProcess', [
                        ...(club.joinProcess || []),
                        { step: '', title: '', description: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add step
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PEOPLE ───────────────────────────────────────────── */}
          <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coordinator</CardTitle>
                <CardDescription>
                  The faculty member who oversees the club.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coord">Name</Label>
                    <Input
                      id="coord"
                      value={club.coordinator || ''}
                      onChange={(e) => set('coordinator', e.target.value)}
                      disabled={!canManage}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coordRole">Role</Label>
                    <Input
                      id="coordRole"
                      value={club.coordinatorRole || ''}
                      onChange={(e) => set('coordinatorRole', e.target.value)}
                      disabled={!canManage}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coordNote">Note</Label>
                  <Textarea
                    id="coordNote"
                    value={club.coordinatorNote || ''}
                    onChange={(e) => set('coordinatorNote', e.target.value)}
                    rows={2}
                    disabled={!canManage}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Council &amp; core team</CardTitle>
                <CardDescription>
                  The student council. The first row is highlighted on the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.team || []).map((member, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input
                            value={member.role}
                            onChange={(e) => {
                              const next = [...(club.team || [])];
                              next[i] = { ...member, role: e.target.value };
                              setList('team', next);
                            }}
                            placeholder="President"
                            disabled={!canManage}
                          />
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const next = [...(club.team || [])];
                              next[i] = { ...member, name: e.target.value };
                              setList('team', next);
                            }}
                            placeholder="Name"
                            disabled={!canManage}
                          />
                          <Input
                            value={member.branch || ''}
                            onChange={(e) => {
                              const next = [...(club.team || [])];
                              next[i] = { ...member, branch: e.target.value };
                              setList('team', next);
                            }}
                            placeholder="B.Tech CSE, 4th Year"
                            disabled={!canManage}
                          />
                        </div>
                        <Input
                          value={member.note || ''}
                          onChange={(e) => {
                            const next = [...(club.team || [])];
                            next[i] = { ...member, note: e.target.value };
                            setList('team', next);
                          }}
                          placeholder="Speciality — e.g. Leads the annual exhibition"
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'team',
                              (club.team || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('team', [
                        ...(club.team || []),
                        { role: '', name: '', branch: '', note: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add member
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FAQ ──────────────────────────────────────────────── */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequently asked questions</CardTitle>
                <CardDescription>
                  The accordion at the bottom of the club page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(club.faqs || []).map((faq, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Input
                          value={faq.question}
                          onChange={(e) => {
                            const next = [...(club.faqs || [])];
                            next[i] = { ...faq, question: e.target.value };
                            setList('faqs', next);
                          }}
                          placeholder="Question"
                          disabled={!canManage}
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const next = [...(club.faqs || [])];
                            next[i] = { ...faq, answer: e.target.value };
                            setList('faqs', next);
                          }}
                          rows={3}
                          placeholder="Answer"
                          disabled={!canManage}
                        />
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            setList(
                              'faqs',
                              (club.faqs || []).filter((_, idx) => idx !== i)
                            )
                          }
                          className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setList('faqs', [...(club.faqs || []), { question: '', answer: '' }])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add question
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sticky save bar */}
        {canManage && dirty && (
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur-md">
            <p className="text-sm font-medium text-slate-600">
              You have unsaved changes on this club.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={load} disabled={saving}>
                Discard
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
