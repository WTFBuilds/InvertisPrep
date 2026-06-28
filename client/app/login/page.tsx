"use client";

import { useState, useEffect } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Chrome, Sparkles, Shield, GraduationCap } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle checking for NextAuth session on mount (to handle OAuth callback redirect)
  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session?.idToken) {
          setLoading(true);
          setError('');

          console.log('Detected Google session, exchanging with backend...');

          // Send the ID token to our backend
          const response = await api.post('/auth/google-login', {
            token: session.idToken
          });

          console.log('Backend exchange response:', response.data);

          if (response.data?.success && response.data?.token) {
            // Store our JWT token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Call NextAuth signout to clear the NextAuth session so it doesn't linger
            await signOut({ redirect: false });

            // Redirect to PYQ page
            router.push('/pyq');
          } else {
            setError(response.data?.message || 'Failed to authenticate with server');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error processing Google sign-in session:', err);
        setError('An error occurred while finishing Google sign-in.');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Trigger Google OAuth flow with callbackUrl pointing to /login
      // This will perform a redirect to Google, and after auth Google redirects
      // back to NextAuth which redirects back to /login.
      await signIn('google', { 
        callbackUrl: '/login'
      });
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="hidden md:block space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  INVERTISPREP
                </h1>
              </Link>
              <p className="text-2xl text-gray-700 font-semibold">
                Your Gateway to Academic Excellence
              </p>
              <p className="text-lg text-gray-600">
                Access thousands of previous year questions and excel in your studies at Invertis University.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Comprehensive Library</h3>
                  <p className="text-gray-600 text-sm">Access PYQs from all departments and branches</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Verified Content</h3>
                  <p className="text-gray-600 text-sm">All papers verified by faculty and administrators</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
                  <p className="text-gray-600 text-sm">Monitor your preparation with our tracking system</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Card */}
          <div className="w-full max-w-md mx-auto">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="space-y-3 pb-6">
                <div className="mx-auto p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl w-fit">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Welcome Back!
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Sign in to access previous year questions and study materials
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Chrome className="h-5 w-5" />
                      <span>Continue with Google</span>
                    </div>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Link href="/admin/login">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50"
                  >
                    Admin Login
                  </Button>
                </Link>

                <div className="pt-4 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    By signing in, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-indigo-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className="text-indigo-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mobile branding */}
            <div className="md:hidden mt-8 text-center">
              <Link href="/">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
