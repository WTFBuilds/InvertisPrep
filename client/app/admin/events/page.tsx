'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { eventApi } from '@/lib/api';
import type { InvertisEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Bold,
  CalendarDays,
  ExternalLink,
  Eye,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Quote,
  RemoveFormatting,
  Search,
  Sparkles,
  Strikethrough,
  Trash2,
  Underline,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';

const CATEGORIES = ['cultural', 'technical', 'sports', 'academic', 'Annual Fest'];

const CATEGORY_LABELS: Record<string, string> = {
  cultural: 'Cultural',
  technical: 'Technical',
  sports: 'Sports',
  academic: 'Academic & Career',
  'Annual Fest': 'Annual Fest',
};

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: 'cultural',
  startDate: '',
  date: '',
  time: '',
  venue: '',
  organizer: '',
  description: '',
  longDescription: '',
  content: '',
  image: '',
  status: 'published' as 'draft' | 'published',
  featured: false,
  registrationOpen: true,
  registrationUrl: '',
  timeline: [] as string[],
  rules: [] as string[],
};

type FormState = typeof EMPTY_FORM;

// Mirror of the server-side sanitizer — previews and saves stay clean even
// before the request leaves the browser.
const sanitizeHtml = (input: string) => {
  if (!input) return '';
  return String(input)
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|link|meta|base)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|select|textarea|link|meta|base)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*("\s*data:(?!image\/)[^"]*"|'\s*data:(?!image\/)[^']*')/gi, '$1="#"')
    .trim();
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

const isUpcoming = (event: InvertisEvent) => {
  if (!event.startDate) return null;
  const start = new Date(event.startDate);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start.getTime() >= today.getTime();
};

