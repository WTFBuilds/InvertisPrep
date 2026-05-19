'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About InvertisPrep</h1>
          <p className="text-xl text-gray-600">Empowering students with quality education resources</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Who We Are */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                Who We Are
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                InvertisPrep is an educational platform dedicated to providing comprehensive study materials for students. We believe that access to quality resources should not be a barrier to educational success. Our platform aggregates Previous Year Question papers, syllabus documents, and interactive tools to support student learning.
              </p>
            </CardContent>
          </Card>

          {/* Our Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                We envision a world where every student has access to comprehensive, organized, and up-to-date study materials. By leveraging technology and community contributions, we aim to create the most comprehensive resource library for Indian educational institutions.
              </p>
            </CardContent>
          </Card>

          {/* Our Values */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-600" />
                Our Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span><strong>Accessibility:</strong> Making education resources available to everyone</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>Quality:</strong> Ensuring high-quality, verified content</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-pink-600 font-bold">✓</span>
                  <span><strong>Community:</strong> Building a supportive learning community</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span><strong>Innovation:</strong> Continuously improving our platform with new features</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
