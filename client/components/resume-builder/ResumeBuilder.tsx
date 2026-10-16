'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi, walletApi, aiApi } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import type {
  Resume,
  ResumeDraft,
  ResumeEducation,
  ResumeExperience,
  ResumeLink,
  ResumeProject,
  RazorpayCheckoutSuccess,
  RazorpayCheckoutError,
} from '@/types';
import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import { CheckCircle2, Clock, Coins, CreditCard, Download, FileUp, Gift, LayoutDashboard, Loader2, Lock, Plus, Printer, RotateCcw, Save, Shield, Sparkles, Trash2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spotlight } from '@/components/ui/spotlight';
import { SavePromptModal } from './SavePromptModal';
import { ResizablePanels } from './ResizablePanels';
import { AIPanel } from './AIPanel';

let razorpayScriptPromise: Promise<boolean> | null = null;
const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
};

const emptyEducation = (): ResumeEducation => ({ institution: '', degree: '', startDate: '', endDate: '' });
const emptyExperience = (): ResumeExperience => ({ company: '', role: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyProject = (): ResumeProject => ({ name: '', url: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyLink = (): ResumeLink => ({ label: '', url: '' });

export function createStarterResume(forUser?: { name?: string; email?: string; phoneNumber?: string } | null): ResumeDraft {
  const userName = forUser?.name?.trim() || 'Ahqaf Ali';
  const userEmail = forUser?.email?.trim() || 'beddylea@gmail.com';
  const userPhone = forUser?.phoneNumber?.trim() || '+1-555-0100';
  return {
    title: 'ATS Friendly Resume',
    personal: {
      name: userName,
      headline: 'Developer',
      email: userEmail,
      phone: userPhone,
      location: 'San Francisco, CA',
      links: [
        { label: 'GitHub', url: 'github.com/ahqafcoder' },
        { label: 'LinkedIn', url: 'linkedin.com/in/bedivere-lea' },
        { label: 'Instagram', url: 'instagram.com/ahqafali0403' },
      ],
    },
    summary: 'Resourceful Developer with 11 years of experience in designing and developing user interfaces, testing and training employees. Skilled at utilizing a wide variety of tools and programs to provide effective applications.',
    education: [
      { institution: 'New York University', degree: 'Bachelor of Computer Science', startDate: '2020-08', endDate: '2024-07' },
    ],
    experience: [
      { company: 'Torph TTC', role: 'Developer', description: 'Torph TTC is a global software company that offers user interface UI development tools and components for a range of developer applications across all platforms.', achievements: ['Created and maintained 10 web applications for numerous national and foreign clients.', 'Ensured user interfaces and user experience met at least 80% of users expectations.', 'Created and analyzed 500 unit test cases.', "Developed Python scripts to automate image noise-reduction, improving research analysis time by 40%.", 'Established and led a team of 10 people, covering every key role in the early stages.'], startDate: '2023-02', endDate: '2023-02' },
      { company: 'Reilty Group', role: 'Front End Web Developer', description: 'Reilty Group is an industry-leading provider of online gambling software and solutions.', achievements: ['Increased the reach of users to the platform by 35% through mobile web installation.', 'Delivered 30 web solutions.', 'Replaced one full-time developer with part-time employment, achieving over 60% productivity gain.', 'Worked with more than four teams and provided end-to-end client solutions.'], startDate: '2023-02', endDate: '2023-03' },
      { company: 'HellX', role: 'Python Developer', description: 'Heller is a software editor specialized in logistics management.', achievements: ['Developed automation systems that saved over $50,000 annually.', 'Joined as the tenth employee and worked directly with major customers.', 'Delivered ahead of schedule, reducing project cost by 20%.', 'Reduced database size by nearly 50% and improved performance by 20%.', 'Reduced delivery time of goods by 50%.'], startDate: '2023-02', endDate: '2023-03' },
    ],
    projects: [],
    skillGroups: [
      { title: 'Technical Skills', items: ['JavaScript', 'Python', 'Web Services', 'C++', 'HTML5', 'CSS', 'SQL', 'User Interface', 'Creativity'] },
      { title: 'Soft Skills', items: ['Collaboration', 'Problem-solving', 'Communication', 'Time management', 'Result-oriented'] },
      { title: 'Additional Skills', items: ['Public Speaking', 'Writing', 'Research'] },
    ],
    achievements: [
      'Winner - Smart India Hackathon (SIH) 2025 | December 2025',
      'Technical Designer Award - Fashion Show | May 2026',
    ],
    languages: ['English', 'Hindi'],
    certifications: ['Certified Web Professional-Web Developer', 'Java Development Certified Professional'],
  };
}

// safeResume — lightweight structural safety pass for EXISTING saved resumes.
// Only ensures arrays are arrays and objects are objects. Never injects template content.
function safeResume(resume: Resume, forUser?: { name?: string; email?: string; phoneNumber?: string } | null): Resume {
  // Migrate old generic template data that was seeded before the builder was live
  const isPreviousGenericTemplate =
    resume.title === 'Ahqaf Ali - Full Stack Developer' ||
    resume.summary?.startsWith('Motivated student and aspiring software developer') ||
    resume.projects?.some((project) => project.name === 'Student Portfolio Website');
  if (isPreviousGenericTemplate) {
    // Replace old generic template with the current starter so users get the new template
    return { ...resume, ...createStarterResume(forUser) };
  }

  const personal = resume.personal ?? { name: '', headline: '', email: '', phone: '', location: '', links: [] };
  return {
    ...resume,
    title: resume.title ?? '',
    personal: {
      name: personal.name || forUser?.name || '',
      headline: personal.headline ?? '',
      email: personal.email || forUser?.email || '',
      phone: personal.phone || forUser?.phoneNumber || '',
      location: personal.location ?? '',
      links: Array.isArray(personal.links)
        ? personal.links.map((link) => ({ ...emptyLink(), ...link }))
        : [],
    },
    summary: resume.summary ?? '',
    education: Array.isArray(resume.education)
      ? resume.education.map((item) => ({ ...emptyEducation(), ...item }))
      : [],
    experience: Array.isArray(resume.experience)
      ? resume.experience.map((item) => ({
          ...emptyExperience(), ...item,
          achievements: Array.isArray(item.achievements) ? item.achievements : [],
        }))
      : [],
    projects: Array.isArray(resume.projects)
      ? resume.projects.map((item) => ({
          ...emptyProject(), ...item,
          achievements: Array.isArray(item.achievements) ? item.achievements : [],
        }))
      : [],
    skillGroups: Array.isArray(resume.skillGroups)
      ? resume.skillGroups.map((group) => ({
          ...group,
          title: group.title ?? '',
          items: Array.isArray(group.items) ? group.items : [],
        }))
      : [],
    achievements: Array.isArray(resume.achievements) ? resume.achievements : [],
    languages: Array.isArray(resume.languages) ? resume.languages : [],
    certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
  };
}

function toDraft(resume: Resume): ResumeDraft {
  return {
    title: resume.title,
    personal: resume.personal,
    summary: resume.summary,
    education: resume.education,
    experience: resume.experience,
    projects: resume.projects,
    skillGroups: resume.skillGroups,
    achievements: resume.achievements,
    languages: resume.languages,
    certifications: resume.certifications,
  };
}

function safeName(value: string) {
  return (value || 'resume').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function formatDate(value: string) {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!month) return year;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Global flag to suppress beforeunload during OAuth redirect
export const navigationFlag = { suppress: false };

// Minimal localStorage helper — only used to stash draft before OAuth redirect
const GUEST_RESUME_KEY = 'resume-builder-guest-draft';
function stashGuestResume(draft: ResumeDraft): void {
  try { localStorage.setItem(GUEST_RESUME_KEY, JSON.stringify(draft)); } catch { /* noop */ }
}
export function clearGuestResume(): void {
  localStorage.removeItem(GUEST_RESUME_KEY);
}

export function ResumeBuilder() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resume, setResume] = useState<Resume | null>(null);
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);

  // Save prompt modal state for guest users (declared early for beforeunload guard)
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Task 3: dirty flag + saved timestamp for autosave indicator
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const firstAutosaveToastShown = useRef(false);

  // Task 1: track which id is already loaded to avoid redundant fetches
  const loadedIdRef = useRef<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Guest mode: allow access without login
  // Auth redirect removed to support guest resume building

  // Task 1: id-keyed load effect — re-runs whenever ?id changes
  const idParam = searchParams.get('id');

  // Unified resume loader — handles both guests and authenticated users cleanly
  // without race conditions, cancel loops, or refresh dependencies.
  useEffect(() => {
    if (loading) return; // Wait until AuthContext finishes checking session

    let cancelled = false;

    // ── Guest Mode (not logged in) ───────────────────────────────────
    if (!user) {
      if (loadedIdRef.current && loadedIdRef.current.startsWith('guest-')) {
        // Guest draft already loaded in memory
        return;
      }
      setBooting(true);
      const starter = createStarterResume(null);
      const guestResume: Resume = {
        ...starter,
        _id: `guest-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setResume(guestResume);
      loadedIdRef.current = guestResume._id;
      setIsDirty(false);
      setSavedAt(null);
      setBooting(false);
      return;
    }

    // ── Logged-in User ───────────────────────────────────────────────
    // If the exact requested resume is already in state, do nothing
    if (idParam && loadedIdRef.current === idParam && resume && resume._id === idParam) {
      return;
    }

    setBooting(true);

    const load = async () => {
      try {
        let activeResume: Resume | null = null;

        if (idParam) {
          // Explicit ?id in URL — fetch this specific document
          const result = await resumeApi.get(idParam);
          if (cancelled) return;
          if (result.data) {
            activeResume = result.data;
          }
        }

        // If no ?id provided or id was invalid, look up existing resumes
        if (!activeResume) {
          const list = await resumeApi.list();
          if (cancelled) return;
          if (list.data && list.data.length > 0) {
            activeResume = list.data[0];
          } else {
            // First time user — create initial resume pre-populated with user details
            const starter = createStarterResume(user);
            const created = await resumeApi.create(starter);
            if (cancelled) return;
            if (created.data) {
              activeResume = created.data;
            }
          }
        }

        if (cancelled) return;

        if (activeResume) {
          const sanitized = safeResume(activeResume, user);
          setResume(sanitized);
          loadedIdRef.current = sanitized._id;
          setIsDirty(false);
          setSavedAt(null);

          // Keep browser URL synchronized without triggering a page reload/unmount cycle
          if (typeof window !== 'undefined' && window.location.search !== `?id=${sanitized._id}`) {
            const newUrl = `${window.location.pathname}?id=${sanitized._id}`;
            window.history.replaceState(null, '', newUrl);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ResumeBuilder] Failed to load resume:', err);
          toast.error('Could not load your resume. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [loading, user, idParam]);

  // Task 3: debounced autosave — fires 2s after last edit when isDirty (logged-in only)
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback(async (draft = resume, isAuto = false) => {
    if (!draft) return;

    // Guest: show login prompt instead of saving
    if (!user) {
      if (!isAuto) setShowSavePrompt(true);
      return;
    }

    // Logged-in: save to server
    setSaving(true);
    try {
      await resumeApi.update(draft._id, toDraft(draft));
      setIsDirty(false);
      setSavedAt(new Date());
      if (!isAuto) toast.success('Resume saved');
      if (isAuto && !firstAutosaveToastShown.current) {
        firstAutosaveToastShown.current = true;
        toast.success('Resume autosaved');
      }
    } catch {
      toast.error('Could not save the resume');
    } finally {
      setSaving(false);
    }
  }, [resume, user]);

  useEffect(() => {
    if (booting || !isDirty || !resume || !user) return; // No autosave for guests
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => { void save(resume, true); }, 2000);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [resume, isDirty, booting, save, user]);

  // Task 4: beforeunload guard — warn when there are unsaved changes
  // Skip when SavePromptModal is open (user is about to sign in)
  useEffect(() => {
    if (!isDirty || showSavePrompt) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (navigationFlag.suppress) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, showSavePrompt]);

  // Navigation guard for guest users with unsaved changes
  // Note: Next.js App Router doesn't support router.events, so we handle navigation
  // through Link click handlers and beforeunload events instead

  // Mark dirty on every edit
  const update = (patch: Partial<Resume>) => {
    setResume((current) => current ? { ...current, ...patch } : current);
    setIsDirty(true);
  };
  const updatePersonal = (patch: Partial<Resume['personal']>) => {
    setResume((current) => current ? { ...current, personal: { ...current.personal, ...patch } } : current);
    setIsDirty(true);
  };

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState<'free' | 'coins' | 'razorpay' | 'watermark' | null>(null);

  // Generate a real PDF file (not just print dialog) using html-to-image + jspdf.
  // Captures EXCLUSIVELY the in-DOM .resume-page document at 2x resolution,
  // without any preview wrapper, toasts, modals, or scale artifacts.
  const generateResumePDF = async (fileName: string, includeWatermark: boolean) => {
    const page = document.querySelector('.resume-page') as HTMLElement | null;
    const previewWrap = document.querySelector('.resume-preview-wrap') as HTMLElement | null;
    if (!page) {
      toast.error('Resume document not found.');
      return false;
    }

    const toastId = toast.loading(includeWatermark ? 'Generating watermarked PDF...' : 'Generating watermark-free PDF...');

    // Save scroll position of the preview wrapper so capture starts at top
    const prevScrollTop = previewWrap ? previewWrap.scrollTop : 0;
    if (previewWrap) previewWrap.scrollTop = 0;

    // Save original styles to restore after capture
    const prevTransform = page.style.transform;
    const prevOrigin = page.style.transformOrigin;
    const prevShadow = page.style.boxShadow;

    // Watermark nodes inside the resume
    const previewWatermark = page.querySelector('.resume-preview-watermark') as HTMLElement | null;
    const centerWatermark = page.querySelector('.resume-pdf-watermark-overlay') as HTMLElement | null;
    const footerWatermark = page.querySelector('.resume-watermark') as HTMLElement | null;

    const prevPwDisplay = previewWatermark?.style.display;
    const prevCwDisplay = centerWatermark?.style.display;
    const prevFwDisplay = footerWatermark?.style.display;

    // Watermark configuration:
    // If includeWatermark === true: show bold center diagonal watermark + footer
    // If includeWatermark === false: hide ALL watermarks completely
    if (previewWatermark) previewWatermark.style.display = 'none';

    if (includeWatermark) {
      if (centerWatermark) centerWatermark.style.display = 'flex';
      if (footerWatermark) footerWatermark.style.display = 'block';
    } else {
      if (centerWatermark) centerWatermark.style.display = 'none';
      if (footerWatermark) footerWatermark.style.display = 'none';
    }

    // Reset transform so toCanvas captures full-res 794px A4 dimensions without scale blur
    page.style.transform = 'none';
    page.style.boxShadow = 'none';

    try {
      // Small pause for layout reflow
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await toCanvas(page, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth(); // 210mm
      const pageH = pdf.internal.pageSize.getHeight(); // 297mm

      const pxPerMm = canvas.width / pageW;
      const pageCanvasH = Math.floor(pageH * pxPerMm);

      const totalH = canvas.height;
      let rendered = 0;
      let isFirstPage = true;

      while (rendered < totalH) {
        const sliceH = Math.min(pageCanvasH, totalH - rendered);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, rendered, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.98);
        const sliceMm = sliceH / pxPerMm;

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(sliceData, 'JPEG', 0, 0, pageW, sliceMm);
        isFirstPage = false;
        rendered += sliceH;
      }

      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
      toast.dismiss(toastId);
      return true;
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.dismiss(toastId);
      toast.error('Could not generate PDF file.');
      return false;
    } finally {
      // Always restore original styles and scroll position
      page.style.transform = prevTransform;
      page.style.transformOrigin = prevOrigin;
      page.style.boxShadow = prevShadow;
      if (previewWatermark) previewWatermark.style.display = prevPwDisplay ?? '';
      if (centerWatermark) centerWatermark.style.display = prevCwDisplay ?? '';
      if (footerWatermark) footerWatermark.style.display = prevFwDisplay ?? '';
      if (previewWrap) previewWrap.scrollTop = prevScrollTop;
    }
  };

  const handleDownload = async (method: 'free' | 'coins' | 'razorpay' | 'watermark') => {
    if (method === 'watermark') {
      setShowDownloadModal(false);
      if (!resume) return;
      const success = await generateResumePDF(`${safeName(resume.title)}-watermarked.pdf`, true);
      if (success) toast.success('Watermarked PDF downloaded.');
      return;
    }
    if (!resume) return;
    setDownloading(method);
    try {
      const isSuperAdmin = user?.role === 'super-admin';
      const spendMethod = isSuperAdmin ? 'free' : (method === 'razorpay' ? 'pass' : method);
      const res = await walletApi.spendDownload(resume._id, spendMethod);
      if (res.success && res.data) {
        if (!isSuperAdmin) {
          updateUser({
            ...user!,
            qcoins: res.data.qcoins,
            freeDownloadsLeft: res.data.freeDownloadsLeft,
            downloadPasses: res.data.downloadPasses,
          });
        }
        setShowDownloadModal(false);
        const success = await generateResumePDF(`${safeName(resume.title)}.pdf`, false);
        if (success) {
          toast.success(isSuperAdmin ? 'Clean PDF downloaded (Super Admin unlimited).' : 'Watermark-free PDF downloaded.');
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Download failed';
      toast.error(msg);
    } finally {
      setDownloading(null);
    }
  };

  const payPass = async () => {
    if (!user || !resume || downloading !== null) return;
    setDownloading('razorpay');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load the payment gateway. Check your connection and try again.');
        return;
      }

      const res = await walletApi.createResumePassOrder();
      if (!res.success || !res.data) {
        toast.error(res.message ?? 'Could not start checkout');
        return;
      }
      const order = res.data;

      const checkout = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'InvertisPrep',
        description: 'Resume PDF pass — 1 watermark-free download',
        image: '/invlogo.png',
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phoneNumber ?? '' },
        theme: { color: '#0f172a' },
        handler: (response) => {
          void (async () => {
            try {
              const verifyRes = await walletApi.verifyTopup(response);
              if (verifyRes.success && verifyRes.data) {
                // Pass credited server-side; now atomically spend it for this download
                const spendRes = await walletApi.spendDownload(resume._id, 'pass');
                const updatedBalance = spendRes.success && spendRes.data ? spendRes.data : verifyRes.data;
                updateUser({
                  ...user,
                  qcoins: updatedBalance.qcoins,
                  freeDownloadsLeft: updatedBalance.freeDownloadsLeft,
                  downloadPasses: updatedBalance.downloadPasses,
                });
                setShowDownloadModal(false);
                toast.success('Payment verified — watermark-free PDF ready!');
                const success = await generateResumePDF(`${safeName(resume.title)}.pdf`, false);
                if (success) toast.success('Resume PDF downloaded.');
              } else {
                toast.error(verifyRes.message ?? 'Payment succeeded but verification failed — contact support.');
              }
            } catch {
              toast.error('Payment succeeded but verification failed — contact support.');
            }
          })();
        },
        modal: {
          ondismiss: () => toast.info('Checkout closed — you were not charged'),
        },
      });

      checkout.on('payment.failed', (resp) => {
        toast.error(resp.error?.description ?? 'Payment failed. You were not charged.');
      });

      checkout.open();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setDownloading(null);
    }
  };

  const exportJson = () => {    if (!resume) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(toDraft(resume), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName(resume.title)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !resume) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported.personal || !Array.isArray(imported.education) || !Array.isArray(imported.skillGroups)) throw new Error();
        setResume(safeResume({ ...resume, ...imported, _id: resume._id, createdAt: resume.createdAt, updatedAt: resume.updatedAt }));
        setIsDirty(true);
        toast.success('Resume data imported. Click Save to keep it.');
      } catch {
        toast.error('This is not a valid InvertisPrep resume file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (loading || booting || !resume) {
    return <div className="min-h-[70vh] grid place-items-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;
  }

  // Task 3: save status indicator label
  const SaveStatus = () => {
    if (!user && isDirty) {
      return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Clock size={12}/> Not saved — <button onClick={() => setShowSavePrompt(true)} className="underline">Sign in</button></span>;
    }
    if (saving) return <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 className="animate-spin" size={12}/> Saving…</span>;
    if (!isDirty && savedAt) return <span className="flex items-center gap-1 text-xs text-slate-400"><CheckCircle2 size={12} className="text-green-500"/> Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
    if (!isDirty && !savedAt) return <span className="flex items-center gap-1 text-xs text-slate-400"><CheckCircle2 size={12} className="text-green-500"/> All changes saved</span>;
    return <span className="flex items-center gap-1 text-xs text-amber-500"><Clock size={12}/> Unsaved changes</span>;
  };

  return (
    <div className="bg-slate-100 h-screen flex flex-col overflow-hidden resume-builder-shell">
      {/* Pinned Top Bar — fixed at top, never scrolls */}
      <header className="no-print shrink-0 border-b border-slate-200 bg-white px-3 py-2 sm:px-5 sm:py-2.5 shadow-2xs z-30">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">ATS Resume Builder</h1>
            <p className="hidden sm:block text-[11px] text-slate-500">Clean single-column layout designed for ATS readability</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <SaveStatus />
            <Link
              className="resume-tool hidden md:inline-flex"
              href="/resumes"
              onClick={(e) => {
                if (!user && isDirty) {
                  e.preventDefault();
                  setPendingNavigation('/resumes');
                  setShowSavePrompt(true);
                }
              }}
            >
              <LayoutDashboard size={15}/> My resumes
            </Link>
            <button className="resume-tool hidden sm:inline-flex" onClick={() => importRef.current?.click()} title="Import JSON"><FileUp size={15}/> Import</button>
            <button className="resume-tool hidden sm:inline-flex" onClick={exportJson} title="Export JSON"><Download size={15}/> Export</button>
            <button className="resume-tool" onClick={() => {
              if (!user) {
                setShowSavePrompt(true);
              } else {
                setShowDownloadModal(true);
              }
            }}><Printer size={15}/> <span className="hidden xs:inline">PDF</span></button>
            <button className="resume-tool-primary" disabled={saving} onClick={() => save(resume, false)}>
              {saving ? <Loader2 className="animate-spin" size={15}/> : <Save size={15}/>} <span className="hidden xs:inline">Save</span>
            </button>
            <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </div>
      </header>

      {/* 3-Panel Resizable Workspace — fills remaining height, each column scrolls independently */}
      <main className="flex-1 min-h-0 overflow-hidden p-1.5 sm:p-2">
        <ResizablePanels
          left={
            <AIPanel
              resume={resume}
              update={update}
              updatePersonal={updatePersonal}
            />
          }
          center={
            <ResumeEditor
              resume={resume}
              update={update}
              updatePersonal={updatePersonal}
            />
          }
          right={<ResumePreview resume={resume} />}
        />
      </main>
      <DownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        qcoins={user?.qcoins ?? 0}
        freeDownloadsLeft={user?.freeDownloadsLeft ?? 0}
        downloadPasses={user?.downloadPasses ?? 0}
        isSuperAdmin={user?.role === 'super-admin'}
        downloading={downloading}
        onDownload={handleDownload}
        onPayPass={payPass}
      />
      <SavePromptModal
        open={showSavePrompt}
        onOpenChange={setShowSavePrompt}
        onSaveAndLogin={() => {
          // Stash draft to localStorage so login page migration can pick it up
          // Don't close the modal here — it will unmount when the page navigates
          if (resume) stashGuestResume(toDraft(resume));
        }}
        onDiscard={() => {
          // Discard changes and allow navigation
          clearGuestResume();
          setPendingNavigation(null);
          setShowSavePrompt(false);
        }}
      />
    </div>
  );
}

// ─── DownloadModal ─────────────────────────────────────────────────────────────
function DownloadModal({
  open, onClose, qcoins, freeDownloadsLeft, downloadPasses, isSuperAdmin, downloading, onDownload, onPayPass,
}: {
  open: boolean;
  onClose: () => void;
  qcoins: number;
  freeDownloadsLeft: number;
  downloadPasses: number;
  isSuperAdmin?: boolean;
  downloading: 'free' | 'coins' | 'razorpay' | 'watermark' | null;
  onDownload: (method: 'free' | 'coins' | 'razorpay' | 'watermark') => void;
  onPayPass: () => void;
}) {
  const canFree  = isSuperAdmin || freeDownloadsLeft > 0;
  const canCoins = qcoins >= 200;
  const hasPass  = downloadPasses > 0;

  const OptionButton = ({
    method, icon, title, subtitle, badge, disabled, accent,
  }: {
    method: 'free' | 'coins' | 'razorpay' | 'watermark';
    icon: React.ReactNode;
    title: string;
    subtitle: React.ReactNode;
    badge?: string;
    disabled?: boolean;
    accent?: string;
  }) => {
    const isLoading = downloading === method;
    return (
      <button
        onClick={() => !disabled && onDownload(method)}
        disabled={disabled || downloading !== null}
        className={`group relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
          ${disabled
            ? 'border-slate-100 bg-slate-50'
            : accent === 'indigo'
              ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'
              : accent === 'emerald'
                ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm'
                : accent === 'purple'
                  ? 'border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
          ${accent === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
            accent === 'indigo'  ? 'bg-indigo-100 text-indigo-600' :
            accent === 'purple'  ? 'bg-purple-100 text-purple-600' :
            'bg-slate-100 text-slate-500'}`}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 text-sm">{title}</p>
            {badge && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {!disabled && downloading === null && (
          <Download className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Printer className="h-5 w-5 text-indigo-600" />
            Download PDF
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to download your resume.
          </DialogDescription>
        </DialogHeader>

        {/* balance pill / super admin badge */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Super Admin Access — Unlimited watermark-free downloads unlocked.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
            <Coins className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-slate-700">{qcoins.toLocaleString('en-IN')} QCoins</span>
            <span className="mx-1 text-slate-300">·</span>
            <Gift className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-slate-700">{freeDownloadsLeft} free download{freeDownloadsLeft !== 1 ? 's' : ''} left</span>
            {downloadPasses > 0 && (
              <>
                <span className="mx-1 text-slate-300">·</span>
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-slate-700">{downloadPasses} pass{downloadPasses !== 1 ? 'es' : ''}</span>
              </>
            )}
            <Link href="/wallet" className="ml-auto flex items-center gap-1 text-indigo-600 hover:underline font-medium">
              <Wallet className="h-3 w-3" /> Top up
            </Link>
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Watermark-free</p>

        <div className="space-y-2">
          {isSuperAdmin ? (
            <OptionButton
              method="free"
              icon={<Gift className="h-5 w-5" />}
              title="Download Watermark-Free PDF"
              subtitle="Unlimited Super Admin privilege — high resolution A4 PDF with no watermark."
              badge="UNLIMITED"
              accent="emerald"
            />
          ) : (
            <>
              <OptionButton
                method="free"
                icon={<Gift className="h-5 w-5" />}
                title={`Use free trial ${canFree ? `(${freeDownloadsLeft} remaining)` : '(none left)'}`}
                subtitle="Download a clean, watermark-free PDF — no coins needed."
                badge={canFree ? 'FREE' : undefined}
                disabled={!canFree}
                accent="emerald"
              />
              <OptionButton
                method="coins"
                icon={<Coins className="h-5 w-5" />}
                title={`Spend 200 QCoins ${!canCoins ? `(need ${200 - qcoins} more)` : ''}`}
                subtitle={`You have ${qcoins.toLocaleString('en-IN')} QCoins. Each watermark-free download costs 200 QC.`}
                disabled={!canCoins}
                accent="indigo"
              />
              {hasPass ? (
                <OptionButton
                  method="razorpay"
                  icon={<CreditCard className="h-5 w-5" />}
                  title={`Use paid pass (${downloadPasses} left)`}
                  subtitle="You already bought a ₹19.99 pass — this download is watermark-free."
                  accent="purple"
                />
              ) : (
                <button
                  onClick={onPayPass}
                  disabled={downloading !== null}
                  className="group relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">Pay ₹19.99</p>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">BEST VALUE</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="line-through text-slate-400">₹99.99</span>{' '}
                      <span className="font-bold text-rose-500">₹19.99</span> — one watermark-free download via UPI · cards · netbanking.
                    </p>
                  </div>
                  {downloading === null && (
                    <Download className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <div className="relative my-1 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <OptionButton
          method="watermark"
          icon={<Sparkles className="h-5 w-5" />}
          title="Download with watermark"
          subtitle="Always free. The InvertisPrep watermark will be visible on the PDF."
        />

        <p className="text-center text-[11px] text-slate-400">
          <Shield className="mr-1 inline h-3 w-3" />
          Watermark-free downloads are for your personal use only.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Shared editor input styling — shadcn Input plus a clean indigo focus ring
const inputClass = 'bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-100';
const textareaClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

function RephraseButton({
  text,
  field,
  onRephrased,
}: {
  text: string;
  field: string;
  onRephrased: (newText: string) => void;
}) {
  const { user } = useAuth();
  const canUseAI = hasPermission(user, 'ai.resume');
  const [loading, setLoading] = useState(false);
  const [lastUndo, setLastUndo] = useState<string | null>(null);

  const handleClick = async () => {
    if (!canUseAI) {
      toast.info('AI Rephrase requires an authorized role. You can edit directly in the text box.');
      return;
    }
    if (!text || !text.trim()) {
      toast.error('Write some text first to rephrase.');
      return;
    }

    setLoading(true);
    try {
      const res = await aiApi.rephrase(text, field);
      if (res.success && res.data?.text) {
        setLastUndo(text);
        onRephrased(res.data.text);
        toast.success('Text rephrased! Click Undo if you prefer the original.');
      } else {
        toast.error(res.message ?? 'Could not rephrase text.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'AI rephrase failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (lastUndo !== null) {
      onRephrased(lastUndo);
      setLastUndo(null);
      toast.info('Restored original text');
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {lastUndo !== null && (
        <button
          type="button"
          onClick={handleUndo}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition"
          title="Restore original text"
        >
          <RotateCcw size={10} /> Undo
        </button>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition shadow-2xs ${
          canUseAI
            ? 'border-indigo-200/80 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
        }`}
        title={canUseAI ? "Rephrase professionally with AI" : "AI Rephrase requires an authorized role"}
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin text-indigo-600" />
        ) : canUseAI ? (
          <Sparkles size={11} className="text-indigo-500" />
        ) : (
          <Lock size={10} className="text-slate-400" />
        )}
        <span>Rephrase</span>
      </button>
    </div>
  );
}

function ResumeEditor({ resume, update, updatePersonal }: { resume: Resume; update: (patch: Partial<Resume>) => void; updatePersonal: (patch: Partial<Resume['personal']>) => void }) {
  const setArray = <K extends 'education' | 'experience' | 'projects' | 'skillGroups' | 'achievements' | 'languages' | 'certifications'>(key: K, value: Resume[K]) => update({ [key]: value } as Partial<Resume>);
  return <aside className="no-print resume-editor relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {/* top accent line */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
    <Spotlight
      className="absolute inset-0 overflow-hidden"
      gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 50.11%)"
      gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 50.11%)"
      gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 50%)"
    />
    <div className="relative p-4 sm:p-5">
      <div className="mb-5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Resume title</Label>
        <Input className={`mt-1.5 ${inputClass}`} value={resume.title} onChange={(e) => update({ title: e.target.value })} placeholder="My Resume" />
      </div>
      <EditorSection title="Personal information">
        <div className="grid gap-3 sm:grid-cols-2">
          <EditorInput label="Full name" value={resume.personal.name} onChange={(value) => updatePersonal({ name: value })} />
          <EditorInput label="Professional title" value={resume.personal.headline} onChange={(value) => updatePersonal({ headline: value })} />
          <EditorInput label="Phone" value={resume.personal.phone} onChange={(value) => updatePersonal({ phone: value })} />
          <EditorInput label="Email" type="email" value={resume.personal.email} onChange={(value) => updatePersonal({ email: value })} />
          <EditorInput label="Location" value={resume.personal.location} onChange={(value) => updatePersonal({ location: value })} />
        </div>
      </EditorSection>
      <EditorSection title="Social links" action={() => updatePersonal({ links: [emptyLink(), ...resume.personal.links] })}>
        {resume.personal.links.map((link, index) => <div className="mb-3 grid grid-cols-[1fr_1fr_auto] items-center gap-2" key={link._id || index}>
          <Input className={inputClass} placeholder="GitHub" value={link.label} onChange={(e) => updatePersonal({ links: resume.personal.links.map((entry, i) => i === index ? { ...entry, label: e.target.value } : entry) })} />
          <Input className={inputClass} placeholder="github.com/name" value={link.url} onChange={(e) => updatePersonal({ links: resume.personal.links.map((entry, i) => i === index ? { ...entry, url: e.target.value } : entry) })} />
          <RemoveButton onClick={() => updatePersonal({ links: resume.personal.links.filter((_, i) => i !== index) })} />
        </div>)}
      </EditorSection>
      <EditorSection
        title="Summary"
        actionExtra={
          <RephraseButton
            text={resume.summary}
            field="summary"
            onRephrased={(newText) => update({ summary: newText })}
          />
        }
      >
        <textarea className={`${textareaClass} min-h-28`} value={resume.summary} onChange={(e) => update({ summary: e.target.value })} placeholder="Write a concise, achievement-focused professional summary." />
      </EditorSection>
      <EditorSection title="Education" action={() => setArray('education', [emptyEducation(), ...resume.education])}>
        {resume.education.map((item, index) => <div key={item._id || index} className="editor-card"><div className="grid gap-2 sm:grid-cols-2">
          <EditorInput compact placeholder="University / school" value={item.institution} onChange={(institution) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, institution } : entry))} />
          <EditorInput compact placeholder="Degree / course" value={item.degree} onChange={(degree) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, degree } : entry))} />
          <EditorInput compact type="month" value={item.startDate} onChange={(startDate) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, startDate } : entry))} />
          <EditorInput compact type="month" value={item.endDate} onChange={(endDate) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, endDate } : entry))} />
        </div><RemoveButton onClick={() => setArray('education', resume.education.filter((_, i) => i !== index))} /></div>)}
      </EditorSection>
      <EditorSection title="Work experience" action={() => setArray('experience', [emptyExperience(), ...resume.experience])}>
        {resume.experience.map((item, index) => <ExperienceEditor key={item._id || index} item={item} onChange={(next) => setArray('experience', resume.experience.map((entry, i) => i === index ? next : entry))} onRemove={() => setArray('experience', resume.experience.filter((_, i) => i !== index))} />)}
      </EditorSection>
      <EditorSection title="Projects" action={() => setArray('projects', [emptyProject(), ...resume.projects])}>
        {resume.projects.map((item, index) => <ProjectEditor key={item._id || index} item={item} onChange={(next) => setArray('projects', resume.projects.map((entry, i) => i === index ? next : entry))} onRemove={() => setArray('projects', resume.projects.filter((_, i) => i !== index))} />)}
      </EditorSection>
      <EditorSection title="Skills" action={() => setArray('skillGroups', [{ title: 'New Skill Group', items: [] }, ...resume.skillGroups])}>
        {resume.skillGroups.map((group, index) => <div className="editor-card" key={group._id || index}><div className="flex gap-2"><Input className={inputClass} value={group.title} onChange={(e) => setArray('skillGroups', resume.skillGroups.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry))} /><RemoveButton onClick={() => setArray('skillGroups', resume.skillGroups.filter((_, i) => i !== index))} /></div><TagEditor values={group.items} onChange={(items) => setArray('skillGroups', resume.skillGroups.map((entry, i) => i === index ? { ...entry, items } : entry))} /></div>)}
      </EditorSection>
      <EditorSection title="Achievements"><TagEditor values={resume.achievements} onChange={(achievements) => setArray('achievements', achievements)} /></EditorSection>
      <EditorSection title="Languages"><TagEditor values={resume.languages} onChange={(languages) => setArray('languages', languages)} /></EditorSection>
      <EditorSection title="Certifications"><TagEditor values={resume.certifications} onChange={(certifications) => setArray('certifications', certifications)} /></EditorSection>
    </div>
  </aside>;
}

