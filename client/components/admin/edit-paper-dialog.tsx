'use client';

import { useEffect, useState } from 'react';
import { departmentApi, pyqApi } from '@/lib/api';
import type { Branch, ExamType, PYQPaper } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/admin/multi-select';
import { FileEdit, Loader2 } from 'lucide-react';

interface EditPaperDialogProps {
  /** The paper being edited, or null when the dialog is closed. */
  paper: PYQPaper | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful save so the parent can refresh its list. */
  onSaved: (message: string) => void;
}

type FormState = {
  subjectName: string;
  subjectCode: string;
  year: string;
  examType: string;
  semester: string;
};

const emptyForm: FormState = {
  subjectName: '',
  subjectCode: '',
  year: '',
  examType: '',
  semester: '',
};

export function EditPaperDialog({ paper, open, onOpenChange, onSaved }: EditPaperDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState('');
  const [additionalBranchIds, setAdditionalBranchIds] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Seed the form whenever a new paper is opened.
  useEffect(() => {
    if (!open || !paper) return;

    setError('');
    setForm({
      subjectName: paper.subjectName,
      subjectCode: paper.subjectCode || '',
      year: paper.year.toString(),
      examType: paper.examType,
      semester: paper.semester.toString(),
    });

    // Normalize current extra-branch tags (raw ids or populated Branch docs).
    const currentIds = (paper.additionalBranchIds || [])
      .map((entry) => (typeof entry === 'string' ? entry : entry?._id))
      .filter((id): id is string => Boolean(id));
    setAdditionalBranchIds(currentIds);

    const primaryId = typeof paper.branchId === 'string' ? paper.branchId : paper.branchId?._id;
    setPrimaryBranchId(primaryId || '');

    // Load the department's branches so the editor can show real names.
    const departmentId =
      typeof paper.departmentId === 'string' ? paper.departmentId : paper.departmentId?._id;
    setBranches([]);
    if (!departmentId) return;

    let cancelled = false;
    setBranchesLoading(true);
    departmentApi
      .getBranches(departmentId)
      .then((res) => {
        if (!cancelled) setBranches(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load branches for editing');
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, paper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paper) return;

    if (!form.subjectName.trim()) return setError('Subject name is required');
    const year = parseInt(form.year, 10);
    const semester = parseInt(form.semester, 10);
    if (Number.isNaN(year)) return setError('Enter a valid year');
    if (Number.isNaN(semester)) return setError('Enter a valid semester');

    setSaving(true);
    setError('');
    try {
      const updateData: Partial<PYQPaper> = {
        subjectName: form.subjectName.trim(),
        subjectCode: form.subjectCode.trim(),
        year,
        examType: form.examType as ExamType,
        semester,
        // Always send so unticking every branch clears the tags.
        additionalBranchIds: additionalBranchIds.filter((id) => id !== primaryBranchId),
      };
      const res = await pyqApi.update(paper._id, updateData);
      if (res.success === false) {
        setError(res.message || 'Failed to update paper');
        return;
      }
      onSaved('Paper updated successfully');
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to update paper');
    } finally {
      setSaving(false);
    }
  };

  const additionalOptions = branches.filter((b) => b._id !== primaryBranchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900">Edit paper</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Update the subject details and branch tags for this paper.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ep-subject">Subject name</Label>
              <Input
                id="ep-subject"
                value={form.subjectName}
                onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                placeholder="e.g. Data Structures"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-code">Subject code</Label>
              <Input
                id="ep-code"
                value={form.subjectCode}
                onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-year">Year</Label>
              <Input
                id="ep-year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Exam type</Label>
              <Select
                value={form.examType}
                onValueChange={(v) => setForm({ ...form, examType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid-term">Mid-Term</SelectItem>
                  <SelectItem value="end-term">End-Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-semester">Semester</Label>
              <Input
                id="ep-semester"
                type="number"
                min="1"
                max="10"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                required
              />
            </div>
          </div>

          {additionalOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Additional branches (optional)</Label>
              <p className="text-xs text-slate-400">
                Tick every branch this paper also applies to — it will show up when students filter
                by any selected branch.
              </p>
              {branchesLoading ? (
                <p className="text-sm text-slate-400">Loading branches...</p>
              ) : (
                <MultiSelect
                  options={additionalOptions.map((b) => ({ value: b._id, label: b.name }))}
                  selected={additionalBranchIds}
                  onChange={setAdditionalBranchIds}
                  placeholder="Select additional branches"
                  searchPlaceholder="Search branches..."
                  emptyMessage="No other branches in this department"
                />
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}