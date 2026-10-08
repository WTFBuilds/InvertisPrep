'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { departmentApi } from '@/lib/api';
import type { Department, CreateDepartmentDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function DepartmentsPage() {
  const { user } = useAuth();
  // SRT can view departments but cannot create, edit or delete
  const canModify = hasPermission(user, 'departments.manage');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [formData, setFormData] = useState<CreateDepartmentDTO>({
    id: '',
    name: '',
    displayName: '',
    icon: '',
    description: '',
  });

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data || []);
      setCurrentPage(1);
    } catch (err: unknown) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        id: formData.id,
        name: formData.name,
        displayName: formData.displayName,
        icon: formData.icon || undefined,
        description: formData.description,
      };

      if (editingId) {
        await departmentApi.update(editingId, submitData);
        setSuccess('Department updated successfully');
      } else {
        await departmentApi.create(submitData);
        setSuccess('Department created successfully');
      }
      
      setFormData({ id: '', name: '', displayName: '', icon: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchDepartments();
    } catch (err: unknown) {
      let errorMessage = 'Failed to save department';
      
      if (err instanceof Error) {
        // Check if it's an axios error with response data
        const axiosError = err as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleEdit = (dept: Department) => {
    setFormData({
      id: dept.id,
      name: dept.name,
      displayName: dept.displayName,
      icon: dept.icon,
      description: dept.description || '',
    });
    setEditingId(dept._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      await departmentApi.delete(id);
      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (err: unknown) {
      setError('Failed to delete department');
    }
  };

  const handleCancel = () => {
    setFormData({ id: '', name: '', displayName: '', icon: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(departments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = departments.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(pageNum);
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
            <h1 className="text-3xl font-bold">Departments Management</h1>
            <p className="text-muted-foreground">Manage academic departments</p>
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

        {canModify && !showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6">
            + Add New Department
          </Button>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Department' : 'Add New Department'}</CardTitle>
              <CardDescription>Fill in the department details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id">Department ID *</Label>
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="e.g., btech"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., B.Tech"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="e.g., Bachelor of Technology"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Icon (Emoji)</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g., 🎓"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter department description"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Update' : 'Create'} Department</Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!showForm && departments.length > 0 && (
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
              Showing {startIndex + 1} to {Math.min(endIndex, departments.length)} of {departments.length} departments
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
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
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {loading ? (
            <p>Loading departments...</p>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No departments found. Add your first department above.
              </CardContent>
            </Card>
          ) : (
            paginatedDepartments.map((dept) => (
              <Card key={dept._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="text-4xl">{dept.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold">{dept.displayName}</h3>
                        <p className="text-sm text-muted-foreground">ID: {dept.id} | Name: {dept.name}</p>
                        {dept.description && (
                          <p className="text-sm mt-2">{dept.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {dept.isActive ? '✓ Active' : '✗ Inactive'}
                        </p>
                      </div>
                    </div>
                    {canModify && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(dept)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(dept._id)}>
                          Delete
                        </Button>
                      </div>
                    )}
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
