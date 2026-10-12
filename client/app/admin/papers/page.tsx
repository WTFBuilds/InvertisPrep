'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { matchesQuery } from '@/lib/search';
import { pyqApi, pdfApi } from '@/lib/api';
import type { PYQPaper, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditPaperDialog } from '@/components/admin/edit-paper-dialog';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PapersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // Edit, verify and delete are independent: a role may hold verify without
  // edit, and deletion is reserved for super-admins (papers.delete is a
  // system-only permission that can never be granted to anyone else).
  const canEdit = hasPermission(user, 'papers.edit');
  const canVerify = hasPermission(user, 'papers.verify');
  const canDelete = user?.role === 'super-admin';
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>(
    searchParams.get('verified') === 'unverified' ? 'unverified' : 'all'
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [editPaper, setEditPaper] = useState<PYQPaper | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // `silent` keeps the current list mounted while refetching, so the page
  // height doesn't collapse and the user's scroll position survives an edit.
  const fetchPapers = async (opts?: { page?: number; limit?: number; silent?: boolean; search?: string }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const params: Record<string, unknown> = {
        page: opts?.page ?? page,
        limit: opts?.limit ?? pageSize,
      };
      // Server-side verification filter so unverified papers from any page are returned
      if (verificationFilter === 'verified') params.verified = 'true';
      else if (verificationFilter === 'unverified') params.verified = 'false';
      // Server-side search — the real search across all papers (name/code/dept),
      // not just the current page.
      const q = opts?.search ?? debouncedQuery;
      if (q) params.search = q;
      const res = await pyqApi.getAll(params);
      setPapers(res.data || []);
      setFilteredPapers(res.data || []);
      setTotal(typeof (res as any).total === 'number' ? (res as any).total : (res.count ?? (res.data?.length || 0)));
    } catch (err: unknown) {
      toast.error('Failed to load papers');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const filterPapers = (
    searchTerm: string,
    verification: 'all' | 'verified' | 'unverified',
    papersToFilter: PYQPaper[]
  ) => {
    return papersToFilter.filter((paper) => {
      // Verification status filter
      if (verification === 'verified' && !paper.verified) return false;
      if (verification === 'unverified' && paper.verified) return false;

      if (!searchTerm.trim()) {
        return true;
      }

      // Separator/punctuation-insensitive across every field, so codes like
      // "BAS301" / "BAS 301" and names like "b.tech" / "btech" all match.
      const fields: string[] = [
        paper.subjectName,
        paper.subjectCode || '',
        paper.examType,
        String(paper.year ?? ''),
        String(paper.semester ?? ''),
      ];
      if (typeof paper.departmentId !== 'string') {
        fields.push(paper.departmentId.name, paper.departmentId.displayName || '');
      }
      if (typeof paper.branchId !== 'string') {
        fields.push(paper.branchId.name);
      }
      if (typeof paper.sessionId !== 'string') {
        fields.push(paper.sessionId.name);
      }

      return fields.some((field) => matchesQuery(field, searchTerm));
    });
  };

  // A new search/filter starts back at page 1...
  useEffect(() => {
    setPage(1);
  }, [query, verificationFilter]);

  // Debounced server-side search — typing settles for 400ms, then refetches
  // from the backend (which searches across ALL papers, not just this page).
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  // ...but a refetch must not reset the page the user is browsing.
  useEffect(() => {
    setFilteredPapers(filterPapers(query, verificationFilter, papers));
  }, [query, verificationFilter, papers]);

  useEffect(() => {
    // refetch when page, pageSize, or verification filter changes
    fetchPapers({ page, limit: pageSize, search: debouncedQuery });
  }, [page, pageSize, verificationFilter, debouncedQuery]);

  const handleVerify = async (id: string) => {
    try {
      await pyqApi.verify(id);
      toast.success('Paper verified successfully');
      fetchPapers({ silent: true });
    } catch (err: unknown) {
      let errorMessage = 'Failed to verify paper';
      const axiosError = err as any;
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper? This action cannot be undone.')) return;

    try {
      await pyqApi.delete(id);
      toast.success('Paper deleted successfully');
      // deselect if selected
      setSelected((s) => s.filter((sid) => sid !== id));
      fetchPapers({ silent: true });
    } catch (err: unknown) {
      toast.error('Failed to delete paper');
    }
  };

  const handleEdit = (paper: PYQPaper) => {
    setEditPaper(paper);
    setEditOpen(true);
  };

  const handleView = (paper: PYQPaper) => {
    // Count the view, then open the protected PDF viewer so the admin can review before verifying
    pyqApi.trackView(paper._id).catch(() => {});
    router.push(`/view/${paper._id}?type=pyq`);
  };

  const handleDownload = async (paper: PYQPaper) => {
    try {
      const { blob, filename } = await pdfApi.download(paper._id, 'pyq');
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      // Track download for stats (fire and forget)
      pyqApi.trackDownload(paper._id).catch(() => {});
    } catch (err: unknown) {
      toast.error('Failed to download paper');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectAllOnPage = () => {
    if (selected.length === filteredPapers.length) setSelected([]);
    else setSelected(filteredPapers.map((p) => p._id));
  };

  const handleBulkVerify = async () => {
    if (selected.length === 0) return toast.error('No papers selected');
    try {
      await Promise.all(selected.map((id) => pyqApi.verify(id)));
      toast.success('Selected papers verified');
      setSelected([]);
      fetchPapers({ page, limit: pageSize, silent: true });
    } catch (err: unknown) {
      toast.error('Failed to verify selected papers');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return toast.error('No papers selected');
    if (!confirm('Delete selected papers? This cannot be undone.')) return;
    try {
      await Promise.all(selected.map((id) => pyqApi.delete(id)));
      toast.success('Selected papers deleted');
      setSelected([]);
      fetchPapers({ page, limit: pageSize, silent: true });
    } catch (err: unknown) {
      toast.error('Failed to delete selected papers');
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Search is now handled by filterPapers function via useEffect
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

        <EditPaperDialog
          paper={editPaper}
          open={editOpen}
          onOpenChange={(next) => {
            setEditOpen(next);
            if (!next) setEditPaper(null);
          }}
          onSaved={(message) => {
            toast.success(message);
            fetchPapers({ silent: true });
          }}
        />

        <div className="mb-4 text-sm text-muted-foreground flex items-center justify-between">
          <div>
            Total Papers: {total}{' '}
            {(query || verificationFilter !== 'all') && `(${filteredPapers.length} shown)`}
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search by name, code, dept, branch, session, year..." 
                className="px-2 py-1 border rounded" 
              />
              <Button type="submit" size="sm">Search</Button>
            </form>
            <Select
              value={verificationFilter}
              onValueChange={(v) => setVerificationFilter(v as 'all' | 'verified' | 'unverified')}
            >
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All papers</SelectItem>
                <SelectItem value="verified">Verified only</SelectItem>
                <SelectItem value="unverified">Unverified only</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={selectAllOnPage}>{selected.length === filteredPapers.length ? 'Unselect' : 'Select All'}</Button>
              {canVerify && (
                <Button size="sm" onClick={handleBulkVerify} disabled={selected.length===0}>Verify Selected</Button>
              )}
              {canDelete && (
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={selected.length===0}>Delete Selected</Button>
              )}
            </div>
          </div>
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
          ) : filteredPapers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No papers match your search. Try different keywords.
              </CardContent>
            </Card>
          ) : (
            filteredPapers.map((paper) => (
              <Card key={paper._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected.includes(paper._id)} onChange={() => toggleSelect(paper._id)} />
                      <div>
                        <CardTitle className="text-lg">{paper.subjectName}</CardTitle>
                        <CardDescription>
                          {paper.subjectCode} | {paper.examType.toUpperCase()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(paper)}>
                        View
                      </Button>
                      {!paper.verified && canVerify && (
                        <Button size="sm" variant="default" onClick={() => handleVerify(paper._id)}>
                          ✓ Verify
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownload(paper)}>
                        Download
                      </Button>
                      {canEdit && (
                        <Button
                          size="sm"
                          className="bg-slate-900 text-white hover:bg-slate-800"
                          onClick={() => handleEdit(paper)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(paper._id)}>
                          Delete
                        </Button>
                      )}
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
                    {(paper.additionalBranchIds?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Additional Branches</p>
                        <p className="font-medium">
                          {paper.additionalBranchIds!
                            .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}
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
                        {paper.verified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600">⚠ Pending Verification</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">{paper.downloads ?? paper.downloadCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">{paper.views ?? paper.viewCount ?? 0}</p>
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

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <span>Page {page}</span>
            <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>Next</Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Per page</label>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} className="border px-2 py-1">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
