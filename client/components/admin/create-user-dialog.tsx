'use client';

import { useEffect, useState } from 'react';
import { adminUserApi } from '@/lib/api';
import type { AdminRole, UserRole } from '@/types';
import { ROLE_COLORS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Custom roles available for assignment */
  customRoles: AdminRole[];
  onCreated: (message: string) => void;
}

const BUILTIN_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'srt', label: 'SRT' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super Admin' },
];

/**
 * Create a new account (super-admin only). Assigns either a built-in role or
 * a custom role; custom roles are submitted as roleId and resolved server-side.
 */
export function CreateUserDialog({ open, onOpenChange, customRoles, onCreated }: CreateUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  // "role:<id>" for custom roles, plain role name for built-ins
  const [roleValue, setRoleValue] = useState('student');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setStudentId('');
      setCourse('');
      setRoleValue('student');
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Enter the user\u2019s name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber.trim())) {
      return setError('Phone number must be 10 digits');
    }

    const isCustom = roleValue.startsWith('role:');
    const roleId = isCustom ? roleValue.slice(5) : null;
    const role = (isCustom ? 'staff' : roleValue) as UserRole;

    setSaving(true);
    try {
      const res = await adminUserApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        roleId,
        studentId: studentId.trim(),
        phoneNumber: phoneNumber.trim(),
        course: course.trim(),
      });
      if (res.success) {
        onCreated(res.message || `Created ${email.trim()}`);
        onOpenChange(false);
      } else {
        setError(res.message || 'Failed to create user');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const selectedCustom = customRoles.find((r) => roleValue === `role:${r.id}`);
  const colorStyle = ROLE_COLORS[selectedCustom?.color || 'slate'] || ROLE_COLORS.slate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900">Create user</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Create a staff or student account and assign its role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Full name</Label>
            <Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@invertis.edu.in"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-phone">Phone (optional)</Label>
              <Input
                id="cu-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="10-digit number"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Temporary password</Label>
            <Input
              id="cu-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="font-mono"
            />
            <p className="text-xs text-slate-400">
              Share this with the user; they can change it after signing in.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleValue} onValueChange={setRoleValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILTIN_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
                {customRoles.length > 0 && (
                  <>
                    <div className="my-1 h-px bg-slate-100" />
                    {customRoles.map((r) => (
                      <SelectItem key={r.id} value={`role:${r.id}`}>
                        {r.label} · custom
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {selectedCustom ? (
              <div className="flex items-center gap-2 pt-1">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', colorStyle.badge)}>
                  {selectedCustom.label}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedCustom.permissions.length} permission
                  {selectedCustom.permissions.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : (
              <p className="pt-1 text-xs text-slate-400">
                Pick a built-in role, or choose a custom role to grant a specific permission set.
              </p>
            )}
          </div>

          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-600">
              Optional details
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cu-studentid">Student ID</Label>
                <Input
                  id="cu-studentid"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enrollment no."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-course">Course</Label>
                <Input
                  id="cu-course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech CSE"
                />
              </div>
            </div>
          </details>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}