function EditorSection({
  title,
  children,
  action,
  actionExtra,
}: {
  title: string;
  children: React.ReactNode;
  action?: () => void;
  actionExtra?: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-600">
          <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {actionExtra}
          {action && (
            <Button type="button" onClick={action} variant="outline" size="sm" className="h-7 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
              <Plus size={14} /> Add
            </Button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function EditorInput({ label, compact, ...props }: { label?: string; compact?: boolean; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>}
      <Input className={`${inputClass} ${compact ? 'h-8 text-sm' : ''}`} {...props} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" onClick={onClick} size="icon-sm" variant="ghost" aria-label="Remove" className="text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></Button>;
}

function TagEditor({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div className="mt-2 space-y-2">
      {values.map((value, index) => <div className="flex gap-2" key={index}><Input className={inputClass} value={value} placeholder="Add an item" onChange={(e) => onChange(values.map((entry, i) => i === index ? e.target.value : entry))} /><RemoveButton onClick={() => onChange(values.filter((_, i) => i !== index))} /></div>)}
      <Button type="button" onClick={() => onChange(['', ...values])} variant="outline" size="sm" className="gap-1 border-slate-200 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Plus size={14} /> Add item</Button>
    </div>
  );
}

function ExperienceEditor({ item, onChange, onRemove }: { item: ResumeExperience; onChange: (item: ResumeExperience) => void; onRemove: () => void }) {
  return (
    <div className="editor-card">
      <div className="grid gap-2 sm:grid-cols-2">
        <EditorInput compact placeholder="Company" value={item.company} onChange={(company) => onChange({ ...item, company })} />
        <EditorInput compact placeholder="Role" value={item.role} onChange={(role) => onChange({ ...item, role })} />
        <EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })} />
        <EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500">Role description</span>
        <RephraseButton
          text={item.description}
          field="description"
          onRephrased={(newText) => onChange({ ...item, description: newText })}
        />
      </div>
      <textarea
        className={`${textareaClass} mt-1 min-h-20`}
        value={item.description}
        placeholder="Company or role description (optional)"
        onChange={(e) => onChange({ ...item, description: e.target.value })}
      />
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">Achievements — one item per line</p>
        <RephraseButton
          text={item.achievements.join('\n')}
          field="achievement"
          onRephrased={(newText) => onChange({ ...item, achievements: newText.split('\n') })}
        />
      </div>
      <textarea
        className={`${textareaClass} mt-1 min-h-24`}
        value={item.achievements.join('\n')}
        onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })}
      />
      <RemoveButton onClick={onRemove} />
    </div>
  );
}

