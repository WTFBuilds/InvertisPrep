'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { branchApi, departmentApi } from '@/lib/api';
import type { Branch, Department, CreateBranchDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [formData, setFormData] = useState<CreateBranchDTO>({
    id: '',
    name: '',
    departmentId: '',
    semesters: [],
  });

  const fetchData = async () => {
    try {
      const [branchesRes, departmentsRes] = await Promise.all([
        branchApi.getAll(),
        departmentApi.getAll(),
      ]);
      setBranches(branchesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setCurrentPage(1); // Reset to first page when data is fetched
    } catch (err: unknown) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.semesters.length === 0) {
      setError('Please select at least one semester');
      return;
    }

    try {
      if (editingId) {
        await branchApi.update(editingId, formData);
        setSuccess('Branch updated successfully');
      } else {
        await branchApi.create(formData);
        setSuccess('Branch created successfully');
      }
      
      setFormData({ id: '', name: '', departmentId: '', semesters: [] });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branch';
      setError(errorMessage);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      id: branch.id,
      name: branch.name,
      departmentId: typeof branch.departmentId === 'string' ? branch.departmentId : branch.departmentId._id,
      semesters: branch.semesters,
    });
    setEditingId(branch._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      await branchApi.delete(id);
      setSuccess('Branch deleted successfully');
      fetchData();
    } catch (err: unknown) {
      setError('Failed to delete branch');
    }
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', departmentId: '', semesters: [] });
    setShowForm(false);
    setEditingId(null);
  };

  const toggleSemester = (semester: number) => {
    setFormData((prev) => ({
      ...prev,
      semesters: prev.semesters.includes(semester)
        ? prev.semesters.filter((s) => s !== semester)
        : [...prev.semesters, semester].sort((a, b) => a - b),
    }));
  };

  const getDepartmentName = (branch: Branch) => {
    if (typeof branch.departmentId === 'string') {
      const dept = departments.find((d) => d._id === branch.departmentId);
      return dept?.displayName || 'Unknown';
    }
    return (branch.departmentId as Department).displayName;
  };

  // Pagination calculations
  const totalPages = Math.ceil(branches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBranches = branches.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Branches Management</h1>
            <p className="text-muted-foreground">Manage department branches</p>
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

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6">
            + Add New Branch
          </Button>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Branch' : 'Add New Branch'}</CardTitle>
              <CardDescription>Fill in the branch details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="departmentId">Department *</Label>
                  <select
                    id="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.icon} {dept.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">Branch ID *</Label>
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g., cse"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Computer Science Engineering"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Semesters *</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <Button
                        key={sem}
                        type="button"
                        variant={formData.semesters.includes(sem) ? 'default' : 'outline'}
                        onClick={() => toggleSemester(sem)}
                        className="w-full"
                      >
                        {sem}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {formData.semesters.length > 0 ? formData.semesters.join(', ') : 'None'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Update' : 'Create'} Branch</Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!showForm && branches.length > 0 && (
          <div className="mb-6 flex items-center justify-between p-4 border rounded-md bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border rounded-md p-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, branches.length)} of {branches.length} branches
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-10"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {loading ? (
            <p>Loading branches...</p>
          ) : branches.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No branches found. Add your first branch above.
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedBranches.map((branch) => (
                <Card key={branch._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {branch.id} | Department: {getDepartmentName(branch)}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Semesters:</span> {branch.semesters.join(', ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {branch.isActive ? '✓ Active' : '✗ Inactive'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(branch._id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
