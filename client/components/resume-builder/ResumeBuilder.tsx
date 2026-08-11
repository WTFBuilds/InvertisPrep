'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi, walletApi } from '@/lib/api';
import type { Resume, ResumeDraft, ResumeEducation, ResumeExperience, ResumeLink, ResumeProject } from '@/types';
import { CheckCircle2, Clock, Coins, CreditCard, Download, FileUp, Gift, LayoutDashboard, Loader2, Plus, Printer, Save, Shield, Sparkles, Trash2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spotlight } from '@/components/ui/spotlight';
import { SavePromptModal } from './SavePromptModal';

const emptyEducation = (): ResumeEducation => ({ institution: '', degree: '', startDate: '', endDate: '' });
const emptyExperience = (): ResumeExperience => ({ company: '', role: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyProject = (): ResumeProject => ({ name: '', url: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyLink = (): ResumeLink => ({ label: '', url: '' });

// Blank starter resume — every field is empty so users start from a clean slate
// (no demo data that could accidentally be exported as someone else's info).
export function createStarterResume(): ResumeDraft {
  return {
    title: 'Untitled Resume',
    personal: {
      name: '', headline: '', email: '', phone: '', location: '',
      links: [],
    },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skillGroups: [],
    achievements: [],
    languages: [],
    certifications: [],
  };
}

// safeResume — lightweight structural safety pass for EXISTING saved resumes.
// Only ensures arrays are arrays and objects are objects. Never injects template content.
function safeResume(resume: Resume): Resume {
  // Migrate old generic template data that was seeded before the builder was live
  const isPreviousGenericTemplate =
    resume.title === 'Ahqaf Ali - Full Stack Developer' ||
    resume.summary?.startsWith('Motivated student and aspiring software developer') ||
    resume.projects?.some((project) => project.name === 'Student Portfolio Website');
  if (isPreviousGenericTemplate) {
    // Replace old generic template with the current starter so users get the new template
    return { ...resume, ...createStarterResume() };
  }

  const personal = resume.personal ?? { name: '', headline: '', email: '', phone: '', location: '', links: [] };
  return {
    ...resume,
    title: resume.title ?? '',
    personal: {
      name: personal.name ?? '',
      headline: personal.headline ?? '',
      email: personal.email ?? '',
      phone: personal.phone ?? '',
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

  // Guest mode load effect - creates fresh starter in memory (no localStorage)
  useEffect(() => {
    if (user) return; // Only for guests
    if (loadedIdRef.current) return; // Already loaded

    setBooting(true);
    const starterDraft = createStarterResume();
    const resumeWithId: Resume = {
      ...starterDraft,
      _id: `guest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setResume(resumeWithId);
    loadedIdRef.current = resumeWithId._id;
    setIsDirty(false);
    setSavedAt(null);
    setBooting(false);
  }, [user]);

  // Logged-in user load effect - uses server API
  useEffect(() => {
    if (!user) return;
    // Skip if the ?id we want is already loaded
    if (idParam && loadedIdRef.current === idParam) return;

    let cancelled = false;
    setBooting(true);

    const load = async () => {
      try {
        if (idParam) {
          // Load a specific saved resume by its id directly — no guessing
          const result = await resumeApi.get(idParam);
          if (cancelled) return;
          if (!result.data) throw new Error('Resume not found');
          setResume(safeResume(result.data));
          loadedIdRef.current = idParam;
        } else {
          // No id in URL — open the first existing resume, or create a new starter
          const list = await resumeApi.list();
          if (cancelled) return;
          const first = list.data?.[0];
          if (first) {
            setResume(safeResume(first));
            loadedIdRef.current = first._id;
            router.replace(`/resume-builder?id=${first._id}`);
          } else {
            // No resumes exist yet — create a fresh starter
            const created = await resumeApi.create(createStarterResume());
            if (cancelled) return;
            if (!created.data) throw new Error('Could not create resume');
            setResume(safeResume(created.data));
            loadedIdRef.current = created.data._id;
            router.replace(`/resume-builder?id=${created.data._id}`);
          }
        }
        setIsDirty(false);
        setSavedAt(null);
      } catch {
        if (!cancelled) toast.error('Could not load your resume. Please try again.');
      } finally {
        if (!cancelled) setBooting(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idParam]);

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

  // Print without watermark: temporarily hide overlay, print, restore
  const printClean = () => {
    document.documentElement.classList.add('printing-clean');
    window.print();
    // restore after print dialog closes (listen for afterprint or fallback timeout)
    const restore = () => {
      document.documentElement.classList.remove('printing-clean');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    setTimeout(restore, 3000); // fallback
  };

  const handleDownload = async (method: 'free' | 'coins' | 'razorpay' | 'watermark') => {
    if (method === 'watermark') {
      window.print();
      setShowDownloadModal(false);
      return;
    }
    if (method === 'razorpay') {
      toast.info('Razorpay payment coming soon! Use QCoins or buy a pack.');
      return;
    }
    if (!resume) return;
    setDownloading(method);
    try {
      const res = await walletApi.spendDownload(resume._id, method);
      if (res.success && res.data) {
        updateUser({ ...user!, qcoins: res.data.qcoins, freeDownloadsLeft: res.data.freeDownloadsLeft });
        setShowDownloadModal(false);
        toast.success(method === 'free' ? 'Free download used — printing now!' : '200 QCoins spent — printing now!');
        setTimeout(printClean, 300);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Download failed';
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
    <div className="bg-slate-100 min-h-screen resume-builder-shell">
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="font-bold text-slate-900">ATS Resume Builder</h1>
            <p className="text-xs text-slate-500">Clean, single-column content designed for easy ATS parsing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveStatus />
            <Link
              className="resume-tool"
              href="/resumes"
              onClick={(e) => {
                if (!user && isDirty) {
                  e.preventDefault();
                  setPendingNavigation('/resumes');
                  setShowSavePrompt(true);
                }
              }}
            >
              <LayoutDashboard size={16}/> My resumes
            </Link>
            <button className="resume-tool" onClick={() => importRef.current?.click()}><FileUp size={16}/> Import</button>
            <button className="resume-tool" onClick={exportJson}><Download size={16}/> Export</button>
            <button className="resume-tool" onClick={() => {
              if (!user) {
                setShowSavePrompt(true);
              } else {
                setShowDownloadModal(true);
              }
            }}><Printer size={16}/> PDF</button>            <button className="resume-tool-primary" disabled={saving} onClick={() => save(resume, false)}>
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save
            </button>
            <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(390px,0.82fr)_minmax(620px,1.18fr)]">
          <ResumeEditor resume={resume} update={update} updatePersonal={updatePersonal} />
          <ResumePreview resume={resume} />
        </div>
      </div>
      <DownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        qcoins={user?.qcoins ?? 0}
        freeDownloadsLeft={user?.freeDownloadsLeft ?? 0}
        downloading={downloading}
        onDownload={handleDownload}
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
  open, onClose, qcoins, freeDownloadsLeft, downloading, onDownload,
}: {
  open: boolean;
  onClose: () => void;
  qcoins: number;
  freeDownloadsLeft: number;
  downloading: 'free' | 'coins' | 'razorpay' | 'watermark' | null;
  onDownload: (method: 'free' | 'coins' | 'razorpay' | 'watermark') => void;
}) {
  const canFree  = freeDownloadsLeft > 0;
  const canCoins = qcoins >= 200;

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

        {/* balance pill */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <Coins className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-slate-700">{qcoins.toLocaleString('en-IN')} QCoins</span>
          <span className="mx-1 text-slate-300">·</span>
          <Gift className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-slate-700">{freeDownloadsLeft} free download{freeDownloadsLeft !== 1 ? 's' : ''} left</span>
          <Link href="/wallet" className="ml-auto flex items-center gap-1 text-indigo-600 hover:underline font-medium">
            <Wallet className="h-3 w-3" /> Top up
          </Link>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Watermark-free</p>

        <div className="space-y-2">
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
          <OptionButton
            method="razorpay"
            icon={<CreditCard className="h-5 w-5" />}
            title="Pay ₹19.99"
            subtitle={<span>Razorpay coming soon. <span className="line-through text-slate-400">₹99.99</span> <span className="font-bold text-rose-500">₹19.99</span> — Limited offer!</span>}
            accent="purple"
          />
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
      <EditorSection title="Summary"><textarea className={`${textareaClass} min-h-28`} value={resume.summary} onChange={(e) => update({ summary: e.target.value })} placeholder="Write a concise, achievement-focused professional summary." /></EditorSection>
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

function EditorSection({ title, children, action }: { title: string; children: React.ReactNode; action?: () => void }) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-600">
          <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          {title}
        </h2>
        {action && (
          <Button type="button" onClick={action} variant="outline" size="sm" className="h-7 gap-1 border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
            <Plus size={14} /> Add
          </Button>
        )}
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
  return <div className="editor-card"><div className="grid gap-2 sm:grid-cols-2"><EditorInput compact placeholder="Company" value={item.company} onChange={(company) => onChange({ ...item, company })} /><EditorInput compact placeholder="Role" value={item.role} onChange={(role) => onChange({ ...item, role })} /><EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })} /><EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })} /></div><textarea className={`${textareaClass} mt-2 min-h-20`} value={item.description} placeholder="Company or role description (optional)" onChange={(e) => onChange({ ...item, description: e.target.value })} /><p className="mt-2 text-xs font-semibold text-slate-600">Achievements — one item per line</p><textarea className={`${textareaClass} mt-1 min-h-24`} value={item.achievements.join('\n')} onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })} /><RemoveButton onClick={onRemove} /></div>;
}

function ProjectEditor({ item, onChange, onRemove }: { item: ResumeProject; onChange: (item: ResumeProject) => void; onRemove: () => void }) {
  return <div className="editor-card"><div className="grid gap-2 sm:grid-cols-2"><EditorInput compact placeholder="Project name" value={item.name} onChange={(name) => onChange({ ...item, name })} /><EditorInput compact placeholder="Project URL" value={item.url} onChange={(url) => onChange({ ...item, url })} /><EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })} /><EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })} /></div><textarea className={`${textareaClass} mt-2 min-h-20`} value={item.description} placeholder="Project description" onChange={(e) => onChange({ ...item, description: e.target.value })} /><p className="mt-2 text-xs font-semibold text-slate-600">Achievements — one item per line</p><textarea className={`${textareaClass} mt-1 min-h-24`} value={item.achievements.join('\n')} onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })} /><RemoveButton onClick={onRemove} /></div>;
}

function ResumePreview({ resume }: { resume: Resume }) {
  const p = resume.personal;
  const hasLeft = resume.summary || resume.education.length || resume.skillGroups.some((group) => group.items.some(Boolean)) || resume.achievements.some(Boolean) || resume.languages.some(Boolean) || resume.certifications.some(Boolean);

  // Enough repeated tiles to fill the diagonal overlay at any scroll position
  const watermarkTiles = Array.from({ length: 60 });

  return (
    <section className="resume-preview-wrap relative overflow-auto rounded-xl bg-slate-200 p-3 shadow-inner sm:p-5 select-none">
      {/* Print-only centred watermark */}
      <div className="resume-print-watermark" aria-hidden="true">INVERTISPREP</div>

      <article
        className="resume-page mx-auto bg-white text-black shadow-xl"
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
    </section>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-4"><h2 className="mb-1 border-b-2 border-slate-300 pb-0.5 text-[15px] font-bold">{title}</h2><div className="resume-content">{children}</div></section>; }
function DateLine({ start, end }: { start: string; end: string }) { const text = [formatDate(start), formatDate(end)].filter(Boolean).join(' — '); return text ? <span className="shrink-0 whitespace-nowrap text-[11px]">{text}</span> : null; }
function AchievementList({ items }: { items: string[] }) { const values = items.filter(Boolean); return values.length ? <ul className="mt-1 list-disc pl-4">{values.map((item, i) => <li key={i}>{item}</li>)}</ul> : null; }
function ExperiencePreview({ item }: { item: ResumeExperience }) { return <div className="mb-4"><div className="flex justify-between gap-3"><p className="font-bold">{item.company}</p><DateLine start={item.startDate} end={item.endDate}/></div><p className="font-semibold">{item.role}</p>{item.description && <p className="mt-1">{item.description}</p>}<AchievementList items={item.achievements}/></div>; }