function ProjectEditor({ item, onChange, onRemove }: { item: ResumeProject; onChange: (item: ResumeProject) => void; onRemove: () => void }) {
  return (
    <div className="editor-card">
      <div className="grid gap-2 sm:grid-cols-2">
        <EditorInput compact placeholder="Project name" value={item.name} onChange={(name) => onChange({ ...item, name })} />
        <EditorInput compact placeholder="Project URL" value={item.url} onChange={(url) => onChange({ ...item, url })} />
        <EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })} />
        <EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500">Project description</span>
        <RephraseButton
          text={item.description}
          field="description"
          onRephrased={(newText) => onChange({ ...item, description: newText })}
        />
      </div>
      <textarea
        className={`${textareaClass} mt-1 min-h-20`}
        value={item.description}
        placeholder="Project description"
        onChange={(e) => onChange({ ...item, description: e.target.value })}
      />
      <div className="mt-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">Achievements — one item per line</p>
        <RephraseButton
          text={item.achievements.join('\n')}
          field="achievement"
          onRephrased={(newText) => onChange({ ...item, achievements: newText.split('\n') })}
        />
      </div>
      <textarea
        className={`${textareaClass} mt-1 min-h-24`}
        value={item.achievements.join('\n')}
        onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })}
      />
      <RemoveButton onClick={onRemove} />
    </div>
  );
}

