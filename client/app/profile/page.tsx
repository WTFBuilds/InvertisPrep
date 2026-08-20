'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { optimizeAvatar } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';

const getInitials = (name: string) => {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phoneNumber: '',
    course: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Sync state with user context
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
        course: user.course || '',
      });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="mb-8 h-10 w-56" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      studentId: user.studentId || '',
      phoneNumber: user.phoneNumber || '',
      course: user.course || '',
    });
    setIsEditing(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.phoneNumber && !/^\+?[0-9\s-]{10,15}$/.test(formData.phoneNumber.trim())) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    setSaving(true);
    try {
      const response = await authApi.updateProfile({
        name: formData.name.trim(),
        studentId: formData.studentId.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        course: formData.course.trim(),
      });

      if (response.success && response.user) {
        updateUser(response.user);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'An error occurred while saving profile';
      setError(errMessage);
    } finally {
      setSaving(false);
    }
  };

  const infoRow = (icon: React.ReactNode, chipClass: string, label: string, value: string) => (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chipClass}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );

  const fieldClasses = isEditing
    ? 'h-11 border-slate-300 bg-white text-slate-900 focus-visible:ring-indigo-500/40'
    : 'h-11 border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── page header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Account</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">My Profile</h1>
            <p className="mt-2 text-slate-500">Manage your personal and academic details.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/pyq')}
            className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Browse PYQs
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="font-medium text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="font-medium text-emerald-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── left: identity & stats ── */}
          <GlowCard className="h-fit rounded-2xl border-slate-200 bg-white p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-28 w-28 ring-4 ring-indigo-500/15 transition-transform duration-300 hover:scale-105">
                  <AvatarImage
                    src={optimizeAvatar(user.picture)}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-slate-900 text-xl font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <h2 className="mt-5 text-xl font-bold leading-tight text-slate-900">{user.name}</h2>
              <Badge variant="indigo" className="mt-2 uppercase tracking-wider">
                {user.role === 'student' ? 'Student' : user.role === 'super-admin' ? 'Super Admin' : user.role === 'srt' ? 'SRT' : 'Admin'}
              </Badge>

              {/* followers / following */}
              <div className="mt-6 flex w-full items-center justify-center gap-6 rounded-xl border border-slate-100 bg-slate-50/60 py-3">
                <div>
                  <p className="text-lg font-black text-slate-900">{user.followers?.length || 0}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Followers</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-lg font-black text-slate-900">{user.following?.length || 0}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Following</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {infoRow(
                <Mail className="h-4 w-4" />,
                'bg-indigo-100 text-indigo-700',
                'Email Address',
                user.email
              )}
              {infoRow(
                <ShieldCheck className="h-4 w-4" />,
                'bg-emerald-100 text-emerald-700',
                'Account Status',
                'Active'
              )}
              {infoRow(
                <Calendar className="h-4 w-4" />,
                'bg-purple-100 text-purple-700',
                'Account Type',
                'Google Account'
              )}
              {infoRow(
                <GraduationCap className="h-4 w-4" />,
                'bg-blue-100 text-blue-700',
                'Course',
                user.course || 'Not Set'
              )}
            </div>
          </GlowCard>

          {/* ── right: profile details form ── */}
          <GlowCard className="rounded-2xl border-slate-200 bg-white p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Profile Details</h2>
                <p className="mt-1 text-sm text-slate-500">Verify or update your contact and university details.</p>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            <Separator className="my-6" />

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  className={fieldClasses}
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400">
                  <Mail className="h-4 w-4 text-slate-300" />
                  Email Address (Managed via Google)
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="h-11 cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Student ID */}
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    disabled={!isEditing}
                    placeholder="e.g., IU212234"
                    className={fieldClasses}
                  />
                </div>

                {/* Course */}
                <div className="space-y-2">
                  <Label htmlFor="course" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    Course / Branch
                  </Label>
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    disabled={!isEditing}
                    placeholder="e.g., B.Tech CSE"
                    className={fieldClasses}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    placeholder="e.g., 9876543210"
                    className={fieldClasses}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={saving}
                    className="font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800 min-w-[140px]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
