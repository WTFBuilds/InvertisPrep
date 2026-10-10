'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { pdfApi } from '@/lib/api';
import { InstagramFollowGate, isUnlocked } from '@/components/instagram-follow-gate';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// pdfjs touches browser-only globals (DOMMatrix) at module scope, so the viewer
// must never evaluate during SSR — load it client-side only.
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false });

function LoadingScreen({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 420px at 50% 30%, rgba(99,102,241,0.14) 0%, transparent 60%), radial-gradient(500px 320px at 82% 78%, rgba(139,92,246,0.10) 0%, transparent 55%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-500/25 blur-2xl" />
          <Loader2 className="relative h-11 w-11 animate-spin text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight">{label}</p>
          {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function ViewPDFContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = params.id as string;
  const type = (searchParams.get('type') as 'pyq' | 'syllabus') || 'pyq';

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Instagram follow gate — shown once per user before a PYQ paper is fetched.
  // Syllabus documents and staff accounts skip it entirely.
  const [unlocked, setUnlocked] = useState(false);
  const gateRequired =
    type === 'pyq' &&
    !!user &&
    user.role !== 'admin' &&
    user.role !== 'super-admin' &&
    user.role !== 'srt' &&
    user.role !== 'staff';

  // Pre-existing unlock (or no gate needed) → proceed without showing the gate.
  useEffect(() => {
    if (!user) return;
    if (!gateRequired || isUnlocked(user.id)) setUnlocked(true);
  }, [user, gateRequired]);

  // Authentication Check
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if not authenticated
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchPDF = async () => {
      // Don't fetch if still checking auth or not logged in
      if (authLoading || !user) return;
      // Hold the document until the Instagram gate is confirmed.
      if (!unlocked) return;

      try {
        setLoading(true);
        const blob = await pdfApi.view(id, type);
        setPdfBlob(blob);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching PDF:', err);

        let errorMessage = 'Failed to load document.';

        // Handle Blob error responses (when responseType is 'blob')
        if (err.response?.data instanceof Blob && err.response.data.type === 'application/json') {
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing blob error JSON:', e);
          }
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        if (err.response?.status === 401) {
          errorMessage += ' Please make sure you are logged in.';
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPDF();
    }
  }, [id, type, authLoading, user, unlocked]);

  // Direct-URL access to a paper also goes through the gate; it renders as a
  // popup over the loading backdrop (the document isn't fetched until unlock).
  const showGate = Boolean(user && gateRequired && !unlocked);

  if (loading && !showGate) {
    return (
      <LoadingScreen
        label="Preparing protected viewer…"
        sub="Fetching document and applying security watermarks"
      />
    );
  }

  if (error) {
    const isAuthError = error.toLowerCase().includes('log in') || error.toLowerCase().includes('session');

    return (
      <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-slate-950 p-4 text-white">
        {/* Ambient red glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(600px 420px at 50% 35%, rgba(244,63,94,0.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{error}</p>

          <div className="mt-6 flex flex-col gap-3">
            {isAuthError ? (
              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In Again
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Try Again
              </Button>
            )}
            <Button onClick={() => router.back()} variant="outline" className="w-full border-white/15 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 text-left overflow-hidden">
              <p className="font-mono truncate">ID: {id}</p>
              <p className="font-mono">User: {user ? user.email : 'None'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {pdfBlob && <PDFViewer file={pdfBlob} id={id} type={type} />}
      {showGate && (
        <InstagramFollowGate
          open
          userId={user?.id}
          onUnlocked={() => setUnlocked(true)}
          onClose={() => router.back()}
        />
      )}
    </div>
  );
}

export default function ViewPDFPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Initializing viewer…" />}>
      <ViewPDFContent />
    </Suspense>
  );
}
