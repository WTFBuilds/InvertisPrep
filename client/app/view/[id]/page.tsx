'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { pdfApi } from '@/lib/api';
import PDFViewer from '@/components/PDFViewer';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ViewPDFContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const type = (searchParams.get('type') as 'pyq' | 'syllabus') || 'pyq';

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        const blob = await pdfApi.view(id, type);
        setPdfBlob(blob);
      } catch (err: any) {
        console.error('Error fetching PDF:', err);
        setError(err.response?.data?.message || 'Failed to load document. Please make sure you are logged in.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPDF();
    }
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-500" />
        <p className="text-lg font-medium">Preparing protected viewer...</p>
        <p className="text-slate-400 text-sm mt-2">Fetching document and applying security watermarks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.back()} variant="outline" className="text-white border-white/20 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {pdfBlob && <PDFViewer file={pdfBlob} />}
    </div>
  );
}

export default function ViewPDFPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-500" />
        <p className="text-lg font-medium">Initializing viewer...</p>
      </div>
    }>
      <ViewPDFContent />
    </Suspense>
  );
}
