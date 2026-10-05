'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MultiSelect } from '@/components/admin/multi-select';
import { pyqApi, departmentApi, sessionApi } from '@/lib/api';
import type { Department, Branch, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ChevronDown, FileText, Loader2, Tag, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';

const inputClasses =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50';

const fieldClasses =
  'h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={onChange} disabled={disabled} className={fieldClasses}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export default function UploadPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  // Multi-branch tags: other branches (same department) this paper also
  // applies to, so it shows up when students filter by any of them.
  const [selectedAdditionalBranches, setSelectedAdditionalBranches] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    departmentId: '',
    branchId: '',
    sessionId: '',
    semester: '',
    subjectName: '',
    subjectCode: '',
    examType: '',
    year: new Date().getFullYear(),
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes] = await Promise.all([
          departmentApi.getAll(),
          sessionApi.getAll(),
        ]);
        setDepartments(deptRes.data || []);
        setSessions(sessRes.data || []);
      } catch (err: unknown) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      if (formData.departmentId) {
        try {
          const response = await departmentApi.getBranches(formData.departmentId);
          const branchData = response.data || [];
          setBranches(branchData);
          setFilteredBranches(branchData);
          setFormData((prev) => ({ ...prev, branchId: '', semester: '' }));
          setSelectedSemesters([]);
          setSelectedAdditionalBranches([]);
        } catch (err: unknown) {
          setError('Failed to load branches');
        }
      } else {
        setBranches([]);
        setFilteredBranches([]);
        setSelectedSemesters([]);
        setSelectedAdditionalBranches([]);
      }
    };
    fetchBranches();
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.branchId) {
      const branch = branches.find((b) => b._id === formData.branchId);
      if (branch) {
        setSelectedSemesters(branch.semesters);
        setFormData((prev) => ({ ...prev, semester: '' }));
      }
    } else {
      setSelectedSemesters([]);
    }
  }, [formData.branchId, branches]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('pdf', file);
      uploadData.append('departmentId', formData.departmentId);
      uploadData.append('branchId', formData.branchId);
      // Other branches this paper should also be visible under (excluding the
      // primary branch itself).
      const additionalBranchIds = selectedAdditionalBranches.filter(
        (id) => id !== formData.branchId
      );
      if (additionalBranchIds.length > 0) {
        uploadData.append('additionalBranchIds', JSON.stringify(additionalBranchIds));
      }
      uploadData.append('sessionId', formData.sessionId);
      uploadData.append('semester', formData.semester);
      uploadData.append('subjectName', formData.subjectName);
      uploadData.append('subjectCode', formData.subjectCode);
      uploadData.append('examType', formData.examType);
      uploadData.append('year', formData.year.toString());

      await pyqApi.upload(uploadData);

      setSuccess('PYQ uploaded successfully!');
      setFormData({
        departmentId: '',
        branchId: '',
        sessionId: '',
        semester: '',
        subjectName: '',
        subjectCode: '',
        examType: '',
        year: new Date().getFullYear(),
      });
      setFile(null);
      setSelectedAdditionalBranches([]);
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PYQ';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const additionalOptions = filteredBranches
    .filter((b) => b._id !== formData.branchId)
    .map((b) => ({ value: b._id, label: b.name }));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-3xl p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                Upload PYQ Paper
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Publish a paper to every branch it belongs to, in one upload.
              </p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline" className="shadow-sm">← Back to Dashboard</Button>
            </Link>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 border-rose-200 shadow-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4"
              >
                <Alert className="border-emerald-200 bg-emerald-50 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="font-medium text-emerald-800">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
            <CardHeader className="border-b border-slate-100 pb-5">
              <CardTitle>New paper</CardTitle>
              <CardDescription>
                Fields marked <span className="font-semibold text-rose-500">*</span> are required.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Classification */}
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-black text-indigo-600">1</span>
                    Classification
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Department" required>
                      <SelectField
                        id="departmentId"
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        disabled={loading}
                        placeholder="Select department"
                      >
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.icon} {dept.displayName}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <Field label="Primary branch" required>
                      <SelectField
                        id="branchId"
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        disabled={!formData.departmentId || filteredBranches.length === 0}
                        placeholder={formData.departmentId ? 'Select branch' : 'Pick a department first'}
                      >
                        {filteredBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                  </div>

                  {/* Additional branches — animated multi-select */}
                  {formData.branchId && additionalOptions.length > 0 && (
                    <Field
                      label="Additional branches"
                      hint="The paper appears under every branch ticked here — students filtering by any selected branch will find it."
                    >
                      <MultiSelect
                        options={additionalOptions}
                        selected={selectedAdditionalBranches}
                        onChange={setSelectedAdditionalBranches}
                        placeholder="Also applicable to (optional)"
                        searchPlaceholder="Search branches..."
                        emptyMessage="No other branches in this department"
                      />
                    </Field>
                  )}
                </section>

                {/* 2. Exam details */}
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-black text-indigo-600">2</span>
                    Exam details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Session" required>
                      <SelectField
                        id="sessionId"
                        value={formData.sessionId}
                        onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                        placeholder="Select session"
                      >
                        {sessions.map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.name}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <Field label="Semester" required>
                      <SelectField
                        id="semester"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        disabled={selectedSemesters.length === 0}
                        placeholder={selectedSemesters.length ? 'Select semester' : 'Pick a branch first'}
                      >
                        {selectedSemesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <Field label="Exam type" required>
                      <SelectField
                        id="examType"
                        value={formData.examType}
                        onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                        placeholder="Select exam type"
                      >
                        <option value="mid-term">Mid-Term</option>
                        <option value="end-term">End-Term</option>
                      </SelectField>
                    </Field>
                    <Field label="Exam year" required>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({ ...formData, year: parseInt(e.target.value) })
                        }
                        min="2000"
                        max="2100"
                        className="h-10 border-slate-200 focus-visible:ring-indigo-100"
                        required
                      />
                    </Field>
                  </div>
                </section>

                {/* 3. Subject */}
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-black text-indigo-600">3</span>
                    Subject
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Subject name" required>
                      <Input
                        id="subjectName"
                        value={formData.subjectName}
                        onChange={(e) =>
                          setFormData({ ...formData, subjectName: e.target.value })
                        }
                        placeholder="e.g., Data Structures"
                        className="h-10 border-slate-200 focus-visible:ring-indigo-100"
                        required
                      />
                    </Field>
                    <Field label="Subject code" required>
                      <Input
                        id="subjectCode"
                        value={formData.subjectCode}
                        onChange={(e) =>
                          setFormData({ ...formData, subjectCode: e.target.value })
                        }
                        placeholder="e.g., CS201"
                        className="h-10 border-slate-200 focus-visible:ring-indigo-100"
                        required
                      />
                    </Field>
                  </div>
                </section>

                {/* 4. File */}
                <section className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-black text-indigo-600">4</span>
                    Paper file
                  </h3>
                  <label
                    htmlFor="file"
                    className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition-transform duration-200 group-hover:scale-110">
                      <UploadCloud className="h-6 w-6 text-indigo-500" />
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      Click to upload the PDF
                    </span>
                    <span className="text-xs text-slate-400">PDF only, up to 10MB</span>
                    <input
                      id="file"
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                  <AnimatePresence>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-indigo-100">
                          <FileText className="h-4.5 w-4.5 text-indigo-600" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove file"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            const fileInput = document.getElementById('file') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Submit */}
                <div className="border-t border-slate-100 pt-6">
                  <Button
                    type="submit"
                    disabled={uploading || loading}
                    className="h-12 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:opacity-95 hover:shadow-indigo-300"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading paper...
                      </>
                    ) : (
                      <>
                        <Tag className="mr-2 h-4 w-4" />
                        Upload to {selectedAdditionalBranches.length + 1}{' '}
                        branch{selectedAdditionalBranches.length > 0 ? 'es' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
