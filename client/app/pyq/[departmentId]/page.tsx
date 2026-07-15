'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pyqApi, departmentApi, sessionApi, reportApi } from '@/lib/api';
import type { PYQPaper, Department, Branch, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Flag, X, Loader2 } from 'lucide-react';

export default function DepartmentPYQPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.departmentId as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [searchSubject, setSearchSubject] = useState('');

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, branchesRes, papersRes, sessionsRes] = await Promise.all([
          departmentApi.getAll(),
          departmentApi.getBranches(departmentId),
          pyqApi.getFiltered({ departmentId }),
          sessionApi.getAll(),
        ]);

        const dept = (deptRes.data || []).find((d: Department) => d._id === departmentId);
        setDepartment(dept || null);
        setBranches(branchesRes.data || []);
        setPapers(papersRes.data || []);
        setSessions(sessionsRes.data || []);
        setFilteredPapers(papersRes.data || []);
      } catch (err: unknown) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departmentId]);

  useEffect(() => {
    let filtered = [...papers];

    if (selectedBranch) {
      filtered = filtered.filter((p) => {
        const branchId = typeof p.branchId === 'string' ? p.branchId : p.branchId._id;
        return branchId === selectedBranch;
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
      filtered = filtered.filter(
        (p) =>
          p.subjectName.toLowerCase().includes(searchSubject.toLowerCase()) ||
          p.subjectCode?.toLowerCase().includes(searchSubject.toLowerCase())
      );
    }

    setFilteredPapers(filtered);
  }, [selectedBranch, selectedSession, selectedSemester, selectedExamType, searchSubject, papers]);

  const handleDownload = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackDownload(paper._id);
      window.open(paper.cloudinaryUrl, '_blank');
    } catch (err: unknown) {
      alert('Download failed. Please try again.');
    }
  };

  const handleView = async (paper: PYQPaper) => { 
    try {
      await pyqApi.trackView(paper._id);
      window.open(paper.cloudinaryUrl, '_blank');
    } catch (err: unknown) {
      alert('View failed. Please try again.');
    }
  };

  const getBranchName = (paper: PYQPaper) => {
    if (typeof paper.branchId === 'string') {
      const branch = branches.find((b) => b._id === paper.branchId);
      return branch?.name || 'N/A';
    }
    return paper.branchId.name;
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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/pyq">
            <Button variant="outline" className="mb-4">
              ← Back to Departments
            </Button>
          </Link>
          {department && (
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{department.icon}</span>
              <div>
                <h1 className="text-4xl font-bold">{department.displayName}</h1>
                <p className="text-muted-foreground">{department.name}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading papers...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter Papers</CardTitle>
                <CardDescription>
                  Use filters to find specific papers ({filteredPapers.length} of {papers.length} papers)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full border rounded-md p-2"
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
                    <label className="text-sm font-medium mb-2 block">Session</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full border rounded-md p-2"
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
                    <label className="text-sm font-medium mb-2 block">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full border rounded-md p-2"
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
                    <label className="text-sm font-medium mb-2 block">Exam Type</label>
                    <select
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">All Types</option>
                      <option value="mid-term">Mid-Term</option>
                      <option value="end-term">End-Term</option>
                      <option value="sessional">Sessional</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Subject</label>
                    <input
                      type="text"
                      value={searchSubject}
                      onChange={(e) => setSearchSubject(e.target.value)}
                      placeholder="Subject name or code"
                      className="w-full border rounded-md p-2"
                    />
                  </div>
                </div>

                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Papers List */}
            {filteredPapers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    No papers found matching your filters.
                  </p>
                  {papers.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPapers.map((paper) => (
                  <Card key={paper._id} onMouseEnter={() => handleView(paper)}>
                    <CardHeader>
                      <div className="grid grid-cols-2 md:flex md:flex-row md:justify-between items-center gap-4">
                        <div>
                          <CardTitle className="text-xl">{paper.subjectName}</CardTitle>
                          <CardDescription>
                            {paper.subjectCode} | {paper.examType.toUpperCase()} | Year {paper.year}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:flex md:flex-row md:justify-between gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Branch</p>
                          <p className="font-medium">{getBranchName(paper)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Semester</p>
                          <p className="font-medium">Semester {paper.semester}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Session</p>
                          <p className="font-medium">{getSessionName(paper)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Downloads / Views</p>
                          <p className="font-medium">
                            {paper.downloads || 0} / {paper.views || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Uploaded By</p>
                          {getUploadedById(paper) ? (
                            <Link 
                              href={`/profile/${getUploadedById(paper)}`}
                              className="flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-0.5"
                            >
                              <Avatar className="h-5 w-5 border border-indigo-100 flex-shrink-0">
                                {getUploadedByPicture(paper) ? (
                                  <AvatarImage src={getUploadedByPicture(paper)} alt={getUploadedByName(paper)} />
                                ) : null}
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                                  {getUploadedByName(paper).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[100px]" title={getUploadedByName(paper)}>
                                {getUploadedByName(paper)}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 font-medium text-gray-500 mt-0.5">
                              <Avatar className="h-5 w-5 border border-gray-100 flex-shrink-0">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-[9px] font-bold">
                                  S
                                </AvatarFallback>
                              </Avatar>
                              <span>{getUploadedByName(paper)}</span>
                            </div>
                          )}
                        </div>
                        <div className="size-sm flex gap-2">
                          <Button className="h-10" onClick={() => handleView(paper)}>View</Button>
                          <Button
                            variant="outline" 
                            className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex items-center gap-1.5"
                            onClick={() => handleReportClick(paper)}
                          >
                            <Flag className="h-4 w-4" />
                            Report
                          </Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-indigo-100 bg-white">
            <CardHeader className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                onClick={() => setIsReportModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl flex items-center gap-2 text-red-600">
                <Flag className="h-5 w-5" />
                Report PYQ Paper
              </CardTitle>
              <CardDescription>
                Help us maintain quality. Report issues with <strong>{selectedPaperToReport.subjectName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{reportError}</AlertDescription>
                </Alert>
              )}
              {reportSuccess ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg font-bold">
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
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                      Reason for Reporting *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-y"
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
    </div>
  );
}
