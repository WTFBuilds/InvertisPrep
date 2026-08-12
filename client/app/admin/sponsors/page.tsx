'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { sponsorApi } from '@/lib/api';
import type { Sponsor, SponsorTier, CreateSponsorDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { HandCoins, Star, UserRound, ScanLine, Eye, EyeOff } from 'lucide-react';
import SponsorDialog from '@/components/SponsorDialog';

const TIER_LABELS: Record<SponsorTier, string> = {
  supporter: 'Supporter',
  benefactor: 'Benefactor',
  patron: 'Patron',
};

const TIER_BADGES: Record<SponsorTier, string> = {
  supporter: 'border-slate-200 bg-slate-50 text-slate-600',
  benefactor: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  patron: 'border-amber-200 bg-amber-50 text-amber-700',
};

const emptyForm: CreateSponsorDTO = {
  name: '',
  batch: '',
  email: '',
  message: '',
  tier: 'supporter',
  amount: 0,
  isFeatured: false,
  isActive: true,
};

export default function SponsorsPage() {
  const { user } = useAuth();
  // SRT can view sponsors but cannot create, edit or delete
  const canModify = user?.role !== 'srt';
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSponsorDTO>(emptyForm);

  const fetchSponsors = async () => {
    try {
      const response = await sponsorApi.getAllAdmin();
      setSponsors(response.data || []);
    } catch (err: unknown) {
      setError('Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (editingId) {
        await sponsorApi.update(editingId, formData);
        setSuccess('Sponsor updated successfully');
      } else {
        await sponsorApi.create(formData);
        setSuccess('Sponsor created successfully');
      }
      setFormData(emptyForm);
      setShowForm(false);
      setEditingId(null);
      fetchSponsors();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save sponsor';
      setError(errorMessage);
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setFormData({
      name: sponsor.name,
      batch: sponsor.batch || '',
      email: sponsor.email || '',
      message: sponsor.message || '',
      tier: sponsor.tier,
      amount: sponsor.amount || 0,
      isFeatured: sponsor.isFeatured,
      isActive: sponsor.isActive,
    });
    setEditingId(sponsor._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this sponsor? They will no longer appear on the public page.')) return;
    try {
      await sponsorApi.delete(id);
      setSuccess('Sponsor removed');
      fetchSponsors();
    } catch (err: unknown) {
      setError('Failed to remove sponsor');
    }
  };

  const handleToggleActive = async (sponsor: Sponsor) => {
    try {
      await sponsorApi.update(sponsor._id, { isActive: !sponsor.isActive });
      fetchSponsors();
    } catch (err: unknown) {
      setError('Failed to update sponsor');
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Sponsors</h1>
            <p className="text-sm text-slate-500">Manage sponsors shown on the public page</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="rounded-full"
            >
              <ScanLine className="mr-1.5 h-4 w-4 text-indigo-500" /> Sponsor QR
            </Button>
            {canModify && !showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              >
                + Add Sponsor
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-emerald-50 border-emerald-200">
            <AlertDescription className="text-emerald-800">{success}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <Card className="mb-6 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{editingId ? 'Edit Sponsor' : 'Add Sponsor'}</CardTitle>
              <CardDescription>Add someone who sponsored InvertisPrep</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Rahul Sharma"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch">Batch / Title</Label>
                    <Input
                      id="batch"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      placeholder="e.g., CSE 2021-25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={0}
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="A short message from the sponsor"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tier</Label>
                    <Select
                      value={formData.tier}
                      onValueChange={(v) => setFormData({ ...formData, tier: v as SponsorTier })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TIER_LABELS) as SponsorTier[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIER_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-6 pb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Switch
                        checked={formData.isFeatured}
                        onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })}
                      />
                      Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                  >
                    {editingId ? 'Update' : 'Add'} Sponsor
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading sponsors...</p>
          ) : sponsors.length === 0 ? (
            <Card className="border-dashed border-slate-200">
              <CardContent className="p-10 text-center text-sm text-slate-500">
                No sponsors yet. Add your first sponsor above.
              </CardContent>
            </Card>
          ) : (
            sponsors.map((sponsor) => {
              const tierBadge = TIER_BADGES[sponsor.tier] ?? TIER_BADGES.supporter;
              return (
                <Card key={sponsor._id} className="border-slate-200 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-100">
                          <UserRound className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{sponsor.name}</h3>
                            <Badge className={`border ${tierBadge}`}>
                              {TIER_LABELS[sponsor.tier]}
                            </Badge>
                            {sponsor.isFeatured && (
                              <Badge className="border-indigo-100 bg-indigo-50 text-indigo-700">
                                <Star className="mr-1 h-3 w-3" /> Featured
                              </Badge>
                            )}
                            <Badge
                              className={
                                sponsor.isActive
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-500'
                              }
                            >
                              {sponsor.isActive ? 'Active' : 'Hidden'}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                            {sponsor.batch && <span>{sponsor.batch}</span>}
                            {sponsor.amount > 0 && <span>₹{sponsor.amount.toLocaleString('en-IN')}</span>}
                            {sponsor.email && <span>{sponsor.email}</span>}
                          </div>
                          {sponsor.message && (
                            <p className="mt-2 text-sm text-slate-500">“{sponsor.message}”</p>
                          )}
                        </div>
                      </div>
                      {canModify && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => handleToggleActive(sponsor)}
                            title={sponsor.isActive ? 'Hide from public page' : 'Show on public page'}
                          >
                            {sponsor.isActive ? (
                              <EyeOff className="mr-1.5 h-4 w-4" />
                            ) : (
                              <Eye className="mr-1.5 h-4 w-4" />
                            )}
                            {sponsor.isActive ? 'Hide' : 'Show'}
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleEdit(sponsor)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" className="rounded-full" onClick={() => handleDelete(sponsor._id)}>
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* QR preview for admins */}
      <SponsorDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </ProtectedRoute>
  );
}