// ── Toolbar button ────────────────────────────────────────────────────────
function ToolButton({
  onClick,
  title,
  children,
  active = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault() /* keep editor selection */}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
        active ? 'bg-indigo-50 text-indigo-600' : ''
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  // events.view gates the page itself (admin layout); events.manage gates writes.
  const canModify = hasPermission(user, 'events.manage');

  const [events, setEvents] = useState<InvertisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [newTimelineItem, setNewTimelineItem] = useState('');
  const [newRuleItem, setNewRuleItem] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventApi.getAllAdmin();
      setEvents(response.data || []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load events from the API server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Seed the uncontrolled contentEditable whenever the editor opens.
  useEffect(() => {
    if (view === 'editor' && editorRef.current) {
      editorRef.current.innerHTML = form.content || '';
      setEditorMode('write');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, editingSlug]);

  // ── Editor helpers ──────────────────────────────────────────────────
  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRangeRef.current) {
      sel.addRange(savedRangeRef.current);
    } else if (editorRef.current) {
      // Fallback: place caret at the end of the article body
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.addRange(range);
    }
  };

  const insertLink = () => {
    const url = window.prompt('Link URL (https://...)', 'https://');
    if (!url || !/^https?:\/\//i.test(url)) return;
    exec('createLink', url);
  };

  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    try {
      setUploadingBodyImage(true);
      setError('');
      const res = await eventApi.uploadImage(file);
      if (res.success && res.data?.url) {
        restoreSelection();
        exec('insertImage', res.data.url);
      } else {
        setError('Failed to upload image to the server.');
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error occurred during image upload.'
      );
    } finally {
      setUploadingBodyImage(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadingImage(true);
      setError('');
      setSuccess('');
      const res = await eventApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setField('image', res.data.url);
        setSuccess('Poster image uploaded successfully!');
      } else {
        setError('Failed to upload image to the server.');
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error occurred during image upload.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // ── List actions ────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setEditingSlug(null);
    setNewTimelineItem('');
    setNewRuleItem('');
    setError('');
    setSuccess('');
    setView('editor');
  };

  const openEdit = (event: InvertisEvent) => {
    setForm({
      title: event.title,
      slug: event.id,
      category: event.category,
      startDate: toDateInput(event.startDate),
      date: event.date,
      time: event.time,
      venue: event.venue,
      organizer: event.organizer,
      description: event.description,
      longDescription: event.longDescription || '',
      content: event.content || '',
      image: event.image,
      status: event.status === 'draft' ? 'draft' : 'published',
      featured: !!event.featured,
      registrationOpen: event.registrationOpen !== false,
      registrationUrl: event.registrationUrl || '',
      timeline: event.timeline || [],
      rules: event.rules || [],
    });
    setSlugTouched(true);
    setEditingSlug(event.id);
    setNewTimelineItem('');
    setNewRuleItem('');
    setError('');
    setSuccess('');
    setView('editor');
  };

  const closeEditor = () => {
    setView('list');
    setEditingSlug(null);
    setError('');
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      // Auto-derive the slug from the title until the admin edits it manually.
      slug: !editingSlug && !slugTouched ? slugify(value) : prev.slug,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const content = sanitizeHtml(editorRef.current?.innerHTML || '');

    if (!form.title.trim() || !form.date.trim() || !form.time.trim() || !form.venue.trim() || !form.organizer.trim() || !form.description.trim()) {
      setError('Please fill in every required field (title, date, time, venue, organizer, short description).');
      return;
    }
    if (!form.image.trim()) {
      setError('A poster image is required — upload one before saving.');
      return;
    }
    if (!editingSlug && !form.slug.trim()) {
      setError('A URL slug is required.');
      return;
    }
    if (!content && !form.longDescription.trim()) {
      setError('Write the detailed event page content before saving.');
      return;
    }

    const payload: Partial<InvertisEvent> = {
      title: form.title.trim(),
      category: form.category,
      startDate: form.startDate || undefined,
      date: form.date.trim(),
      time: form.time.trim(),
      venue: form.venue.trim(),
      organizer: form.organizer.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      content,
      image: form.image.trim(),
      status: form.status,
      featured: form.featured,
      registrationOpen: form.registrationOpen,
      registrationUrl: form.registrationUrl.trim(),
      timeline: form.timeline,
      rules: form.rules,
    };

    try {
      setSaving(true);
      if (editingSlug) {
        await eventApi.update(editingSlug, payload);
        setSuccess('Event updated successfully!');
      } else {
        await eventApi.create({ ...payload, id: form.slug.trim() });
        setSuccess('Event created successfully!');
      }
      setView('list');
      setEditingSlug(null);
      await fetchEvents();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save the event.'
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (event: InvertisEvent) => {
    const next = event.status === 'draft' ? 'published' : 'draft';
    try {
      setError('');
      setSuccess('');
      await eventApi.update(event.id, { status: next });
      setSuccess(next === 'published' ? `"${event.title}" is now live.` : `"${event.title}" moved to drafts.`);
      await fetchEvents();
    } catch {
      setError('Failed to update the event status.');
    }
  };

  const handleDelete = async (eventSlug: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This permanently removes the event page. This action cannot be undone.`)) return;
    try {
      setDeletingSlug(eventSlug);
      setError('');
      setSuccess('');
      await eventApi.delete(eventSlug);
      setSuccess('Event deleted successfully.');
      await fetchEvents();
    } catch {
      setError('Failed to delete the event.');
    } finally {
      setDeletingSlug(null);
    }
  };

  // ── List builders ───────────────────────────────────────────────────
  const addTimelineItem = () => {
    if (!newTimelineItem.trim()) return;
    setField('timeline', [...form.timeline, newTimelineItem.trim()]);
    setNewTimelineItem('');
  };

  const addRuleItem = () => {
    if (!newRuleItem.trim()) return;
    setField('rules', [...form.rules, newRuleItem.trim()]);
    setNewRuleItem('');
  };

  const moveItem = (list: 'timeline' | 'rules', idx: number, dir: -1 | 1) => {
    const items = [...form[list]];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    setField(list, items);
  };

  const removeItem = (list: 'timeline' | 'rules', idx: number) => {
    setField(
      list,
      form[list].filter((_, i) => i !== idx)
    );
  };

  // ── Derived list data ───────────────────────────────────────────────
  const stats = {
    total: events.length,
    published: events.filter((e) => e.status !== 'draft').length,
    drafts: events.filter((e) => e.status === 'draft').length,
    featured: events.filter((e) => e.featured).length,
  };

  const filteredEvents = events.filter((event) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'draft' ? event.status === 'draft' : event.status !== 'draft');
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      event.title.toLowerCase().includes(q) ||
      event.id.toLowerCase().includes(q) ||
      event.organizer.toLowerCase().includes(q) ||
      event.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ── ── LIST VIEW ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 bg-white p-6 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <CalendarDays className="h-6 w-6 text-indigo-600" /> Events Manager
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Create detailed event pages — posters, rich content, schedules and rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/events"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View public page
            </Link>
            {canModify && (
              <Button
                onClick={openCreate}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                <Plus className="mr-1 h-4 w-4" /> New Event
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="rounded-2xl border-green-200 bg-green-50">
            <AlertDescription className="font-medium text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {!canModify && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              Your role has <strong>events.view</strong> only — you can browse and preview events, but
              creating, editing and publishing requires the <strong>events.manage</strong> permission.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total events', value: stats.total, icon: CalendarDays },
            { label: 'Published', value: stats.published, icon: Eye },
            { label: 'Drafts', value: stats.drafts, icon: FileText },
            { label: 'Featured', value: stats.featured, icon: Sparkles },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-black leading-none tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* List card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">All events</h2>
              <p className="text-xs text-slate-400">
                {filteredEvents.length} of {events.length} shown
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(['all', 'published', 'draft'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                      statusFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full rounded-xl border-slate-200 pl-9 text-xs sm:w-64"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-400">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-bold text-slate-700">No events found</p>
              <p className="mt-1 text-xs text-slate-400">
                {events.length === 0
                  ? 'Create your first event to see it on the public page.'
                  : 'Try a different search or filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="p-4 pl-6">Event</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Flags</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEvents.map((event) => {
                    const upcoming = isUpcoming(event);
                    return (
                      <tr key={event.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                              {event.image ? (
                                <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-extrabold text-slate-900">{event.title}</p>
                              <p className="truncate font-mono text-[10px] text-slate-400">/events/{event.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {CATEGORY_LABELS[event.category] || event.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="whitespace-nowrap font-semibold text-slate-700">{event.date}</p>
                          {upcoming !== null && (
                            <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${upcoming ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {upcoming ? 'Upcoming' : 'Past'}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {event.status === 'draft' ? (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Draft
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              Live
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {event.featured && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">Featured</span>
                            )}
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                event.registrationOpen !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {event.registrationOpen !== false ? 'Reg. open' : 'Reg. closed'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/events/${event.id}`}
                              target="_blank"
                              title="View public page"
                              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            {canModify && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => togglePublish(event)}
                                  title={event.status === 'draft' ? 'Publish event' : 'Move to drafts'}
                                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {event.status === 'draft' ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEdit(event)}
                                  title="Edit"
                                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(event.id, event.title)}
                                  disabled={deletingSlug === event.id}
                                  title="Delete"
                                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                >
                                  {deletingSlug === event.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ── EDITOR VIEW ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24">
      {/* Sticky editor top bar */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Back to list"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-slate-900">
                {editingSlug ? 'Edit event' : 'New event'}
              </h1>
              <p className="truncate text-[11px] text-slate-400">
                {editingSlug ? `Editing /events/${editingSlug}` : 'Write the event page like a blog post'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                form.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {form.status === 'draft' ? 'Draft' : 'Published'}
            </span>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editingSlug ? 'Save changes' : form.status === 'draft' ? 'Save draft' : 'Publish event'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="rounded-2xl border-green-200 bg-green-50">
          <AlertDescription className="font-medium text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & slug */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title" className="text-xs font-bold text-slate-600">
                Event Title *
              </Label>
              <input
                id="ev-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Invertia 2026"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xl font-black tracking-tight text-slate-900 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-slug" className="text-xs font-bold text-slate-600">
                URL Slug *
              </Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2.5 font-mono text-xs text-slate-500">
                  /events/
                </span>
                <Input
                  id="ev-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setField('slug', slugify(e.target.value));
                  }}
                  placeholder="invertia-2026"
                  disabled={!!editingSlug}
                  className="flex-1 rounded-xl border-slate-200 font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {editingSlug ? 'The slug is locked while editing — the page URL would break otherwise.' : 'Lowercase letters, numbers and dashes. This becomes the page URL.'}
              </p>
            </div>
          </div>

          {/* Poster */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Label className="text-xs font-bold text-slate-600">Poster Image *</Label>
            {form.image ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                    <img src={form.image} alt="Event poster preview" className="h-full w-full object-cover" />
                  </div>
                  <p className="truncate text-[10px] text-slate-400">{form.image}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" disabled={uploadingImage} />
                    <span className="inline-block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                      Change
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setField('image', '')}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-all hover:border-indigo-300 hover:bg-slate-50">
                <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" disabled={uploadingImage} />
                {uploadingImage ? (
                  <div className="space-y-2 py-2 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-bold text-slate-600">Uploading poster image...</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">Upload Poster Image</p>
                    <p className="text-[10px] text-slate-400">JPEG, PNG or WebP — this is the card and billboard artwork</p>
                  </div>
                )}
              </label>
            )}
          </div>

          {/* Rich content editor */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Detailed Page Content *</Label>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Write like a blog post — headings, lists, quotes and images. Shown on the event page.
                </p>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(['write', 'preview'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setEditorMode(mode)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                      editorMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {editorMode === 'write' ? (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                  <ToolButton title="Bold" onClick={() => exec('bold')}>
                    <Bold className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Italic" onClick={() => exec('italic')}>
                    <Italic className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Underline" onClick={() => exec('underline')}>
                    <Underline className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Strikethrough" onClick={() => exec('strikeThrough')}>
                    <Strikethrough className="h-4 w-4" />
                  </ToolButton>
                  <span className="mx-1 h-5 w-px bg-slate-200" />
                  <ToolButton title="Heading" onClick={() => exec('formatBlock', '<H2>')}>
                    <Heading2 className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Subheading" onClick={() => exec('formatBlock', '<H3>')}>
                    <Heading3 className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Paragraph" onClick={() => exec('formatBlock', '<P>')}>
                    <FileText className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Quote" onClick={() => exec('formatBlock', '<BLOCKQUOTE>')}>
                    <Quote className="h-4 w-4" />
                  </ToolButton>
                  <span className="mx-1 h-5 w-px bg-slate-200" />
                  <ToolButton title="Bullet list" onClick={() => exec('insertUnorderedList')}>
                    <List className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton title="Numbered list" onClick={() => exec('insertOrderedList')}>
                    <ListOrdered className="h-4 w-4" />
                  </ToolButton>
                  <span className="mx-1 h-5 w-px bg-slate-200" />
                  <ToolButton title="Insert link" onClick={insertLink}>
                    <Link2 className="h-4 w-4" />
                  </ToolButton>
                  <label className="cursor-pointer" onMouseDown={saveSelection}>
                    <input type="file" accept="image/*" onChange={handleBodyImageUpload} className="hidden" disabled={uploadingBodyImage} />
                    <span
                      title="Insert image"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      {uploadingBodyImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </span>
                  </label>
                  <ToolButton title="Clear formatting" onClick={() => exec('removeFormat')}>
                    <RemoveFormatting className="h-4 w-4" />
                  </ToolButton>
                </div>

                {/* Editable canvas */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    /* uncontrolled — read on save */
                  }}
                  data-placeholder="Start writing the event story — about, highlights, prizes, what to bring..."
                  className="prose-editor min-h-[320px] px-6 py-5 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200"
                />
              </>
            ) : (
              <div className="max-h-[480px] overflow-y-auto px-6 py-5">
                {editorRef.current?.innerHTML && sanitizeHtml(editorRef.current.innerHTML) ? (
                  <div
                    className="prose-editor text-sm leading-relaxed text-slate-700"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(editorRef.current.innerHTML) }}
                  />
                ) : (
                  <p className="py-12 text-center text-xs italic text-slate-400">
                    Nothing written yet — switch to Write and start composing.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline builder */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Timeline / Schedule
            </Label>
            <p className="-mt-1 text-[10px] text-slate-400">Step-by-step schedule shown as a timeline on the event page.</p>
            <div className="flex gap-2">
              <Input
                value={newTimelineItem}
                onChange={(e) => setNewTimelineItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTimelineItem();
                  }
                }}
                placeholder="e.g. Day 1 10:00 AM: Inaugural function"
                className="flex-1 rounded-xl border-slate-200 text-xs"
              />
              <Button
                type="button"
                onClick={addTimelineItem}
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-semibold"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <ul className="space-y-1.5">
              {form.timeline.map((step, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-1.5">
                  <span className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    {step}
                  </span>
                  <span className="flex shrink-0 items-center">
                    <button type="button" onClick={() => moveItem('timeline', idx, -1)} disabled={idx === 0} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveItem('timeline', idx, 1)} disabled={idx === form.timeline.length - 1} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => removeItem('timeline', idx)} className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50" title="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
              {form.timeline.length === 0 && (
                <p className="text-[10px] italic text-slate-400">No schedule items yet — optional but recommended.</p>
              )}
            </ul>
          </div>

          {/* Rules builder */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Info className="h-3.5 w-3.5 text-indigo-600" /> Rules &amp; Guidelines
            </Label>
            <p className="-mt-1 text-[10px] text-slate-400">Eligibility, dress code, team limits — shown as a numbered list.</p>
            <div className="flex gap-2">
              <Input
                value={newRuleItem}
                onChange={(e) => setNewRuleItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRuleItem();
                  }
                }}
                placeholder="e.g. Valid college ID card is mandatory."
                className="flex-1 rounded-xl border-slate-200 text-xs"
              />
              <Button
                type="button"
                onClick={addRuleItem}
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-semibold"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <ul className="space-y-1.5">
              {form.rules.map((rule, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-1.5">
                  <span className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    {rule}
                  </span>
                  <span className="flex shrink-0 items-center">
                    <button type="button" onClick={() => moveItem('rules', idx, -1)} disabled={idx === 0} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveItem('rules', idx, 1)} disabled={idx === form.rules.length - 1} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => removeItem('rules', idx)} className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50" title="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
              {form.rules.length === 0 && (
                <p className="text-[10px] italic text-slate-400">No rules added yet — optional.</p>
              )}
            </ul>
          </div>
        </div>

        {/* ── Settings sidebar ── */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black tracking-tight text-slate-900">Event settings</h3>

            <div className="space-y-1.5">
              <Label htmlFor="ev-category" className="text-xs font-bold text-slate-600">
                Category *
              </Label>
              <select
                id="ev-category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-startdate" className="text-xs font-bold text-slate-600">
                Start Date <span className="font-medium text-slate-400">(for sorting)</span>
              </Label>
              <Input
                id="ev-startdate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="rounded-xl border-slate-200 text-xs"
              />
              <p className="text-[10px] text-slate-400">Powers the Upcoming / Past badges and ordering.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ev-date" className="text-xs font-bold text-slate-600">
                  Date Display *
                </Label>
                <Input
                  id="ev-date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  placeholder="e.g. Oct 14 - 16, 2026"
                  className="rounded-xl border-slate-200 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-time" className="text-xs font-bold text-slate-600">
                  Time Display *
                </Label>
                <Input
                  id="ev-time"
                  value={form.time}
                  onChange={(e) => setField('time', e.target.value)}
                  placeholder="e.g. 10:00 AM onwards"
                  className="rounded-xl border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-venue" className="text-xs font-bold text-slate-600">
                <MapPin className="mr-1 inline h-3.5 w-3.5" /> Venue *
              </Label>
              <Input
                id="ev-venue"
                value={form.venue}
                onChange={(e) => setField('venue', e.target.value)}
                placeholder="e.g. Seminar Hall 1 & Main Ground"
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-organizer" className="text-xs font-bold text-slate-600">
                <Users className="mr-1 inline h-3.5 w-3.5" /> Organizer *
              </Label>
              <Input
                id="ev-organizer"
                value={form.organizer}
                onChange={(e) => setField('organizer', e.target.value)}
                placeholder="e.g. Invertis Cultural Committee"
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-shortdesc" className="text-xs font-bold text-slate-600">
                Short Description *
              </Label>
              <textarea
                id="ev-shortdesc"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="One or two lines shown on cards and the billboard..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Publishing card */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black tracking-tight text-slate-900">Publishing</h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Status</Label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(['draft', 'published'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setField('status', s)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-colors ${
                      form.status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Drafts are hidden from students — only staff with events.view can see them.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
              <span className="text-xs font-bold text-slate-700">
                Featured
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Show in the billboard slider</span>
              </span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
              <span className="text-xs font-bold text-slate-700">
                Registrations open
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Shows the Register action</span>
              </span>
              <input
                type="checkbox"
                checked={form.registrationOpen}
                onChange={(e) => setField('registrationOpen', e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {form.registrationOpen && (
              <div className="space-y-1.5">
                <Label htmlFor="ev-regurl" className="text-xs font-bold text-slate-600">
                  Registration Link
                </Label>
                <Input
                  id="ev-regurl"
                  value={form.registrationUrl}
                  onChange={(e) => setField('registrationUrl', e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="rounded-xl border-slate-200 text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  Optional — the Register button opens this URL. Leave empty to send students to the contact page.
                </p>
              </div>
            )}
          </div>

          {/* Plain-text fallback note */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-700">Plain-text fallback</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  The rich editor above is what students see. The field below is only used if the rich
                  content is ever empty.
                </p>
              </div>
            </div>
            <textarea
              value={form.longDescription}
              onChange={(e) => setField('longDescription', e.target.value)}
              placeholder="Plain paragraphs fallback..."
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-4 z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
        <p className="hidden text-[11px] text-slate-400 sm:block">
          {form.status === 'draft'
            ? 'Saved as draft — students will not see this event until you publish it.'
            : 'Publishing makes this event live on the public events page instantly.'}
        </p>
        <div className="flex w-full justify-end gap-2 sm:w-auto">
          <Button type="button" onClick={closeEditor} variant="outline" className="rounded-xl px-5 py-2.5 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {editingSlug ? 'Save changes' : form.status === 'draft' ? 'Save draft' : 'Publish event'}
          </Button>
        </div>
      </div>
    </div>
  );
}
