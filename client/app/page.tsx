import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to InvertisPrep
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your one-stop solution for accessing Previous Year Question Papers at Invertis University
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/pyq">
              <Button size="lg" className="text-lg px-8">
                Browse PYQs
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose InvertisPrep?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  Organized by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Papers organized by department, branch, semester, and session for easy navigation
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">🔍</span>
                  Advanced Filtering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Filter papers by branch, session, semester, exam type, and subject
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">✅</span>
                  Verified Papers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All papers are verified by administrators to ensure quality and accuracy
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Department</h3>
              <p className="text-muted-foreground">
                Choose your department from the available options
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Apply Filters</h3>
              <p className="text-muted-foreground">
                Filter by branch, semester, session, and exam type
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Papers</h3>
              <p className="text-muted-foreground">
                View and download the papers you need instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-8 opacity-90">
            Browse through thousands of previous year question papers
          </p>
          <Link href="/pyq">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Browsing
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 InvertisPrep. All rights reserved.</p>
          <p className="mt-2">Invertis University - Previous Year Questions Archive</p>
        </div>
      </footer>
    </div>
  );
}
