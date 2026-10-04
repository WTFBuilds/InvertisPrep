'use client';

import { useEffect, useState } from 'react';
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
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

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
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Checking authorization...</p>
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
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar with back button */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/pyq')} 
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to PYQs
          </Button>

          <div className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-100 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            {isExempt 
              ? 'Daily Upload Limit: Unlimited' 
              : `Daily Uploads: ${uploadCount !== null ? uploadCount : 0}/${uploadLimit} papers`
            }
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Upload PYQ Paper
          </h1>
          <p className="text-gray-600 mt-2">
            Contribute to the student community by sharing previous year question papers.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription className="font-medium mt-1">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="shadow-lg bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 font-bold">Upload Received</AlertTitle>
            <AlertDescription className="text-green-700 font-semibold mt-1">{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Card */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Paper details</CardTitle>
            <CardDescription>All fields marked with an asterisk (*) are mandatory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Department & Branch grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentId" className="text-sm font-semibold text-gray-700">Department *</Label>
                  <select
                    id="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full h-11 border border-gray-200 rounded-lg px-3 py-2 bg-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 text-sm font-medium transition-all"
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchId" className="text-sm font-semibold text-gray-700">Branch *</Label>
                  <select
                    id="branchId"
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full h-11 border border-gray-200 rounded-lg px-3 py-2 bg-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.departmentId || filteredBranches.length === 0}
                  >
                    <option value="">Select Branch</option>
                    {filteredBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional branches — the paper will also be visible under these filters */}
              {formData.branchId && filteredBranches.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Also applicable to (optional)
                  </Label>
                  <p className="text-xs text-gray-500">
                    Tick every other branch this paper applies to — it will show up when students
                    filter by any selected branch.
                  </p>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-white/80">
                    {filteredBranches
                      .filter((branch) => branch._id !== formData.branchId)
                      .map((branch) => {
                        const checked = selectedAdditionalBranches.includes(branch._id);
                        return (
                          <label
                            key={branch._id}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                              checked
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-indigo-600"
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
                <div className="space-y-2">
                  <Label htmlFor="sessionId" className="text-sm font-semibold text-gray-700">Session *</Label>
                  <select
                    id="sessionId"
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    className="w-full h-11 border border-gray-200 rounded-lg px-3 py-2 bg-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 text-sm font-medium transition-all"
                    required
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session._id} value={session._id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-sm font-semibold text-gray-700">Semester *</Label>
                  <select
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full h-11 border border-gray-200 rounded-lg px-3 py-2 bg-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={selectedSemesters.length === 0}
                  >
                    <option value="">Select Semester</option>
                    {selectedSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Name & Subject Code grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName" className="text-sm font-semibold text-gray-700">Subject Name *</Label>
                  <Input
                    id="subjectName"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g., Operating Systems"
                    className="h-11 border-gray-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectCode" className="text-sm font-semibold text-gray-700">Subject Code (Optional)</Label>
                  <Input
                    id="subjectCode"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    placeholder="e.g., CS-402"
                    className="h-11 border-gray-200"
                  />
                </div>
              </div>

              {/* Exam Type & Year grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="examType" className="text-sm font-semibold text-gray-700">Exam Type *</Label>
                  <select
                    id="examType"
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="w-full h-11 border border-gray-200 rounded-lg px-3 py-2 bg-white/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 text-sm font-medium transition-all"
                    required
                  >
                    <option value="">Select Exam Type</option>
                    <option value="mid-term">Mid-Term</option>
                    <option value="end-term">End-Term</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-semibold text-gray-700">Exam Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    min="2000"
                    max="2100"
                    className="h-11 border-gray-200"
                    required
                  />
                </div>
              </div>

              {/* PDF File upload zone */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-semibold text-gray-700">PDF File * (Max 10MB)</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors bg-white/50">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer bg-transparent rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                      >
                        <span>Choose a file</span>
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
                    <p className="text-xs text-gray-500">PDF only up to 10MB</p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg mt-2 text-indigo-800">
                    <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold truncate">{file.name}</p>
                      <p className="text-xs text-indigo-600/80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={uploading} 
                className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-md hover:opacity-95 transition-opacity mt-4 flex items-center justify-center"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 flex gap-3 text-sm text-yellow-800/90 shadow-sm">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Why is my paper not visible immediately?</p>
            <p className="mt-1">
              To maintain high quality and prevent spam, all user-uploaded question papers are verified by university faculty/administrators before they are made public.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
