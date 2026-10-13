'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { pyqApi, departmentApi, sessionApi } from '@/lib/api';
import type { Department, Branch, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  UploadCloud, 
  FileText, 
  ArrowLeft, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Loader2
} from 'lucide-react';

const selectClasses =
  'h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';

const inputClasses =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60';

export default function StudentUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  // Multi-branch tags: other branches (within the same department) this paper
  // also applies to, so it shows up when filtering by any of them.
  const [selectedAdditionalBranches, setSelectedAdditionalBranches] = useState<string[]>([]);
  
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submittingRef = useRef(false);
  
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
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const [uploadLimit, setUploadLimit] = useState<number>(10);
  const [isExempt, setIsExempt] = useState(false);

  const fetchUploadCount = async () => {
    try {
      const res = await pyqApi.getDailyUploadCount();
      if (res.success && res.data) {
        setUploadCount(res.data.count);
        setUploadLimit(res.data.limit || 10);
        setIsExempt(res.data.isExempt);
      }
    } catch (err) {
      console.error('Failed to load upload count:', err);
    }
  };

  // Auth Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch initial select options and user upload count
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [deptRes, sessRes] = await Promise.all([
          departmentApi.getAll(),
          sessionApi.getAll(),
        ]);
        setDepartments(deptRes.data || []);
        setSessions(sessRes.data || []);
        await fetchUploadCount();
      } catch (err: unknown) {
        setError('Failed to load department and session options.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Fetch branches on department selection
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
          setError('Failed to load branches.');
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

  // Set semesters on branch selection
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

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">Checking authorization...</p>
        </div>
      </div>
    );
  }

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
    if (submittingRef.current || uploading) return;
    submittingRef.current = true;

    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a PDF file');
      submittingRef.current = false;
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

      const res = await pyqApi.uploadPublic(uploadData);
      
      if (res.success) {
        setSuccess('Your PYQ paper has been uploaded successfully! It is pending admin verification and will be visible publicly once approved.');
        fetchUploadCount();
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
      } else {
        setError(res.message || 'Failed to upload paper');
      }
    } catch (err: unknown) {
      const axiosError = err as any;
      const errorMessage = axiosError.response?.data?.message || 'An error occurred during file upload.';
      setError(errorMessage);
    } finally {
      setUploading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar with back button */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/pyq')} 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to PYQs
          </Button>

          <div className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded-full font-semibold border border-slate-200 shadow-sm flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            {isExempt 
              ? 'Daily Upload Limit: Unlimited' 
              : `Daily Uploads: ${uploadCount !== null ? uploadCount : 0}/${uploadLimit} papers`
            }
          </div>
        </div>

        {/* Header Text */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Upload PYQ Paper
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Contribute to the student community by sharing previous year question papers.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-900">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <AlertTitle className="font-semibold">Upload Failed</AlertTitle>
            <AlertDescription className="text-xs mt-0.5">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="font-semibold">Upload Received</AlertTitle>
            <AlertDescription className="text-xs mt-0.5">{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Card */}
        <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <CardTitle className="text-lg font-bold text-slate-900">Paper details</CardTitle>
            <CardDescription className="text-xs text-slate-500">All fields marked with an asterisk (*) are mandatory</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Department & Branch grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Department *
                  </Label>
                  <div className="relative">
                    <select
                      id="departmentId"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className={selectClasses}
                      required
                      disabled={dataLoading}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.displayName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="branchId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Branch *
                  </Label>
                  <div className="relative">
                    <select
                      id="branchId"
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className={selectClasses}
                      required
                      disabled={!formData.departmentId || filteredBranches.length === 0}
                    >
                      <option value="">
                        {!formData.departmentId ? 'Select department first' : 'Select Branch'}
                      </option>
                      {filteredBranches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Additional branches — the paper will also be visible under these filters */}
              {formData.branchId && filteredBranches.length > 1 && (
                <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Also applicable to other branches (optional)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Select every other branch this paper applies to — it will show up when students filter by any selected branch.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {filteredBranches
                      .filter((branch) => branch._id !== formData.branchId)
                      .map((branch) => {
                        const checked = selectedAdditionalBranches.includes(branch._id);
                        return (
                          <label
                            key={branch._id}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              checked
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedAdditionalBranches((prev) =>
                                  e.target.checked
                                    ? [...prev, branch._id]
                                    : prev.filter((id) => id !== branch._id)
                                )
                              }
                            />
                            {branch.name}
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Session & Semester grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Session *
                  </Label>
                  <div className="relative">
                    <select
                      id="sessionId"
                      value={formData.sessionId}
                      onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                      className={selectClasses}
                      required
                    >
                      <option value="">Select Session</option>
                      {sessions.map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="semester" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Semester *
                  </Label>
                  <div className="relative">
                    <select
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className={selectClasses}
                      required
                      disabled={selectedSemesters.length === 0}
                    >
                      <option value="">
                        {selectedSemesters.length === 0 ? 'Select branch first' : 'Select Semester'}
                      </option>
                      {selectedSemesters.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Subject Name & Subject Code grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject Name *
                  </Label>
                  <Input
                    id="subjectName"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g., Operating Systems"
                    className={inputClasses}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subjectCode" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject Code (Optional)
                  </Label>
                  <Input
                    id="subjectCode"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    placeholder="e.g., CS-402"
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Exam Type & Year grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examType" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Exam Type *
                  </Label>
                  <div className="relative">
                    <select
                      id="examType"
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                      className={selectClasses}
                      required
                    >
                      <option value="">Select Exam Type</option>
                      <option value="mid-term">Mid-Term</option>
                      <option value="end-term">End-Term</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="year" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Exam Year *
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                    min="2000"
                    max="2100"
                    className={inputClasses}
                    required
                  />
                </div>
              </div>

              {/* PDF File upload zone */}
              <div>
                <Label htmlFor="file" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  PDF File * (Max 10MB)
                </Label>
                <div className="mt-1 flex justify-center px-6 pt-6 pb-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-400 transition-colors bg-slate-50/50">
                  <div className="space-y-1.5 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer bg-transparent rounded-md font-semibold text-slate-900 hover:text-indigo-600 focus-within:outline-none transition-colors"
                      >
                        <span>Choose a PDF file</span>
                        <input
                          id="file"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-400">PDF documents only, up to 10MB</p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2 text-slate-800">
                    <FileText className="h-5 w-5 text-slate-600 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={uploading} 
                className="w-full h-11 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition-colors mt-2 flex items-center justify-center disabled:opacity-60"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Uploading your paper...</span>
                  </div>
                ) : (
                  <span>Upload PYQ Paper</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Note */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900 shadow-sm">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Why is my paper not visible immediately?</p>
            <p className="mt-0.5">
              To maintain high quality and prevent spam, all user-uploaded question papers are verified by university administrators before they are made public.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
