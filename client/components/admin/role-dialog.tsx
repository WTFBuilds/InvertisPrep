'use client';

import { useEffect, useMemo, useState } from 'react';
import { rolesApi } from '@/lib/api';
import type { AdminRole } from '@/types';
import { ROLE_COLOR_KEYS, ROLE_COLORS, GRANTABLE_PERMISSION_KEYS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionPicker } from '@/components/admin/permission-picker';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing role to edit, or null to create a new one */
  role: AdminRole | null;
  onSaved: (role: AdminRole, created: boolean) => void;
}

/**
 * Create or edit a role: display name, optional slug, description, color and
 * the full permission set. For built-in roles (isSystem) the identity fields
 * are locked — only permissions are editable, because their names/colors drive
 * nav badges and their members keep the same enum role.
 */
export function RoleDialog({ open, onOpenChange, role, onSaved }: RoleDialogProps) {
  const isEdit = Boolean(role);
  const isSystem = Boolean(role?.isSystem);

  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (role) {
      setLabel(role.label);
      setSlug(role.name);
      setDescription(role.description || '');
      setColor(role.color || 'indigo');
      setPermissions(role.permissions || []);
    } else {
      setLabel('');
      setSlug('');
      setDescription('');
      setColor('indigo');
      // Sensible starter set for a brand-new role
      setPermissions(['dashboard.view']);
    }
    setSaving(false);
    setError(null);
  }, [open, role]);

  const autoSlug = useMemo(
    () =>
      label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40),
    [label]
  );

  const colorStyle = ROLE_COLORS[color] || ROLE_COLORS.indigo;

  const handleSave = async () => {
    setError(null);
    if (label.trim().length < 2) {
      setError('Role name must be at least 2 characters');
      return;
    }
    const cleanPerms = permissions.filter((p) => GRANTABLE_PERMISSION_KEYS.includes(p));

    setSaving(true);
    try {
      if (isEdit && role) {
        const res = await rolesApi.update(role.id, isSystem
          ? { permissions: cleanPerms }
          : {
              label: label.trim(),
              description: description.trim(),
              color,
              permissions: cleanPerms,
            });
        if (res.success && res.data) {
          onSaved(res.data, false);
          onOpenChange(false);
        } else {
          setError(res.message || 'Failed to update role');
        }
      } else {
        const res = await rolesApi.create({
          label: label.trim(),
          name: slug.trim() || autoSlug,
          description: description.trim(),
          color,
          permissions: cleanPerms,
        });
        if (res.success && res.data) {
          onSaved(res.data, true);
          onOpenChange(false);
        } else {
          setError(res.message || 'Failed to create role');
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorStyle.soft)}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900">
                {isEdit ? (isSystem ? `Edit ${role?.label} permissions` : 'Edit role') : 'Create a new role'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {isSystem
                  ? 'Built-in role — its name and colour are fixed. Choose exactly what it can access.'
                  : isEdit
                    ? 'Update the name, color and permissions for this role.'
                    : 'Name the role, pick a color and choose exactly what it can access.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid max-h-[62vh] gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1fr_1.4fr]">
          {/* Left: identity */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-label">Role name</Label>
              <Input
                id="role-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Content Team"
                maxLength={40}
                disabled={isSystem}
              />
              {isSystem && (
                <p className="text-xs text-slate-400">Built-in role names are fixed.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-slug">Slug {isEdit && <span className="text-xs font-normal text-slate-400">(fixed)</span>}</Label>
              <Input
                id="role-slug"
                value={isEdit ? slug : slug || autoSlug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="content-team"
                disabled={isEdit}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-400">
                Lowercase letters, numbers and dashes. Used internally.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this role for?"
                rows={2}
                maxLength={200}
                disabled={isSystem}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_COLOR_KEYS.map((key) => {
                  const style = ROLE_COLORS[key];
                  const active = color === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={style.label}
                      disabled={isSystem}
                      onClick={() => !isSystem && setColor(key)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full transition-transform',
                        active ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110',
                        isSystem && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <span className={cn('h-6 w-6 rounded-full', style.dot)} />
                    </button>
                  );
                })}
              </div>
              <div className="pt-1">
                <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', colorStyle.badge)}>
                  {label.trim() || 'Preview'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: permissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-xs font-semibold text-slate-400">
                {permissions.filter((p) => GRANTABLE_PERMISSION_KEYS.includes(p)).length} granted
              </span>
            </div>
            <PermissionPicker selected={permissions} onChange={setPermissions} disabled={saving} />
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}