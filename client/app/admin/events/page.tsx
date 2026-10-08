'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { eventApi } from '@/lib/api';
import type { InvertisEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Info,
  CalendarDays,
  UploadCloud,
  Loader2,
} from 'lucide-react';

export default function AdminEventsPage() {
  const { user } = useAuth();
  // SRT can view events but cannot create, edit or delete
  const canModify = hasPermission(user, 'events.manage');
  const [events, setEvents] = useState<InvertisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cultural');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [newTimelineItem, setNewTimelineItem] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [newRuleItem, setNewRuleItem] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');
      setSuccess('');
      const res = await eventApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setImage(res.data.url);
        setSuccess('Poster image uploaded successfully!');
      } else {
        setError('Failed to upload image to server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during image upload.');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getAll();
      setEvents(response.data || []);
    } catch (err: any) {
      setError('Failed to load events from the API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (event: InvertisEvent) => {
    setId(event.id);
    setTitle(event.title);
    setCategory(event.category);
    setDate(event.date);
    setTime(event.time);
    setVenue(event.venue);
    setOrganizer(event.organizer);
    setDescription(event.description);
    setLongDescription(event.longDescription);
    setImage(event.image);
    setFeatured(!!event.featured);
    setRegistrationOpen(event.registrationOpen !== false);
    setTimeline(event.timeline || []);
    setRules(event.rules || []);
    
    // Storing Mongo ID or slug for edit tracking
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setId('');
    setTitle('');
    setCategory('cultural');
    setDate('');
    setTime('');
    setVenue('');
    setOrganizer('');
    setDescription('');
    setLongDescription('');
    setImage('');
    setFeatured(false);
    setRegistrationOpen(true);
    setTimeline([]);
    setRules([]);
    setEditingId(null);
    setShowForm(false);
    setNewTimelineItem('');
    setNewRuleItem('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const eventPayload: Partial<InvertisEvent> = {
      id: id.trim().toLowerCase().replace(/\s+/g, '-'),
      title: title.trim(),
      category,
      date: date.trim(),
      time: time.trim(),
      venue: venue.trim(),
      organizer: organizer.trim(),
      description: description.trim(),
      longDescription: longDescription.trim(),
      image: image.trim(),
      featured,
      registrationOpen,
      timeline,
      rules,
    };

    try {
      if (editingId) {
        await eventApi.update(editingId, eventPayload);
        setSuccess('Event updated successfully!');
      } else {
        await eventApi.create(eventPayload);
        setSuccess('Event created successfully!');
      }
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save event information.');
    }
  };

  const handleDelete = async (eventSlug: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      setError('');
      setSuccess('');
      await eventApi.delete(eventSlug);
      setSuccess('Event deleted successfully.');
      fetchEvents();
    } catch (err: any) {
      setError('Failed to delete event.');
    }
  };

  // List Item addition helper functions
  const addTimelineItem = () => {
    if (!newTimelineItem.trim()) return;
    setTimeline([...timeline, newTimelineItem.trim()]);
    setNewTimelineItem('');
  };

  const removeTimelineItem = (idx: number) => {
    setTimeline(timeline.filter((_, i) => i !== idx));
  };

  const addRuleItem = () => {
    if (!newRuleItem.trim()) return;
    setRules([...rules, newRuleItem.trim()]);
    setNewRuleItem('');
  };

  const removeRuleItem = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Heading Actions Row */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-650" /> Events Directory Management
          </h1>
          <p className="text-xs text-slate-450 mt-1">Configure, add and manage campus events, fests, Hackathons and fests.</p>
        </div>
        {canModify && !showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all">
            + Create Event
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="rounded-2xl bg-green-50 border-green-200">
          <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* 1. CREATION / EDIT EVENT FORM CARD */}
      {showForm && (
        <Card className="rounded-3xl border border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black text-slate-900">{editingId ? 'Edit Event Details' : 'Register New Campus Event'}</CardTitle>
            <CardDescription className="text-xs text-slate-400">Configure parameters, schedule timelines and rules files.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="id" className="text-xs font-bold text-slate-600">Event Unique Slug / ID *</Label>
                  <Input
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. invertia-2026"
                    disabled={!!editingId}
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                  <p className="text-[10px] text-slate-400">Lowercase slug. E.g. `tedx-2026`. Used inside routing URL.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-slate-600">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Invertia 2026"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold text-slate-600">Category *</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-650 shadow-sm"
                  >
                    <option value="cultural">Cultural</option>
                    <option value="technical">Technical</option>
                    <option value="sports">Sports</option>
                    <option value="academic">Academic & Career</option>
                    <option value="Annual Fest">Annual Fest</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold text-slate-600">Date Info *</Label>
                  <Input
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. Oct 14 - 16, 2026"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs font-bold text-slate-600">Time Info *</Label>
                  <Input
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM onwards"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="venue" className="text-xs font-bold text-slate-600">Venue *</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Seminar Hall 1 & Main Ground"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organizer" className="text-xs font-bold text-slate-600">Organizer Name *</Label>
                  <Input
                    id="organizer"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. Invertis Cultural Committee"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-indigo-650"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Poster Image *</Label>
                
                {image ? (
                  <div className="relative border border-slate-200 rounded-2xl p-2.5 bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                        <img
                          src={image}
                          alt="Event Poster Preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">Uploaded Poster</p>
                        <p className="text-[10px] text-slate-450 truncate">{image}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <div className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm">
                          Change
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="text-center space-y-2 py-2">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-650 mx-auto" />
                        <p className="text-xs font-bold text-slate-650">Uploading poster image...</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">Upload Poster Image</p>
                        <p className="text-[10px] text-slate-400">JPEG, PNG, WebP or GIF up to 5MB</p>
                      </div>
                    )}
                  </label>
                )}
                {/* Hidden input for HTML5 required verification */}
                <input type="hidden" name="image" value={image} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-600">Short Description (for Cards) *</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the event in 1-2 lines..."
                  required
                  rows={2}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-650 resize-none shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="longDescription" className="text-xs font-bold text-slate-600">Long Description (Detailed Guide) *</Label>
                <textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Provide complete overview, schedules details, and introduction..."
                  required
                  rows={4}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-650 shadow-sm"
                />
              </div>

              {/* Dynamic timeline list builder */}
              <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Timeline / Schedule Items
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newTimelineItem}
                    onChange={(e) => setNewTimelineItem(e.target.value)}
                    placeholder="e.g. Day 1 10:00 AM: Inaugural function"
                    className="rounded-xl border-slate-200 text-xs flex-1 bg-white"
                  />
                  <Button type="button" onClick={addTimelineItem} variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold">
                    Add Step
                  </Button>
                </div>

                <ul className="space-y-1.5 mt-2">
                  {timeline.map((step, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-700 font-medium">{step}</span>
                      <button type="button" onClick={() => removeTimelineItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {timeline.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No schedule items added yet.</p>
                  )}
                </ul>
              </div>

              {/* Dynamic rules list builder */}
              <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600" /> Handbook Rules / Guidelines
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newRuleItem}
                    onChange={(e) => setNewRuleItem(e.target.value)}
                    placeholder="e.g. Valid college ID card is mandatory."
                    className="rounded-xl border-slate-200 text-xs flex-1 bg-white"
                  />
                  <Button type="button" onClick={addRuleItem} variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold">
                    Add Rule
                  </Button>
                </div>

                <ul className="space-y-1.5 mt-2">
                  {rules.map((rule, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-700 leading-relaxed">{rule}</span>
                      <button type="button" onClick={() => removeRuleItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {rules.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No guidelines added yet.</p>
                  )}
                </ul>
              </div>

              {/* Checkboxes Row */}
              <div className="flex items-center gap-6 border-t border-slate-150 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  Featured Slider Display
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={registrationOpen}
                    onChange={(e) => setRegistrationOpen(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  Registrations Open
                </label>
              </div>

              {/* Form Submission Buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-150 pt-4">
                <Button type="button" onClick={handleCancel} variant="outline" className="rounded-xl text-xs font-semibold py-2.5 px-5">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl">
                  {editingId ? 'Save Event changes' : 'Create Event'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. MAIN LIST/TABLE OF REGISTERED EVENTS */}
      {!showForm && (
        <Card className="rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black text-slate-900">Registered Events</CardTitle>
            <CardDescription className="text-xs text-slate-400">Total events listed: {events.length}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs">Fetching event records...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic text-xs">
                No events currently configured. Click "Create Event" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-150 text-slate-450 uppercase tracking-widest text-[10px] font-bold">
                    <tr>
                      <th className="p-4 pl-6">Event ID</th>
                      <th className="p-4">Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Venue</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-mono text-slate-400 font-bold">{event.id}</td>
                        <td className="p-4 font-extrabold text-slate-900">{event.title}</td>
                        <td className="p-4">
                          <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {event.category}
                          </span>
                        </td>
                        <td className="p-4">{event.date}</td>
                        <td className="p-4 truncate max-w-[150px]" title={event.venue}>{event.venue}</td>
                        <td className="p-4">
                          {event.featured ? (
                            <span className="text-indigo-600 bg-indigo-50 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">Yes</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-1">
                          {canModify && (
                            <>
                              <button
                                onClick={() => handleEdit(event)}
                                className="p-2 hover:bg-indigo-50 text-slate-500 hover:text-indigo-650 rounded-xl transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded-xl transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
