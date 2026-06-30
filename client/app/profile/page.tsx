'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  GraduationCap, 
  ShieldCheck, 
  Edit3, 
  Save, 
  X, 
  Calendar,
  Sparkles
} from 'lucide-react';

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
      router.push('/login');
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
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Student Profile
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your personal and academic details
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/pyq')} 
            className="hover:bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
          >
            Browse PYQs
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="shadow-lg bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left card - Avatar & Stats */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-md h-fit">
            <CardContent className="pt-8 pb-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-indigo-500/20 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                  {user.picture ? (
                    <AvatarImage src={user.picture} alt={user.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-3xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <h2 className="mt-6 text-xl font-bold text-gray-800 text-center leading-tight">
                {user.name}
              </h2>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                <GraduationCap className="h-3.5 w-3.5" />
                {user.role}
              </div>

              <div className="flex justify-around w-full text-center mt-4 bg-gray-50/50 py-2.5 px-1 rounded-xl border border-gray-100">
                <div>
                  <p className="text-base font-bold text-gray-800">{user.followers?.length || 0}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Followers</p>
                </div>
                <div className="border-r border-gray-200 my-1" />
                <div>
                  <p className="text-base font-bold text-gray-800">{user.following?.length || 0}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Following</p>
                </div>
              </div>

              <div className="w-full border-t border-gray-100 my-6" />

              <div className="w-full space-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-gray-700 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account Status</p>
                    <p className="font-semibold text-green-600">Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account Type</p>
                    <p className="font-semibold text-gray-700 capitalize">Google Login User</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Course</p>
                    <p className="font-semibold text-gray-700">{user.course || 'Not Set'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right card - Form details */}
          <Card className="md:col-span-2 border-0 shadow-xl bg-white/70 backdrop-blur-md">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Profile Details</CardTitle>
                  <CardDescription>Verify or update your contact and university details</CardDescription>
                </div>
                {!isEditing && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                      className={`h-11 transition-all ${isEditing ? 'border-indigo-300 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      required
                    />
                  </div>

                  {/* Email field (Disabled/Read-only always) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-gray-300" />
                      Email Address (Managed via Google)
                    </Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="h-11 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Student ID field */}
                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        Student ID
                      </Label>
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., IU212234"
                        className={`h-11 transition-all ${isEditing ? 'border-indigo-300 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      />
                    </div>

                    {/* Course field */}
                    <div className="space-y-2">
                      <Label htmlFor="course" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        Course / Branch
                      </Label>
                      <Input
                        id="course"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., B.Tech CSE"
                        className={`h-11 transition-all ${isEditing ? 'border-indigo-300 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      />
                    </div>

                    {/* Phone Number field */}
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-gray-400" />
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., 9876543210"
                        className={`h-11 transition-all ${isEditing ? 'border-indigo-300 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleCancel}
                      disabled={saving}
                      className="text-gray-500 hover:bg-gray-100 font-semibold"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 min-w-[120px]"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
