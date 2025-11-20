'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { pyqApi } from '@/lib/api';
import type { PYQPaper, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function PapersPage() {
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPapers = async () => {
    try {
      const response = await pyqApi.getAll();
      setPapers(response.data || []);
    } catch (err: unknown) {
      setError('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await pyqApi.verify(id);
      setSuccess('Paper verified successfully');
      fetchPapers();
    } catch (err: unknown) {
      setError('Failed to verify paper');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper? This action cannot be undone.')) return;

    try {
      await pyqApi.delete(id);
      setSuccess('Paper deleted successfully');
      fetchPapers();
    } catch (err: unknown) {
      setError('Failed to delete paper');
    }
  };

  const handleDownload = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackDownload(paper._id);
      window.open(paper.cloudinaryUrl, '_blank');
    } catch (err: unknown) {
      setError('Failed to track download');
    }
  };

  const getDepartmentName = (paper: PYQPaper) => {
    if (typeof paper.departmentId === 'string') return 'N/A';
    return paper.departmentId.displayName || paper.departmentId.name;
  };

  const getBranchName = (paper: PYQPaper) => {
    if (typeof paper.branchId === 'string') return 'N/A';
    return paper.branchId.name;
  };

  const getSessionName = (paper: PYQPaper) => {
    if (typeof paper.sessionId === 'string') return 'N/A';
    return paper.sessionId.name;
  };

  const getUploadedBy = (paper: PYQPaper) => {
    if (typeof paper.uploadedBy === 'string') return 'Unknown';
    return (paper.uploadedBy as User).email;
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">PYQ Papers Management</h1>
            <p className="text-muted-foreground">View, verify, and manage uploaded papers</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 text-sm text-muted-foreground">
          Total Papers: {papers.length}
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p>Loading papers...</p>
          ) : papers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No papers found. Upload your first paper from the Upload page.
              </CardContent>
            </Card>
          ) : (
            papers.map((paper) => (
              <Card key={paper._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{paper.subjectName}</CardTitle>
                      <CardDescription>
                        {paper.subjectCode} | {paper.examType.toUpperCase()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!paper.isVerified && (
                        <Button size="sm" variant="default" onClick={() => handleVerify(paper._id)}>
                          ✓ Verify
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownload(paper)}>
                        Download
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(paper._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{getDepartmentName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{getBranchName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Session</p>
                      <p className="font-medium">{getSessionName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Semester</p>
                      <p className="font-medium">Semester {paper.semester}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{paper.year}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {paper.isVerified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600">⚠ Pending Verification</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">{paper.downloadCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">{paper.viewCount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Uploaded By</p>
                      <p className="font-medium">{getUploadedBy(paper)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">File Name</p>
                      <p className="font-medium text-xs">{paper.fileName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Uploaded At</p>
                      <p className="font-medium text-xs">
                        {new Date(paper.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
