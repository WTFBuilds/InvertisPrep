'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2 } from 'lucide-react';

export default function OurMentorsPage() {
  const mentors = [
    { name: 'Dr. Mentor 1', specialization: 'Computer Science', image: '👨‍🏫' },
    { name: 'Prof. Mentor 2', specialization: 'Engineering', image: '👩‍🏫' },
    { name: 'Dr. Mentor 3', specialization: 'Mathematics', image: '👨‍🏫' },
    { name: 'Prof. Mentor 4', specialization: 'Physics', image: '👩‍🏫' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Our Mentors</h1>
          </div>
          <p className="text-xl text-gray-600">Learn from experienced educators</p>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mentors.map((mentor, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all text-center">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">{mentor.image}</div>
                <h3 className="font-semibold text-lg text-gray-900">{mentor.name}</h3>
                <p className="text-purple-600 text-sm font-medium">{mentor.specialization}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About Mentors */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Expert Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Our mentors are experienced faculty members and educators who are committed to helping students succeed. They provide guidance on course content, exam preparation strategies, and career development. Connect with our mentors to get personalized support for your academic journey.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
