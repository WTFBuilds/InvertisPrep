'use client';

import { useEffect, useState } from 'react';
import { departmentApi } from '@/lib/api';
import type { Department } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function PYQBrowsePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getAll();
        setDepartments(response.data || []);
      } catch (err: unknown) {
        setError('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse PYQ Papers</h1>
          <p className="text-xl text-muted-foreground">
            Select your department to view previous year question papers
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No departments available yet. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <Link key={dept._id} href={`/pyq/${dept._id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{dept.icon}</div>
                      <div>
                        <CardTitle className="text-xl">{dept.displayName}</CardTitle>
                        <CardDescription>{dept.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {dept.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Can&apos;t find your department?{' '}
            <a href="/admin/login" className="text-primary hover:underline">
              Contact admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
