'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthSignInPage() {
  const startedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    const startGoogleSignIn = async () => {
      try {
        setError('');
        await signIn('google', {
          callbackUrl: '/login?webview=1',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to start Google sign-in';
        setError(message);
      }
    };

    startGoogleSignIn();
  }, []);

  const handleRetry = async () => {
    try {
      setError('');
      await signIn('google', {
        callbackUrl: '/login?webview=1',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start Google sign-in';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.22),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5" />
            </span>
            InvertisPrep Mobile Sign-In
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Continue securely with Google
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
            This page hands off authentication to Google and returns you to the app after the account is verified.
          </p>

          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
              <p>Google sign-in opens in a secure session and the app receives the result through the callback link.</p>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="mt-0.5 h-5 w-5 text-indigo-300" />
              <p>If the redirect does not start automatically, use the button below to continue.</p>
            </div>
          </div>

          {error && (
            <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
            >
              Continue with Google
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              Open web login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}