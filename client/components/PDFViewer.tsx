'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, Share2, Check, Download, ShieldCheck, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spotlight } from '@/components/ui/spotlight';
import { pdfApi } from '@/lib/api';
import { pyqApi } from '@/lib/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker (client-side only to avoid SSR issues in Next.js)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  file: Blob | string;
  id?: string;
  type?: 'pyq' | 'syllabus';
}

export default function PDFViewer({ file, id, type }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsiveness
  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(onResize);
    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [onResize]);

  useEffect(() => {
    if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(file);
    }
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  // Prevent right-click and common shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+P, Ctrl+S, Ctrl+U
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keyboard navigation: ←/→ pages, +/− zoom, R or 0 reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'ArrowRight':
          setPageNumber(prev => Math.min(prev + 1, numPages || prev));
          break;
        case 'ArrowLeft':
          setPageNumber(prev => Math.max(prev - 1, 1));
          break;
        case '+': case '=':
          setScale(prev => Math.min(prev + 0.2, 3.0));
          break;
        case '-': case '_':
          setScale(prev => Math.max(prev - 0.2, 0.4));
          break;
        case 'r': case 'R': case '0':
          setScale(1.0);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages]);

  const handleDownload = async () => {
    if (!id || downloading) return;
    try {
      setDownloading(true);
      // Track download for PYQ papers
      if (type === 'pyq') {
        pyqApi.trackDownload(id).catch(() => {});
      }
      const result = await pdfApi.download(id, type || 'pyq');
      // Robust to both old server (raw Blob) and new (Blob + filename)
      const blob = result instanceof Blob ? result : result.blob;
      const filename = result instanceof Blob ? 'paper.pdf' : result.filename;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 min-h-screen select-text relative" ref={containerRef}>
      {/* Toolbar - Sticky and Adaptive */}
      <div className="sticky top-0 z-20 w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-xl">
        <div className="relative overflow-hidden">
          {/* Aceternity ambient glow behind the toolbar */}
          <Spotlight
            className="absolute inset-0"
            gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 50.11%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 50.11%)"
            gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 50%)"
          />
          <div className="relative flex flex-col items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
            {/* Left: status label (desktop) */}
            <div className="hidden items-center sm:flex">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                Protected View
              </span>
            </div>

            {/* Center: page navigation */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
                title="Previous page"
                className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex min-w-[84px] items-center justify-center gap-1 rounded-lg bg-slate-950/50 px-3 py-1 text-sm font-bold tabular-nums text-white">
                <span>{pageNumber}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300">{numPages ?? '--'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
                disabled={numPages === null || pageNumber >= numPages}
                title="Next page"
                className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Right: viewer controls */}
            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale(prev => Math.max(prev - 0.2, 0.4))}
                  title="Zoom out"
                  className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[44px] text-center text-xs font-bold tabular-nums text-white">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale(prev => Math.min(prev + 0.2, 3.0))}
                  title="Zoom in"
                  className="h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(1.0)}
                className="hidden h-9 rounded-full border-white/15 bg-white/5 text-[11px] font-semibold text-white hover:bg-white/15 hover:text-white sm:flex"
              >
                Reset
              </Button>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={downloading || !id}
                title="Download PDF"
                className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-40"
              >
                {downloading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Share paper link"
                className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </Button>
              {copied && (
                <span className="text-[11px] font-medium text-emerald-400 select-none pointer-events-none">Copied!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="relative flex-1 w-full flex justify-center overflow-auto py-6 px-2 sm:px-4">
        {/* Ambient glow behind the page */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(700px 420px at 15% 100%, rgba(139,92,246,0.06) 0%, transparent 55%), radial-gradient(700px 420px at 85% 100%, rgba(56,189,248,0.05) 0%, transparent 55%)',
          }}
        />
        <div className="relative shadow-2xl border border-slate-700 rounded-sm sm:rounded-lg overflow-hidden bg-white h-fit">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-slate-400">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mb-4" />
                <p className="text-sm sm:text-base">Loading document...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-red-400">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 mb-4" />
                <p className="text-sm sm:text-base">Failed to load PDF</p>
              </div>
            }
          >
            <div key={pageNumber} className="pdf-page-anim min-w-0">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                width={containerWidth ? Math.min(containerWidth - 32, 1200) : undefined}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                loading={<PageLoader />}
                className="max-w-full"
              />
            </div>
          </Document>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative w-full bg-slate-900/90 py-4 px-4 border-t border-white/5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2 text-center">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <ShieldCheck className="h-3 w-3 text-indigo-400" />
            Protected document — unauthorized distribution or reproduction is prohibited
          </p>
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Keyboard className="h-3 w-3" />
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">←</kbd>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">→</kbd>
            pages
            <span className="text-slate-600">·</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">+</kbd>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">−</kbd>
            zoom
            <span className="text-slate-600">·</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">R</kbd>
            reset
          </p>
        </div>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center bg-slate-50 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm">Rendering page…</p>
    </div>
  );
}
