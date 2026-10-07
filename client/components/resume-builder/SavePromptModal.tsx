'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { buildCanonicalLoginUrl, shouldTransitionAuthHost } from '@/lib/canonical';
import { navigationFlag } from './ResumeBuilder';

interface SavePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndLogin: () => void;
  onDiscard: () => void;
}

export function SavePromptModal({ open, onOpenChange, onSaveAndLogin, onDiscard }: SavePromptModalProps) {
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      // Save draft to localStorage BEFORE redirect so login page can migrate it
      onSaveAndLogin();
      // Suppress beforeunload to prevent "Leave site?" prompt during OAuth redirect
      navigationFlag.suppress = true;
      // OAuth is stateful and must start on the canonical auth domain; hand
      // the flow over (keeping the /resume-builder destination) when on a
      // public/SEO host. auto=google continues the click there.
      if (typeof window !== 'undefined' && shouldTransitionAuthHost(window.location.hostname)) {
        window.location.href = buildCanonicalLoginUrl(
          '/login',
          { returnUrl: '/resume-builder' },
          { autoGoogle: true }
        );
        return;
      }
      await signIn('google', {
        callbackUrl: `/login?returnUrl=${encodeURIComponent('/resume-builder')}`,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      navigationFlag.suppress = false;
      setSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            You&apos;ll lose your changes
          </DialogTitle>
          <DialogDescription>
            Sign in with Google to save your resume to your account, or continue without saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {signingIn ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {signingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <button
            onClick={onDiscard}
            className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Continue without saving
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
