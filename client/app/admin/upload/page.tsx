'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { pyqApi, departmentApi, sessionApi } from '@/lib/api';
import type { Department, Branch, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function UploadPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes] = await Promise.all([
          departmentApi.getAll(),
          sessionApi.getAll(),
        ]);
        setDepartments(deptRes.data || []);
        setSessions(sessRes.data || []);
      } catch (err: unknown) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        } catch (err: unknown) {
          setError('Failed to load branches');
        }
      } else {
        setBranches([]);
        setFilteredBranches([]);
        setSelectedSemesters([]);
      }
    };
    fetchBranches();
  }, [formData.departmentId]);

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
      uploadData.append('sessionId', formData.sessionId);
      uploadData.append('semester', formData.semester);
      uploadData.append('subjectName', formData.subjectName);
      uploadData.append('subjectCode', formData.subjectCode);
      uploadData.append('examType', formData.examType);
      uploadData.append('year', formData.year.toString());

      await pyqApi.upload(uploadData);
      
      setSuccess('PYQ uploaded successfully!');
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
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PYQ';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Upload PYQ</h1>
            <p className="text-muted-foreground">Upload previous year question papers</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Upload New PYQ Paper</CardTitle>
            <CardDescription>Fill in all required details and select a PDF file</CardDescription>
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
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.icon} {dept.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="branchId">Branch *</Label>
                <select
                  id="branchId"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full border rounded-md p-2"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionId">Session *</Label>
                  <select
                    id="sessionId"
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    className="w-full border rounded-md p-2"
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

                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <select
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full border rounded-md p-2"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectName">Subject Name *</Label>
                  <Input
                    id="subjectName"
                    value={formData.subjectName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g., Data Structures"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subjectCode">Subject Code *</Label>
                  <Input
                    id="subjectCode"
                    value={formData.subjectCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, subjectCode: e.target.value })}
                    placeholder="e.g., CS201"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examType">Exam Type *</Label>
                  <select
                    id="examType"
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Select Exam Type</option>
                    <option value="mid-term">Mid-Term</option>
                    <option value="end-term">End-Term</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="file">PDF File * (Max 10MB)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : 'Upload PYQ'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
