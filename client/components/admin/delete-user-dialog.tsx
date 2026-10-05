'use client';

import { useEffect, useState } from 'react';
import { adminUserApi } from '@/lib/api';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteUserDialogProps {
  user: { id: string; name: string; email: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion so the list can refresh. */
  onDeleted?: (message: string) => void;
}

/**
 * Permanent account deletion, gated behind typing the user's exact email.
 * Super-admin only (enforced by the caller and again by the API).
 */
export function DeleteUserDialog({ user, open, onOpenChange, onDeleted }: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setDeleting(false);
      setError(null);
    }
  }, [open]);

  const confirmed = user !== null && confirmText.trim().toLowerCase() === user.email.toLowerCase();

  const handleDelete = async () => {
    if (!user || !confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await adminUserApi.remove(user.id);
      if (res.success) {
        onOpenChange(false);
        onDeleted?.(res.message || 'User deleted');
      } else {
        setError(res.message || 'Failed to delete user');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            Delete this user permanently?
          </DialogTitle>
          <DialogDescription>
            This removes <span className="font-semibold text-slate-700">{user?.name}</span>{' '}
            (<span className="font-semibold text-slate-700">{user?.email}</span>), their reports,
            bug submissions and points history. Papers they uploaded are kept.{' '}
            <span className="font-semibold text-rose-600">This cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Type <span className="font-mono text-rose-600">{user?.email}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user?.email}
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={!confirmed || deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete permanently'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
