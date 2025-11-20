'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { pyqApi, departmentApi } from '@/lib/api';
import type { PYQPaper, Department, Branch, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function DepartmentPYQPage() {
  const params = useParams();
  const departmentId = params.departmentId as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [searchSubject, setSearchSubject] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, branchesRes, papersRes] = await Promise.all([
          departmentApi.getAll(),
          departmentApi.getBranches(departmentId),
          pyqApi.getFiltered({ departmentId }),
        ]);

        const dept = (deptRes.data || []).find((d: Department) => d._id === departmentId);
        setDepartment(dept || null);
        setBranches(branchesRes.data || []);
        setPapers(papersRes.data || []);
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
  }, [selectedBranch, selectedSemester, selectedExamType, searchSubject, papers]);

  const handleDownload = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackDownload(paper._id);
      window.open(paper.cloudinaryUrl, '_blank');
    } catch (err: unknown) {
      console.error('Failed to track download');
    }
  };

  const handleView = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackView(paper._id);
    } catch (err: unknown) {
      console.error('Failed to track view');
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

  const clearFilters = () => {
    setSelectedBranch('');
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
                <div className="grid md:grid-cols-4 gap-4 mb-4">
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
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{paper.subjectName}</CardTitle>
                          <CardDescription>
                            {paper.subjectCode} | {paper.examType.toUpperCase()} | Year {paper.year}
                          </CardDescription>
                        </div>
                        <Button onClick={() => handleDownload(paper)}>Download PDF</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                          <p className="text-muted-foreground">Downloads</p>
                          <p className="font-medium">{paper.downloads || 0}</p>
                        </div>
                      </div>
                      {paper.verified && (
                        <div className="mt-3">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ✓ Verified
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
