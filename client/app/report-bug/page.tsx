'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ReportBugPage() {
  const [formData, setFormData] = useState({
    bugTitle: '',
    description: '',
    severity: 'medium',
    email: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement bug report submission
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        bugTitle: '',
        description: '',
        severity: 'medium',
        email: '',
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">Report a Bug</h1>
          </div>
          <p className="text-gray-600">Help us improve by reporting any issues you encounter</p>
        </div>

        {/* Bug Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Bug Report Form</CardTitle>
            <CardDescription>
              Please provide detailed information about the bug so we can fix it quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bug Title *</label>
                <input
                  type="text"
                  name="bugTitle"
                  value={formData.bugTitle}
                  onChange={handleChange}
                  placeholder="Brief description of the bug"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the bug, steps to reproduce, expected vs actual behavior"
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Low - Minor inconvenience</option>
                    <option value="medium">Medium - Affects functionality</option>
                    <option value="high">High - Severe issue</option>
                    <option value="critical">Critical - System breaking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Submit Bug Report
              </Button>

              {submitted && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Thank you for reporting!</p>
                    <p className="text-sm text-green-700">We'll investigate and fix this issue soon.</p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Better Bug Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Include steps to reproduce the bug</li>
              <li>• Specify your browser and device</li>
              <li>• Describe the expected vs actual behavior</li>
              <li>• Include screenshots if possible</li>
              <li>• Mention any error messages you see</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
