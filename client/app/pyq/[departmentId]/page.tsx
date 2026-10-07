'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { pyqApi, sessionApi, reportApi, departmentApi, paperRequestApi } from '@/lib/api';
import type { PYQPaper, Department, Branch, Session, APIResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Flag, X, Loader2, Eye, Search, FilterX, ArrowLeft, BookOpen, FileQuestion, Send } from 'lucide-react';

export default function DepartmentPYQPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.departmentId as string;

  // URL carries the department slug (e.g. "btech"). Resolve it to the full
  // department first — papers and branches are keyed by the department's
  // ObjectId in the DB, so those queries wait for the resolved _id.
  const { data: deptRes, error: deptError } = useSWR<APIResponse<Department>>(
    `/departments/${departmentId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const department = deptRes?.data || null;
  const deptObjectId = department?._id;

  const { data: branchesRes, error: branchesError } = useSWR<APIResponse<Branch[]>>(
    deptObjectId ? `/departments/${deptObjectId}/branches` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  // Papers live on the PDF service — use pyqApi (not the main-server fetcher,
  // whose /api/pyq route was removed during the microservice migration)
  const { data: papersRes, error: papersError } = useSWR<APIResponse<PYQPaper[]>>(
    deptObjectId ? ['pyq-papers', deptObjectId] : null,
    () => pyqApi.getFiltered({ departmentId: deptObjectId! }),
    { revalidateOnFocus: false }
  );
  const { data: sessionsRes, error: sessionsError } = useSWR<APIResponse<Session[]>>(
    '/sessions',
    fetcher,
    { revalidateOnFocus: false }
  );

  const branches = branchesRes?.data || [];
  const papers = papersRes?.data || [];
  const sessions = sessionsRes?.data || [];
  const loading = (!deptRes && !deptError) || (!branchesRes && !branchesError) || (!papersRes && !papersError);
  const error = deptError || branchesError || papersError || sessionsError;

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [searchSubject, setSearchSubject] = useState('');

  // Client-side filtering (instant, no API call)
  const filteredPapers = useMemo(() => {
    let filtered = [...papers];

    if (selectedBranch) {
      filtered = filtered.filter((p) => {
        const branchId = typeof p.branchId === 'string' ? p.branchId : p.branchId._id;
        // Multi-branch uploads: a paper is visible under any branch it was
        // tagged with at upload time (primary or additional).
        if (branchId === selectedBranch) return true;
        return (p.additionalBranchIds || []).includes(selectedBranch);
      });
    }
    if (selectedSession) {
      filtered = filtered.filter((p) => {
        const sessionId = typeof p.sessionId === 'string' ? p.sessionId : p.sessionId._id;
        return sessionId === selectedSession;
      });
    }
    if (selectedSemester) {
      filtered = filtered.filter((p) => p.semester === parseInt(selectedSemester));
    }
    if (selectedExamType) {
      filtered = filtered.filter((p) => p.examType === selectedExamType);
    }
    if (searchSubject) {
      const query = searchSubject.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.subjectName.toLowerCase().includes(query) ||
          p.subjectCode?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedBranch, selectedSession, selectedSemester, selectedExamType, searchSubject, papers]);

  const { user } = useAuth();

  // "Can't find a paper?" request modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDepartments, setRequestDepartments] = useState<Department[]>([]);
  const [requestBranches, setRequestBranches] = useState<Branch[]>([]);
  const [requestForm, setRequestForm] = useState({
    departmentId: '',
    branchId: '',
    subjectName: '',
    subjectCode: '',
    examType: 'any',
    year: '',
    note: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Load picker data whenever the request modal opens (department preselected
  // to the page the student is already browsing).
  useEffect(() => {
    if (!isRequestModalOpen) return;
    let cancelled = false;
    const load = async () => {
      setRequestError('');
      setRequestSuccess('');
      setRequestBranches([]);
      try {
        const deptRes = await departmentApi.getAll();
        const departments = deptRes.data || [];
        if (cancelled) return;
        setRequestDepartments(departments);
        const preselect = deptObjectId || departments[0]?._id || '';
        setRequestForm((f) => ({ ...f, departmentId: preselect, branchId: '' }));
      } catch (err: unknown) {
        if (!cancelled) setRequestError('Failed to load departments.');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequestModalOpen]);

  // Branch options follow the department chosen inside the modal.
  useEffect(() => {
    if (!isRequestModalOpen || !requestForm.departmentId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await departmentApi.getBranches(requestForm.departmentId);
        if (!cancelled) setRequestBranches(res.data || []);
      } catch (err: unknown) {
        if (!cancelled) setRequestBranches([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isRequestModalOpen, requestForm.departmentId]);

  const handleOpenRequestModal = () => {
    if (!user) {
      router.push(`/login?returnUrl=/pyq/${departmentId}`);
      return;
    }
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');

    if (!requestForm.departmentId || !requestForm.branchId || !requestForm.subjectName.trim()) {
      setRequestError('Department, branch and subject name are required.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await paperRequestApi.create({
        departmentId: requestForm.departmentId,
        branchId: requestForm.branchId,
        subjectName: requestForm.subjectName.trim(),
        subjectCode: requestForm.subjectCode.trim() || undefined,
        examType: requestForm.examType as 'any' | 'mid-term' | 'end-term',
        year: requestForm.year ? parseInt(requestForm.year) : undefined,
        note: requestForm.note.trim() || undefined,
      });

      if (res.success) {
        setRequestSuccess(
          res.message || 'Request submitted! Our team will look for this paper.'
        );
        // Close after a beat so the student sees the confirmation.
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setRequestForm((f) => ({
            ...f,
            branchId: '',
            subjectName: '',
            subjectCode: '',
            examType: 'any',
            year: '',
            note: '',
          }));
        }, 1800);
      } else {
        setRequestError(res.message || 'Failed to submit request.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while submitting the request.';
      setRequestError(errorMessage);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Report states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPaperToReport, setSelectedPaperToReport] = useState<PYQPaper | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const handleReportClick = (paper: PYQPaper) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedPaperToReport(paper);
    setReportReason('');
    setReportDescription('');
    setReportError('');
    setReportSuccess('');
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperToReport || !reportReason) return;

    setSubmittingReport(true);
    setReportError('');
    setReportSuccess('');

    try {
      const res = await reportApi.create({
        paperId: selectedPaperToReport._id,
        reason: reportReason,
        description: reportDescription,
      });

      if (res.success) {
        setReportSuccess('Thank you! The paper has been reported. Admins will review it shortly.');
      } else {
        setReportError(res.message || 'Failed to submit report.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while submitting the report.';
      setReportError(errorMessage);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDownload = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackDownload(paper._id);
      router.push(`/view/${paper._id}?type=pyq`);
    } catch (err: unknown) {
      alert('Download failed. Please try again.');
    }
  };

  const handleView = async (paper: PYQPaper) => { 
    try {
      await pyqApi.trackView(paper._id);
      router.push(`/view/${paper._id}?type=pyq`);
    } catch (err: unknown) {
      alert('View failed. Please try again.');
    }
  };

  const getPaperBranchNames = (paper: PYQPaper): string[] => {
    const names: string[] = [];
    if (typeof paper.branchId === 'string') {
      const branch = branches.find((b) => b._id === paper.branchId);
      if (branch) names.push(branch.name);
    } else {
      names.push(paper.branchId.name);
    }
    // Additional branches from multi-branch uploads — resolve names against
    // the department's branches list already loaded for the filter dropdown.
    for (const id of paper.additionalBranchIds || []) {
      const branch = branches.find((b) => b._id === id);
      if (branch && !names.includes(branch.name)) names.push(branch.name);
    }
    return names.length > 0 ? names : ['N/A'];
  };

  const getSessionName = (paper: PYQPaper) => {
    if (typeof paper.sessionId === 'string') return 'N/A';
    return (paper.sessionId as Session).name;
  };

  const getUploadedByName = (paper: PYQPaper) => {
    if (!paper.uploadedBy) return 'System';
    if (typeof paper.uploadedBy === 'string') return 'User';
    return paper.uploadedBy.name || 'User';
  };

  const getUploadedByPicture = (paper: PYQPaper) => {
    if (paper.uploadedBy && typeof paper.uploadedBy !== 'string') {
      return (paper.uploadedBy as any).picture;
    }
    return undefined;
  };

  const getUploadedById = (paper: PYQPaper) => {
    if (paper.uploadedBy && typeof paper.uploadedBy !== 'string') {
      return (paper.uploadedBy as any).id || (paper.uploadedBy as any)._id;
    }
    return undefined;
  };

  const clearFilters = () => {
    setSelectedBranch('');
    setSelectedSession('');
    setSelectedSemester('');
    setSelectedExamType('');
    setSearchSubject('');
  };

  const hasActiveFilters = Boolean(
    selectedBranch || selectedSession || selectedSemester || selectedExamType || searchSubject
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f3f4f6_100%)]">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/pyq" className="inline-flex">
            <Button variant="ghost" className="mb-5 -ml-2 text-slate-600 hover:bg-white/80 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to departments
            </Button>
          </Link>

          {department && (
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-4xl ring-1 ring-indigo-100">
                  {department.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Previous year questions</p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
                    {department.displayName}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    {department.name}. Browse, filter, and open PYQ papers with a cleaner layout built for quick scanning on any device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>Failed to load data. Please try again.</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <BookOpen className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Loading papers</p>
                <p className="text-sm text-slate-500">Fetching the latest PYQ list and filters...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card className="mb-6 overflow-hidden border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Filter papers</CardTitle>
                    <CardDescription className="mt-1 text-slate-500">
                      Narrow results by branch, session, semester, exam type, or subject.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Session</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">All Sessions</option>
                      {sessions.map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Exam Type</label>
                    <select
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">All Types</option>
                      <option value="mid-term">Mid-Term</option>
                      <option value="end-term">End-Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Search Subject</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchSubject}
                        onChange={(e) => setSearchSubject(e.target.value)}
                        placeholder="Subject name or code"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {hasActiveFilters ? 'Filters are active. Clear them to see the full list.' : 'No filters applied.'}
                  </p>
                  <Button variant="outline" onClick={clearFilters} size="sm" className="sm:self-start">
                    <FilterX className="h-4 w-4" />
                    Clear filters
                  </Button>
                </div>

                {/* Can't find a paper? — request CTA */}
                <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Can&apos;t find the paper you need?</span>{' '}
                    Tell us which one is missing — our team will upload it for you.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenRequestModal}
                    className="shrink-0 gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:opacity-95 sm:self-start"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Request here
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Papers List */}
            {filteredPapers.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white/70 shadow-sm">
                <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">No papers found</p>
                  <p className="max-w-md text-sm text-slate-500">
                    Try changing your filters or search term to reveal matching papers.
                  </p>
                  {papers.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="mt-3">
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredPapers.map((paper) => (
                  <Card
                    key={paper._id}
                    className="group h-full overflow-hidden border-slate-200/70 bg-white py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg md:py-4.5"
                  >
                    <CardHeader className="border-b border-slate-100  px-4 md:px-5">
                      <div className="space-y-1">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-base font-bold tracking-tight text-slate-900 md:text-lg">
                            {paper.subjectName}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 text-xs text-slate-500 md:text-sm">
                            <span>{paper.subjectCode || 'N/A'}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{paper.examType.toUpperCase()}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>Year {paper.year}</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {getPaperBranchNames(paper).map((branchName) => (
                            <span
                              key={branchName}
                              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100"
                            >
                              {branchName}
                            </span>
                          ))}
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                            Semester {paper.semester}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4  md:px-5">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                        <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Session</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{getSessionName(paper)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Downloads / Views</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {paper.downloads || 0} / {paper.views || 0}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5 sm:col-span-2 ring-1 ring-slate-100">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Uploaded By</p>
                          {getUploadedById(paper) ? (
                            <Link
                              href={`/profile/${getUploadedById(paper)}`}
                              className="mt-1 flex items-center gap-2 font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                            >
                              <Avatar className="h-6 w-6 flex-shrink-0 border border-indigo-100">
                                {getUploadedByPicture(paper) ? (
                                  <AvatarImage src={getUploadedByPicture(paper)} alt={getUploadedByName(paper)} />
                                ) : null}
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                                  {getUploadedByName(paper).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate" title={getUploadedByName(paper)}>
                                {getUploadedByName(paper)}
                              </span>
                            </Link>
                          ) : (
                            <div className="mt-1 flex items-center gap-2 font-medium text-slate-600">
                              <Avatar className="h-6 w-6 flex-shrink-0 border border-slate-200">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                                  S
                                </AvatarFallback>
                              </Avatar>
                              <span>{getUploadedByName(paper)}</span>
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <div className="mt-1 flex items-center justify-center gap-2 border-t border-slate-100 pt-3">
                            <Button
                              className="h-9 min-w-[112px] bg-slate-900 px-3 text-sm text-white shadow-sm hover:bg-slate-800"
                              onClick={() => handleView(paper)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View paper
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-9 min-w-[112px] px-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleReportClick(paper)}
                            >
                              <Flag className="h-3.5 w-3.5" />
                              Report issue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Modal */}
      {isReportModalOpen && selectedPaperToReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
            <CardHeader className="relative border-b border-slate-100 pb-5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
                onClick={() => setIsReportModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <Flag className="h-5 w-5" />
                Report PYQ Paper
              </CardTitle>
              <CardDescription className="text-slate-500">
                Help us maintain quality. Report issues with <strong>{selectedPaperToReport.subjectName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {reportError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{reportError}</AlertDescription>
                </Alert>
              )}
              {reportSuccess ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-600">
                    ✓
                  </div>
                  <p className="font-semibold text-green-800">{reportSuccess}</p>
                  <Button className="w-full" onClick={() => {
                    setIsReportModalOpen(false);
                    setReportSuccess('');
                  }}>
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Reason for Reporting *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="wrong_file">Wrong File (Not the actual PYQ)</option>
                      <option value="poor_quality">Poor Quality / Unreadable Scan</option>
                      <option value="wrong_metadata">Wrong Subject, Year, or Semester</option>
                      <option value="other">Other issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsReportModalOpen(false)}
                      disabled={submittingReport}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={submittingReport || !reportReason}
                    >
                      {submittingReport ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paper Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-slate-200 bg-white shadow-2xl">
            <CardHeader className="relative border-b border-slate-100 pb-5">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
                onClick={() => setIsRequestModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <FileQuestion className="h-5 w-5" />
                Request a Paper
              </CardTitle>
              <CardDescription className="text-slate-500">
                Tell us what&apos;s missing — the team reviews every request and uploads verified
                papers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {requestError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{requestError}</AlertDescription>
                </Alert>
              )}
              {requestSuccess ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-600">
                    ✓
                  </div>
                  <p className="font-semibold text-emerald-800">{requestSuccess}</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsRequestModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Department *
                      </label>
                      <select
                        value={requestForm.departmentId}
                        onChange={(e) =>
                          setRequestForm((f) => ({ ...f, departmentId: e.target.value, branchId: '' }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        required
                      >
                        <option value="">Select department</option>
                        {requestDepartments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Branch *
                      </label>
                      <select
                        value={requestForm.branchId}
                        onChange={(e) => setRequestForm((f) => ({ ...f, branchId: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        required
                        disabled={!requestForm.departmentId || requestBranches.length === 0}
                      >
                        <option value="">
                          {requestForm.departmentId ? 'Select branch' : 'Pick a department first'}
                        </option>
                        {requestBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        value={requestForm.subjectName}
                        onChange={(e) =>
                          setRequestForm((f) => ({ ...f, subjectName: e.target.value }))
                        }
                        placeholder="e.g., Operating Systems"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Subject Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={requestForm.subjectCode}
                        onChange={(e) =>
                          setRequestForm((f) => ({ ...f, subjectCode: e.target.value }))
                        }
                        placeholder="e.g., CS-402"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Exam Type
                      </label>
                      <select
                        value={requestForm.examType}
                        onChange={(e) => setRequestForm((f) => ({ ...f, examType: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="any">Any</option>
                        <option value="mid-term">Mid-Term</option>
                        <option value="end-term">End-Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Year (Optional)
                      </label>
                      <input
                        type="number"
                        value={requestForm.year}
                        onChange={(e) => setRequestForm((f) => ({ ...f, year: e.target.value }))}
                        placeholder="e.g., 2024"
                        min="2000"
                        max="2100"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Anything else? (Optional)
                    </label>
                    <textarea
                      value={requestForm.note}
                      onChange={(e) => setRequestForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="Anything that helps us find it — semester, exact exam name…"
                      maxLength={500}
                      className="min-h-[80px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRequestModalOpen(false)}
                      disabled={submittingRequest}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
                      disabled={submittingRequest}
                    >
                      {submittingRequest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
