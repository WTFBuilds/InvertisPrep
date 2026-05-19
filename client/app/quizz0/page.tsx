'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Quizz0Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <CardTitle className="text-2xl">Quizzo - Coming Soon</CardTitle>
                <CardDescription>Interactive quiz platform for practice</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              We're building an interactive quiz platform where you can test your knowledge with questions from previous years and practice for your exams.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-blue-800 font-medium">🚀 Features Coming Soon:</p>
              <ul className="text-blue-700 mt-2 space-y-1 ml-4">
                <li>• Multiple choice questions from previous papers</li>
                <li>• Time-based mock tests</li>
                <li>• Performance analytics</li>
                <li>• Topic-wise practice</li>
              </ul>
            </div>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
              Notify Me When Available
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
