'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { sessionApi } from '@/lib/api';
import type { Session, CreateSessionDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
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
        endYear: new Date().getFullYear() + 1 
      });
      setShowForm(false);
      setEditingId(null);
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save session';
      setError(errorMessage);
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
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionApi.delete(id);
      setSuccess('Session deleted successfully');
      fetchSessions();
    } catch (err: unknown) {
      setError('Failed to delete session');
    }
  };

  const handleCancel = () => {
    setFormData({ 
      id: '', 
      name: '', 
      startYear: new Date().getFullYear(), 
      endYear: new Date().getFullYear() + 1 
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Sessions Management</h1>
            <p className="text-muted-foreground">Manage academic sessions</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6">
            + Add New Session
          </Button>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Session' : 'Add New Session'}</CardTitle>
              <CardDescription>Fill in the session details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">Session ID *</Label>
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g., 2024-25"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Session Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Academic Year 2024-2025"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startYear">Start Year *</Label>
                    <Input
                      id="startYear"
                      type="number"
                      value={formData.startYear}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endYear">End Year *</Label>
                    <Input
                      id="endYear"
                      type="number"
                      value={formData.endYear}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Update' : 'Create'} Session</Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loading ? (
            <p>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No sessions found. Add your first session above.
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{session.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {session.id} | Years: {session.startYear} - {session.endYear}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {session.isActive ? '✓ Active' : '✗ Inactive'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(session._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
