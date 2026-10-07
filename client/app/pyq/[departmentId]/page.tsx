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
import {
  Flag,
  X,
  Loader2,
  Eye,
  Download,
  Search,
  FilterX,
  ArrowLeft,
  FileQuestion,
  Send,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

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
      router.push(`/login?returnUrl=/pyq/${departmentId}`);
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

  // ── Paper request modal ────────────────────────────────────────────────────
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

  const selectClasses =
    'h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        {/* Header */}
        <Link
          href="/pyq"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All departments
        </Link>

        <div className="mb-6 flex items-start gap-4">
          {department && (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
                {department.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {department.displayName}
                  </h1>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {loading ? '…' : filteredPapers.length} papers
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Browse, filter and open previous year question papers — verified and free.
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>Failed to load data. Please try again.</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Filters — control panel */}
            <Card className="mb-6 overflow-hidden border-slate-200 shadow-sm">
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Filter papers
                    </h2>
                    <p className="text-sm text-slate-500">
                      Branch, session, semester, exam type or subject
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 sm:inline-flex">
                    {loading ? '…' : `${filteredPapers.length} papers`}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                    >
                      <FilterX className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-x-3.5 gap-y-4 px-4 py-5 sm:px-6 md:grid-cols-3 xl:grid-cols-5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Branch
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Session
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">All Sessions</option>
                      {sessions.map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Semester
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Exam Type
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">All Types</option>
                      <option value="mid-term">Mid-Term</option>
                      <option value="end-term">End-Term</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Subject
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchSubject}
                      onChange={(e) => setSearchSubject(e.target.value)}
                      placeholder="Name or code"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Result summary + paper request */}
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-slate-500">
                  {hasActiveFilters ? (
                    <>
                      <span className="font-semibold text-slate-900">
                        {filteredPapers.length}
                      </span>{' '}
                      of {papers.length} papers match
                    </>
                  ) : (
                    <>
                      Showing all{' '}
                      <span className="font-semibold text-slate-900">{papers.length}</span> papers
                    </>
                  )}
                </p>
                <button
                  onClick={handleOpenRequestModal}
                  className="group inline-flex items-center gap-2 text-left"
                >
                  <span className="text-xs text-slate-500">
                    Can&apos;t find it? We&apos;ll upload it for you.
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-700">
                    <FileQuestion className="h-3.5 w-3.5" />
                    Request a paper
                  </span>
                </button>
              </div>
            </Card>

            {/* Papers List */}
            {filteredPapers.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white/70 shadow-sm">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-slate-900">No papers found</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    Try changing your filters — or request the paper and our team will upload it.
                  </p>
                  {papers.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} size="sm" className="mt-1">
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPapers.map((paper) => (
                  <Card
                    key={paper._id}
                    className="group flex h-full flex-col justify-between overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-[15px] font-semibold leading-snug tracking-tight text-slate-900">
                          {paper.subjectName}
                        </CardTitle>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                          {paper.examType === 'mid-term' ? 'Mid-Term' : 'End-Term'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{paper.subjectCode || 'No code'}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                        <span>{paper.year}</span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {getPaperBranchNames(paper).map((branchName) => (
                          <span
                            key={branchName}
                            className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700"
                          >
                            {branchName}
                          </span>
                        ))}
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                          Sem {paper.semester}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span className="truncate">
                          {getSessionName(paper) !== 'N/A' ? getSessionName(paper) : paper.year}
                        </span>
                        <span className="flex shrink-0 items-center gap-2.5 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {paper.downloads || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {paper.views || 0}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          className="h-8 flex-1 bg-slate-900 text-xs font-medium text-white hover:bg-slate-700"
                          onClick={() => handleView(paper)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View paper
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 flex-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => handleReportClick(paper)}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Report issue
                        </Button>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[13px]">
                        <Avatar className="h-5 w-5 shrink-0">
                          {getUploadedByPicture(paper) && (
                            <AvatarImage src={getUploadedByPicture(paper)} alt={getUploadedByName(paper)} />
                          )}
                          <AvatarFallback className="bg-slate-100 text-[9px] font-bold text-slate-600">
                            {getUploadedByName(paper).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="shrink-0 text-slate-500">Uploaded by</span>
                        {getUploadedById(paper) ? (
                          <Link
                            href={`/profile/${getUploadedById(paper)}`}
                            className="truncate font-semibold text-slate-700 transition-colors hover:text-slate-900"
                          >
                            {getUploadedByName(paper)}
                          </Link>
                        ) : (
                          <span className="truncate font-semibold text-slate-700">
                            {getUploadedByName(paper)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Modal */}
      {isReportModalOpen && selectedPaperToReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
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
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
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
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">
                    ✓
                  </div>
                  <p className="font-semibold text-emerald-800">{reportSuccess}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
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
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
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
                      className="bg-slate-900 text-white hover:bg-slate-700"
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