function ResumePreview({ resume }: { resume: Resume }) {
  const p = resume.personal;
  const hasLeft =
    resume.summary ||
    resume.education.length ||
    resume.skillGroups.some((group) => group.items.some(Boolean)) ||
    resume.achievements.some(Boolean) ||
    resume.languages.some(Boolean) ||
    resume.certifications.some(Boolean);

  const watermarkTiles = Array.from({ length: 60 });

  const containerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(0.7);
  const [docHeight, setDocHeight] = useState(1122);

  // Auto-fit scale to container width so horizontal scrolling is NEVER needed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      // 794px is standard 8.27in at 96 DPI. Available width leaves 24px padding.
      const available = container.clientWidth - 24;
      if (available > 100) {
        const s = Math.min(1.0, Math.max(0.35, available / 794));
        setScale(Number(s.toFixed(3)));
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Track article height so wrapper height matches the scaled document exactly
  useEffect(() => {
    const art = articleRef.current;
    if (!art) return;
    const updateH = () => {
      if (art.offsetHeight > 0) setDocHeight(art.offsetHeight);
    };
    updateH();
    const ro = new ResizeObserver(updateH);
    ro.observe(art);
    return () => ro.disconnect();
  }, [resume]);

  const scaledWidth = Math.round(794 * scale);
  const scaledHeight = Math.round(docHeight * scale);

  return (
    <section
      ref={containerRef}
      className="resume-preview-wrap relative h-full w-full overflow-y-auto overflow-x-hidden rounded-xl bg-slate-200/90 p-3 select-none flex flex-col items-center"
    >
      {/* Print-only centred watermark */}
      <div className="resume-print-watermark" aria-hidden="true">INVERTISPREP</div>

      {/* Sizing frame: occupies exactly the scaled footprint so the parent never scrolls horizontally */}
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          position: 'relative',
        }}
        className="shrink-0 transition-[width,height] duration-75"
      >
        <article
          ref={articleRef}
          className="resume-page bg-white text-black shadow-xl"
          style={{
            width: '794px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        >
          {/* Diagonal watermark grid — inside the page so it covers all content when scrolling */}
          <div className="resume-preview-watermark" aria-hidden="true">
            <div className="resume-preview-watermark-inner">
              {watermarkTiles.map((_, i) => (
                <span key={i}>INVERTISPREP</span>
              ))}
            </div>
          </div>

          {/* Central Watermark Overlay — captured cleanly when downloading with watermark */}
          <div
            className="resume-pdf-watermark-overlay pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
            style={{ display: 'none' }}
            aria-hidden="true"
          >
            <span
              style={{
                transform: 'rotate(-35deg)',
                fontSize: '68pt',
                fontWeight: 900,
                color: 'rgba(99, 102, 241, 0.16)',
                letterSpacing: '0.14em',
                fontFamily: 'Inter, system-ui, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              INVERTISPREP
            </span>
          </div>
          <header className="border-b border-slate-300 pb-3 text-center">
            <h1 className="text-[22px] font-bold uppercase tracking-wide">{p.name || 'Your Name'}</h1>
            {p.headline && <p className="mt-0.5 text-[15px]">{p.headline}</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]">{p.phone && <span>{p.phone}</span>}{p.email && <span>{p.email}</span>}{p.location && <span>{p.location}</span>}</div>
            {p.links.some((link) => link.url) && <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">{p.links.filter((link) => link.url).map((link, i) => <span key={link._id || i}>{link.label ? `${link.label}: ` : ''}{link.url.replace(/^https?:\/\//, '')}</span>)}</div>}
          </header>
          <div className={hasLeft && (resume.experience.length || resume.projects.length) ? 'grid grid-cols-[31%_1fr] gap-7 pt-4' : 'pt-4'}>
            {hasLeft && <aside>
              {resume.summary && <PreviewSection title="Summary"><p>{resume.summary}</p></PreviewSection>}
              {resume.education.length > 0 && <PreviewSection title="Education">{resume.education.map((item, i) => <div className="mb-3" key={item._id || i}><p className="font-bold">{item.institution}</p><p>{item.degree}</p><DateLine start={item.startDate} end={item.endDate}/></div>)}</PreviewSection>}
              {resume.skillGroups.filter((group) => group.items.some(Boolean)).map((group, i) => <PreviewSection key={group._id || i} title={group.title}><p>{group.items.filter(Boolean).join(', ')}</p></PreviewSection>)}
              {resume.achievements.some(Boolean) && <PreviewSection title="Achievements"><ul>{resume.achievements.filter(Boolean).map((item, i) => <li key={i}>• {item}</li>)}</ul></PreviewSection>}
              {resume.languages.some(Boolean) && <PreviewSection title="Languages"><p>{resume.languages.filter(Boolean).join(', ')}</p></PreviewSection>}
              {resume.certifications.some(Boolean) && <PreviewSection title="Certifications"><ul>{resume.certifications.filter(Boolean).map((item, i) => <li key={i}>• {item}</li>)}</ul></PreviewSection>}
            </aside>}
            {(resume.experience.length || resume.projects.length) ? <main>
              {resume.experience.length > 0 && <PreviewSection title="Work Experience">{resume.experience.map((item, i) => <ExperiencePreview key={item._id || i} item={item}/>)}</PreviewSection>}
              {resume.projects.length > 0 && <PreviewSection title="Projects">{resume.projects.map((item, i) => <div className="mb-4" key={item._id || i}><div className="flex justify-between gap-3"><p className="font-bold">{item.name}</p><DateLine start={item.startDate} end={item.endDate}/></div>{item.url && <p className="text-[10px]">{item.url}</p>}{item.description && <p className="mt-1">{item.description}</p>}<AchievementList items={item.achievements}/></div>)}</PreviewSection>}
            </main> : null}
          </div>
          <footer className="resume-watermark">Made with www.invertisprep.in</footer>
        </article>
      </div>
    </section>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-4"><h2 className="mb-1 border-b-2 border-slate-300 pb-0.5 text-[15px] font-bold">{title}</h2><div className="resume-content">{children}</div></section>; }
function DateLine({ start, end }: { start: string; end: string }) { const text = [formatDate(start), formatDate(end)].filter(Boolean).join(' — '); return text ? <span className="shrink-0 whitespace-nowrap text-[11px]">{text}</span> : null; }
function AchievementList({ items }: { items: string[] }) { const values = items.filter(Boolean); return values.length ? <ul className="mt-1 list-disc pl-4">{values.map((item, i) => <li key={i}>{item}</li>)}</ul> : null; }
function ExperiencePreview({ item }: { item: ResumeExperience }) { return <div className="mb-4"><div className="flex justify-between gap-3"><p className="font-bold">{item.company}</p><DateLine start={item.startDate} end={item.endDate}/></div><p className="font-semibold">{item.role}</p>{item.description && <p className="mt-1">{item.description}</p>}<AchievementList items={item.achievements}/></div>; }
