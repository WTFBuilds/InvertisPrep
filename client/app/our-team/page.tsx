'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function OurTeamPage() {
  const team = [
    { name: 'Member 1', role: 'Founder & Lead', image: '👨‍💼' },
    { name: 'Member 2', role: 'Content Lead', image: '👩‍💼' },
    { name: 'Member 3', role: 'Technical Lead', image: '👨‍💻' },
    { name: 'Member 4', role: 'Community Manager', image: '👩‍💻' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Our Team</h1>
          </div>
          <p className="text-xl text-gray-600">Meet the people behind InvertisPrep</p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {team.map((member, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all text-center">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">{member.image}</div>
                <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              At InvertisPrep, we're dedicated to making quality education resources accessible to every student. Our team works tirelessly to provide comprehensive PYQs, syllabus materials, and interactive tools to help students succeed in their exams.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
