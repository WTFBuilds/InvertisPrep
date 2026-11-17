'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Target, 
  Shield, 
  Heart, 
  Users,
  PenTool,
  Clapperboard,
  Headphones,
  Code2,
  Terminal,
  Megaphone,
  TrendingUp,
  Palette,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  GraduationCap,
  Building2,
  Globe,
  CheckCircle,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { careerApi } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { CareerApplicationInput, CareerDomain, CareerSemester, CareerLocation, CareerProficiency, CareerHeardFrom, CareerAvailability } from '@/types';

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Your basic details and academic background' },
  { id: 2, title: 'Domain Selection', description: 'Choose the role you are applying for' },
  { id: 3, title: 'Skills & Proficiency', description: 'Tell us about your skills and experience' },
  { id: 4, title: 'Resume & Portfolio', description: 'Links to your resume and work samples' },
  { id: 5, title: 'Final Questions', description: 'A few more questions to help us know you better' },
] as const;

const DOMAINS: { value: CareerDomain; label: string; icon: React.ComponentType<{ className?: string }>; description: string; accentColor: string; borderColor: string }[] = [
  { value: 'Canva designer', label: 'Canva Designer', icon: Palette, description: 'Create engaging visual content for social media, presentations, and marketing materials', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { value: 'Video Editor', label: 'Video Editor', icon: Clapperboard, description: 'Edit and produce high-quality video content for educational and promotional purposes', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { value: 'Support and Resource Team (SRT)', label: 'Support and Resource Team (SRT)', icon: Headphones, description: 'Help students navigate the platform, resolve queries, and manage educational resources', accentColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { value: 'Developers', label: 'Developers', icon: Code2, description: 'Build and maintain the InvertisPrep platform — frontend, backend, and infrastructure', accentColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { value: 'Content writer', label: 'Content Writer', icon: PenTool, description: 'Write educational content, blog posts, guides, and platform copy', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { value: 'Technical support', label: 'Technical Support', icon: Terminal, description: 'Troubleshoot platform issues, manage deployments, and ensure system reliability', accentColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { value: 'Social media manager', label: 'Social Media Manager', icon: Megaphone, description: 'Grow our social presence, engage with the community, and drive platform adoption', accentColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { value: 'Marketing', label: 'Marketing', icon: TrendingUp, description: 'Drive user acquisition, partnerships, and brand awareness for InvertisPrep', accentColor: 'bg-amber-50', borderColor: 'border-amber-200' },
];

const SEMESTERS: CareerSemester[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const LOCATIONS: CareerLocation[] = ['Bareilly', 'Rampur', 'Shahjahanpur', 'Other'];
const PROFICIENCY_LEVELS: CareerProficiency[] = [
  'Beginner (Learning the basics)',
  'Intermediate (Have some hands-on experience)',
  'Advanced (Confident and have done projects)',
];
const HEARD_FROM_OPTIONS: CareerHeardFrom[] = [
  'Friend / Classmate',
  'Social Media (Instagram / WhatsApp)',
  'Invertis Confession',
  'InvertisPrep Website',
  'Other',
];
const AVAILABILITY_OPTIONS: CareerAvailability[] = [
  'Yes, fully available',
  'Available with minor scheduling constraints',
  'Not sure yet',
];

const DRAFT_KEY = 'career_application_draft';

// ── WhatsApp number: country-code aware input ─────────────────────────────────
// The dial code comes from the country selector; the national number is
// digit-capped per country and pretty-grouped as the user types. The stored
// value is the full human-readable form, e.g. "+91 98765 43210".
interface PhoneCountry {
  iso: string;
  name: string;
  dial: string;
  exact?: number; // exact national digit count
  min?: number;
  max?: number;   // accepted national digit range when exact is unknown
}

const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'IN', name: 'India', dial: '+91', exact: 10 },
  { iso: 'US', name: 'United States', dial: '+1', exact: 10 },
  { iso: 'CA', name: 'Canada', dial: '+1', exact: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', min: 7, max: 10 },
  { iso: 'AE', name: 'UAE', dial: '+971', min: 8, max: 9 },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', min: 9, max: 9 },
  { iso: 'SG', name: 'Singapore', dial: '+65', exact: 8 },
  { iso: 'AU', name: 'Australia', dial: '+61', min: 9, max: 9 },
  { iso: 'NP', name: 'Nepal', dial: '+977', min: 9, max: 10 },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', min: 9, max: 10 },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94', exact: 9 },
  { iso: 'PK', name: 'Pakistan', dial: '+92', min: 9, max: 10 },
];

const PHONE_FALLBACK = { min: 7, max: 12 };

function getPhoneCountry(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find(c => c.iso === iso) || PHONE_COUNTRIES[0];
}

function maxNationalDigits(country: PhoneCountry): number {
  return country.exact ?? country.max ?? PHONE_FALLBACK.max;
}

function groupNationalDigits(iso: string, digits: string): string {
  if (iso === 'IN') return digits.replace(/(\d{5})(?=\d)/g, '$1 '); // 98765 43210
  if (iso === 'US' || iso === 'CA') {
    if (digits.length > 6) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return digits;
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 '); // 7700 9001 23
}

function formatFullPhone(iso: string, nationalDigits: string): string {
  return `${getPhoneCountry(iso).dial} ${groupNationalDigits(iso, nationalDigits)}`.trim();
}

// Split a stored number ("+91 98765 43210", "+919876543210", legacy "9876543210")
// into its country and national digits. Bare numbers default to India.
function parseStoredPhone(value: string): { iso: string; national: string } | null {
  if (!value) return null;
  const cleaned = value.replace(/[\s()-]/g, '');
  const country = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(c => cleaned.startsWith(c.dial));
  if (country) {
    const national = cleaned.slice(country.dial.length).replace(/\D/g, '');
    return national ? { iso: country.iso, national } : null;
  }
  const bare = cleaned.replace(/\D/g, '');
  if (!bare) return null;
  return { iso: 'IN', national: bare.slice(-10) };
}

function isValidNationalNumber(iso: string, digits: string): boolean {
  const country = getPhoneCountry(iso);
  if (iso === 'IN') return /^[6-9]\d{9}$/.test(digits); // Indian mobiles start 6-9
  if (country.exact) return digits.length === country.exact;
  return digits.length >= (country.min ?? PHONE_FALLBACK.min) && digits.length <= (country.max ?? PHONE_FALLBACK.max);
}

function validateStep(step: number, data: CareerApplicationInput): Record<string, string> {
  const newErrors: Record<string, string> = {};

  switch (step) {
    case 1:
      if (!data.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!data.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
      if (!data.whatsappNumber.trim()) newErrors.whatsappNumber = 'WhatsApp number is required';
      else {
        const phone = parseStoredPhone(data.whatsappNumber);
        if (!phone || !isValidNationalNumber(phone.iso, phone.national)) {
          newErrors.whatsappNumber = phone && phone.iso === 'IN'
            ? 'Enter a valid 10-digit Indian mobile number'
            : 'Enter a valid mobile number for the selected country';
        }
      }
      if (!data.departmentBranch.trim()) newErrors.departmentBranch = 'Department/Branch is required';
      if (!data.currentSemester) newErrors.currentSemester = 'Current semester is required';
      if (!data.currentLocation) newErrors.currentLocation = 'Current location is required';
      if (data.currentLocation === 'Other' && !data.customLocation?.trim()) {
        newErrors.customLocation = 'Please specify your location';
      }
      break;

    case 2:
      if (!data.appliedDomain) newErrors.appliedDomain = 'Please select a domain';
      if (typeof data.hybridComfortable !== 'boolean') newErrors.hybridComfortable = 'Please select an option';
      if (!data.interestReason.trim()) newErrors.interestReason = 'Please tell us why you are interested';
      else if (data.interestReason.trim().length < 50) newErrors.interestReason = 'Interest reason must be at least 50 characters';
      break;

    case 3:
      if (!data.skills.trim()) newErrors.skills = 'Please list your relevant skills';
      if (!data.proficiencyLevel) newErrors.proficiencyLevel = 'Please select a proficiency level';
      if (typeof data.hasProjects !== 'boolean') newErrors.hasProjects = 'Please select an option';
      if (data.hasProjects && !data.projectDescription?.trim()) {
        newErrors.projectDescription = 'Please describe your project(s)';
      }
      break;

    case 4:
      if (!data.resumeLink.trim()) newErrors.resumeLink = 'Resume link is required';
      else if (!/^https?:\/\/.+/.test(data.resumeLink)) newErrors.resumeLink = 'Enter a valid URL (Google Drive link)';
      if (data.portfolioLink && !/^https?:\/\/.+/.test(data.portfolioLink)) {
        newErrors.portfolioLink = 'Enter a valid URL';
      }
      break;

    case 5:
      if (!data.heardFrom) newErrors.heardFrom = 'Please select an option';
      if (data.heardFrom === 'Other' && !data.customHeardFrom?.trim()) {
        newErrors.customHeardFrom = 'Please specify how you heard about us';
      }
      if (!data.availability) newErrors.availability = 'Please select your availability';
      break;
  }

  return newErrors;
}

function getStepFields(step: number): (keyof CareerApplicationInput)[] {
  switch (step) {
    case 1: return ['fullName', 'email', 'whatsappNumber', 'departmentBranch', 'currentSemester', 'currentLocation', 'customLocation'];
    case 2: return ['appliedDomain', 'hybridComfortable', 'interestReason'];
    case 3: return ['skills', 'proficiencyLevel', 'hasProjects', 'projectDescription'];
    case 4: return ['resumeLink', 'portfolioLink'];
    case 5: return ['heardFrom', 'customHeardFrom', 'availability', 'additionalNotes'];
    default: return [];
  }
}

export default function CareersApplyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [countryIso, setCountryIso] = useState('IN');
  
  // All state at top
  const [formData, setFormData] = useState<CareerApplicationInput>({
    fullName: '',
    email: '',
    whatsappNumber: '',
    departmentBranch: '',
    currentSemester: '1st',
    currentLocation: 'Bareilly',
    customLocation: '',
    appliedDomain: 'Canva designer',
    hybridComfortable: false,
    interestReason: '',
    skills: '',
    proficiencyLevel: 'Beginner (Learning the basics)',
    hasProjects: false,
    projectDescription: '',
    resumeLink: '',
    portfolioLink: '',
    heardFrom: 'Friend / Classmate',
    customHeardFrom: '',
    availability: 'Yes, fully available',
    additionalNotes: '',
  });

  // All useEffects at top
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth on mount
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `/careers/apply${window.location.search}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, router, searchParams]);

  // Prefill from the signed-in profile — only empty fields, so a restored
  // draft always wins over profile defaults. Bare profile numbers are
  // assumed Indian and reformatted with the +91 dial code.
  useEffect(() => {
    if (!user) return;
    const phone = parseStoredPhone(user.phoneNumber || '');
    if (phone) setCountryIso(phone.iso);
    setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      email: prev.email || user.email || '',
      departmentBranch: prev.departmentBranch || user.course || '',
      whatsappNumber: prev.whatsappNumber || (phone ? formatFullPhone(phone.iso, phone.national) : ''),
    }));
  }, [user]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Normalize any stored number into the dial-code display form
        if (parsed.whatsappNumber) {
          const phone = parseStoredPhone(parsed.whatsappNumber);
          if (phone) {
            setCountryIso(phone.iso);
            parsed.whatsappNumber = formatFullPhone(phone.iso, phone.national);
          } else {
            parsed.whatsappNumber = '';
          }
        }
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore parsing errors
    }

    // Pre-select domain from query param
    const roleParam = searchParams.get('role');
    if (roleParam) {
      const domain = DOMAINS.find(d => d.value.toLowerCase().replace(/\s+/g, '-') === roleParam);
      if (domain) {
        setFormData(prev => ({ ...prev, appliedDomain: domain.value }));
      }
    }
  }, [searchParams]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch {
        // Ignore
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // Don't render form until auth is checked and mounted
  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const handleChange = (field: keyof CareerApplicationInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleBlur = (field: keyof CareerApplicationInput) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const stepErrors = validateStep(currentStep, formData);
    setErrors(prev => ({ ...prev, ...stepErrors }));
  };

  // WhatsApp number: the national part is derived from the stored full value
  const phoneCountry = getPhoneCountry(countryIso);
  const phoneParts = parseStoredPhone(formData.whatsappNumber);
  const phoneNational = phoneParts && phoneParts.iso === countryIso ? phoneParts.national : '';

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, maxNationalDigits(phoneCountry));
    handleChange('whatsappNumber', digits ? formatFullPhone(countryIso, digits) : '');
  };

  const handlePhoneCountryChange = (iso: string) => {
    setCountryIso(iso);
    const nextCountry = getPhoneCountry(iso);
    const digits = phoneNational.slice(0, maxNationalDigits(nextCountry));
    handleChange('whatsappNumber', digits ? formatFullPhone(iso, digits) : '');
  };

  const canProceed = () => {
    const stepErrors = validateStep(currentStep, formData);
    setErrors(stepErrors);
    setTouched(prev => {
      const next = { ...prev };
      const stepFields = getStepFields(currentStep);
      stepFields.forEach(f => { next[f] = true; });
      return next;
    });
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const response = await careerApi.submit(formData);
      if (response.success) {
        clearDraft();
        toast.success('Application submitted! A confirmation email is on its way — our team will update you soon.');
        router.push('/careers?applied=true');
      } else {
        toast.error(response.message || 'Failed to submit application');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        setErrors(Object.fromEntries(validationErrors.map((e: string) => {
          const field = e.toLowerCase().includes('name') ? 'fullName' :
                       e.toLowerCase().includes('email') ? 'email' :
                       e.toLowerCase().includes('whatsapp') ? 'whatsappNumber' :
                       e.toLowerCase().includes('department') ? 'departmentBranch' :
                       e.toLowerCase().includes('semester') ? 'currentSemester' :
                       e.toLowerCase().includes('location') ? 'currentLocation' :
                       e.toLowerCase().includes('domain') ? 'appliedDomain' :
                       e.toLowerCase().includes('hybrid') ? 'hybridComfortable' :
                       e.toLowerCase().includes('interest') ? 'interestReason' :
                       e.toLowerCase().includes('skill') ? 'skills' :
                       e.toLowerCase().includes('proficiency') ? 'proficiencyLevel' :
                       e.toLowerCase().includes('project') ? 'projectDescription' :
                       e.toLowerCase().includes('resume') ? 'resumeLink' :
                       e.toLowerCase().includes('portfolio') ? 'portfolioLink' :
                       e.toLowerCase().includes('heard') ? 'heardFrom' :
                       e.toLowerCase().includes('availab') ? 'availability' : 'general';
          return [field, e];
        })));
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return (
        <Step1Personal
          formData={formData}
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors}
          touched={touched}
          countryIso={countryIso}
          phoneNational={phoneNational}
          onPhoneChange={handlePhoneChange}
          onPhoneCountryChange={handlePhoneCountryChange}
        />
      );
      case 2: return <Step2Domain formData={formData} onChange={handleChange} onBlur={handleBlur} errors={errors} touched={touched} />;
      case 3: return <Step3Skills formData={formData} onChange={handleChange} onBlur={handleBlur} errors={errors} touched={touched} />;
      case 4: return <Step4Resume formData={formData} onChange={handleChange} onBlur={handleBlur} errors={errors} touched={touched} />;
      case 5: return <Step5Final formData={formData} onChange={handleChange} onBlur={handleBlur} errors={errors} touched={touched} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <main>
        {/* Progress Header */}
        <div className="border-b border-gray-200 sticky top-16 z-10 bg-white/95 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Step {currentStep} of {STEPS.length}</p>
                <h1 className="text-xl font-medium text-gray-900 mt-1">{STEPS[currentStep - 1].title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{STEPS[currentStep - 1].description}</p>
              </div>
            </div>
            <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className="absolute top-0 h-full transition-all duration-300"
                  style={{
                    left: `${(index / (STEPS.length - 1)) * 100}%`,
                    width: index === STEPS.length - 1 ? 0 : `${100 / (STEPS.length - 1)}%`,
                    backgroundColor: index < currentStep - 1 ? '#000' : index === currentStep - 1 ? '#000' : '#e5e7eb',
                  }}
                />
              ))}
              <div
                className="absolute top-0 h-full rounded-full bg-black transition-all duration-300"
                style={{
                  left: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                  width: currentStep === STEPS.length ? 0 : `${100 / (STEPS.length - 1)}%`,
                }}
              />
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className="absolute top-0 -translate-x-1/2 flex items-center justify-center"
                  style={{ left: `${(index / (STEPS.length - 1)) * 100}%` }}
                >
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index < currentStep - 1 ? 'bg-black text-white' :
                    index === currentStep - 1 ? 'bg-black text-white ring-4 ring-white ring-offset-2' :
                    'bg-white text-gray-400 border-2 border-gray-300'
                  }`}>
                    {index < currentStep - 1 ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-md font-medium text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-md font-medium text-base hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// --- Step Components ---

function Step1Personal({ formData, onChange, onBlur, errors, touched, countryIso, phoneNational, onPhoneChange, onPhoneCountryChange }: any) {
  const phoneError = touched.whatsappNumber && errors.whatsappNumber;
  const phoneCountry = getPhoneCountry(countryIso);
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-4">Personal Details</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Full Name *"
            name="fullName"
            value={formData.fullName}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.fullName}
            touched={touched.fullName}
            placeholder="Your full name"
            icon={<User className="w-4 h-4" />}
          />
          <FormField
            label="Email Address *"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.email}
            touched={touched.email}
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
          />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp number: joined country-code selector + digit-capped national input */}
          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-900 mb-1.5">
              WhatsApp Number *
            </label>
            <div className="flex">
              <select
                aria-label="Country code"
                value={countryIso}
                onChange={(e) => onPhoneCountryChange(e.target.value)}
                className={`w-auto shrink-0 pl-3 pr-2 py-2.5 text-sm rounded-l-md border bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 ${
                  phoneError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                }`}
              >
                {PHONE_COUNTRIES.map(c => (
                  <option key={c.iso} value={c.iso}>{c.dial} ({c.iso})</option>
                ))}
              </select>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                inputMode="numeric"
                value={groupNationalDigits(countryIso, phoneNational)}
                onChange={(e) => onPhoneChange(e.target.value)}
                onBlur={() => onBlur('whatsappNumber')}
                placeholder={countryIso === 'IN' ? '98765 43210' : `${phoneCountry.min ?? 7}-${maxNationalDigits(phoneCountry)} digits`}
                className={`flex-1 min-w-0 pl-3 pr-4 py-2.5 border rounded-r-md text-sm transition-colors ${
                  phoneError
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500'
                }`}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? 'whatsappNumber-error' : undefined}
              />
            </div>
            {phoneError && (
              <p id="whatsappNumber-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                <X className="w-3 h-3" /> {phoneError}
              </p>
            )}
            {!phoneError && (
              <p className="mt-1.5 text-sm text-gray-500">
                {phoneCountry.name} ({phoneCountry.dial}) — only digits, spaces added automatically
              </p>
            )}
          </div>
          <FormField
            label="Department / Branch *"
            name="departmentBranch"
            value={formData.departmentBranch}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.departmentBranch}
            touched={touched.departmentBranch}
            placeholder="e.g. B.Tech CSE, MBA, BCA"
            icon={<Briefcase className="w-4 h-4" />}
          />
        </div>
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Academic & Location</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            label="Current Semester *"
            name="currentSemester"
            value={formData.currentSemester}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.currentSemester}
            touched={touched.currentSemester}
            options={SEMESTERS}
            placeholder="Select semester"
          />
          <FormSelect
            label="Current Location *"
            name="currentLocation"
            value={formData.currentLocation}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.currentLocation}
            touched={touched.currentLocation}
            options={LOCATIONS}
            placeholder="Select location"
          />
        </div>
        {formData.currentLocation === 'Other' && (
          <FormField
            label="Please Specify Location *"
            name="customLocation"
            value={formData.customLocation}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.customLocation}
            touched={touched.customLocation}
            placeholder="Your city/state"
            icon={<MapPin className="w-4 h-4" />}
            className="mt-6"
          />
        )}
      </fieldset>
    </div>
  );
}

function Step2Domain({ formData, onChange, onBlur, errors, touched }: any) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-4">Select Your Domain</legend>
        <p className="text-gray-600 text-sm mb-6">Choose the role that best matches your skills and interests.</p>
        <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Select domain">
          {DOMAINS.map((domain) => (
            <DomainCard
              key={domain.value}
              domain={domain}
              isSelected={formData.appliedDomain === domain.value}
              onSelect={() => onChange('appliedDomain', domain.value)}
              error={errors.appliedDomain && touched.appliedDomain}
            />
          ))}
        </div>
        {errors.appliedDomain && touched.appliedDomain && (
          <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="w-4 h-4" /> {errors.appliedDomain}
          </p>
        )}
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Work Preference</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RadioOption
            label="Yes, I'm comfortable with hybrid (online + offline) work"
            name="hybridComfortable"
            value="true"
            checked={formData.hybridComfortable === true}
            onChange={(v) => onChange('hybridComfortable', v === 'true')}
            onBlur={() => onBlur('hybridComfortable')}
            error={errors.hybridComfortable && touched.hybridComfortable}
          />
          <RadioOption
            label="No, I prefer fully remote work only"
            name="hybridComfortable"
            value="false"
            checked={formData.hybridComfortable === false}
            onChange={(v) => onChange('hybridComfortable', v === 'true')}
            onBlur={() => onBlur('hybridComfortable')}
            error={errors.hybridComfortable && touched.hybridComfortable}
          />
        </div>
        {errors.hybridComfortable && touched.hybridComfortable && (
          <p className="text-sm text-red-600 flex items-center gap-1 mt-2" role="alert">
            <AlertCircle className="w-4 h-4" /> {errors.hybridComfortable}
          </p>
        )}
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Why This Domain?</legend>
        <FormTextarea
          label="Why are you interested in this domain? *"
          name="interestReason"
          value={formData.interestReason}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.interestReason}
          touched={touched.interestReason}
          placeholder="Tell us what excites you about this role, what you hope to learn, and how you can contribute. Minimum 50 characters."
          rows={4}
          minLength={50}
        />
      </fieldset>
    </div>
  );
}

function Step3Skills({ formData, onChange, onBlur, errors, touched }: any) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-4">Your Skills</legend>
        <FormTextarea
          label="List your relevant skills for the selected domain *"
          name="skills"
          value={formData.skills}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.skills}
          touched={touched.skills}
          placeholder="e.g. React, TypeScript, MongoDB, Git, REST APIs, Figma, Canva, Video Editing, Premiere Pro..."
          rows={3}
        />
        <p className="text-sm text-gray-500">Include tools, languages, frameworks, software, or methodologies you know.</p>
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Proficiency Level</legend>
        <div className="space-y-3" role="radiogroup" aria-label="Select proficiency level">
          {PROFICIENCY_LEVELS.map((level) => (
            <RadioOption
              key={level}
              label={level}
              name="proficiencyLevel"
              value={level}
              checked={formData.proficiencyLevel === level}
              onChange={(v) => onChange('proficiencyLevel', v)}
              onBlur={() => onBlur('proficiencyLevel')}
              error={errors.proficiencyLevel && touched.proficiencyLevel}
            />
          ))}
        </div>
        {errors.proficiencyLevel && touched.proficiencyLevel && (
          <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="w-4 h-4" /> {errors.proficiencyLevel}
          </p>
        )}
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Project Experience</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <RadioOption
            label="Yes, I have done projects or work related to this domain"
            name="hasProjects"
            value="true"
            checked={formData.hasProjects === true}
            onChange={(v) => onChange('hasProjects', v === 'true')}
            onBlur={() => onBlur('hasProjects')}
            error={errors.hasProjects && touched.hasProjects}
          />
          <RadioOption
            label="No, I haven't done any projects yet"
            name="hasProjects"
            value="false"
            checked={formData.hasProjects === false}
            onChange={(v) => onChange('hasProjects', v === 'true')}
            onBlur={() => onBlur('hasProjects')}
            error={errors.hasProjects && touched.hasProjects}
          />
        </div>
        {errors.hasProjects && touched.hasProjects && (
          <p className="text-sm text-red-600 flex items-center gap-1 mb-4" role="alert">
            <AlertCircle className="w-4 h-4" /> {errors.hasProjects}
          </p>
        )}
        {formData.hasProjects && (
          <FormTextarea
            label="Briefly describe your project(s) or share a link *"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.projectDescription}
            touched={touched.projectDescription}
            placeholder="Describe your project(s), your role, technologies used, and outcomes. Include GitHub, live demo, or drive links if available."
            rows={4}
          />
        )}
      </fieldset>
    </div>
  );
}

function Step4Resume({ formData, onChange, onBlur, errors, touched }: any) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-4">Resume & Portfolio</legend>
        <p className="text-gray-600 text-sm mb-6">
          Upload your resume to Google Drive and share the link with "Anyone with the link can view" access.
          Optionally share your portfolio, LinkedIn, or GitHub profile.
        </p>
        <FormField
          label="Resume Link (Google Drive) *"
          name="resumeLink"
          type="url"
          value={formData.resumeLink}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.resumeLink}
          touched={touched.resumeLink}
          placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          icon={<FileText className="w-4 h-4" />}
          helperText="Must be a viewable Google Drive link"
        />
        <FormField
          label="Portfolio / LinkedIn / GitHub Link"
          name="portfolioLink"
          type="url"
          value={formData.portfolioLink}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.portfolioLink}
          touched={touched.portfolioLink}
          placeholder="https://linkedin.com/in/... or https://github.com/... or your portfolio site"
          icon={<User className="w-4 h-4" />}
        />
      </fieldset>
    </div>
  );
}

function Step5Final({ formData, onChange, onBlur, errors, touched }: any) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-4">How Did You Hear About Us?</legend>
        <FormSelect
          label="Source *"
          name="heardFrom"
          value={formData.heardFrom}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.heardFrom}
          touched={touched.heardFrom}
          options={HEARD_FROM_OPTIONS}
          placeholder="Select an option"
        />
        {formData.heardFrom === 'Other' && (
          <FormField
            label="Please Specify *"
            name="customHeardFrom"
            value={formData.customHeardFrom}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.customHeardFrom}
            touched={touched.customHeardFrom}
            placeholder="How did you hear about InvertisPrep?"
            className="mt-4"
          />
        )}
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Availability</legend>
        <FormSelect
          label="Are you available for team meetings and tasks on a regular basis? *"
          name="availability"
          value={formData.availability}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.availability}
          touched={touched.availability}
          options={AVAILABILITY_OPTIONS}
          placeholder="Select your availability"
        />
      </fieldset>

      <fieldset className="pt-6 border-t border-gray-200">
        <legend className="text-sm font-medium text-gray-900 mb-4">Anything Else?</legend>
        <FormTextarea
          label="Anything else you'd like to tell us?"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={onChange}
          onBlur={onBlur}
          error={errors.additionalNotes}
          touched={touched.additionalNotes}
          placeholder="Any additional information, questions, or context you'd like to share (optional)"
          rows={3}
        />
      </fieldset>

      {/* Review Summary */}
      <div className="pt-6 border-t border-gray-200 bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Review Your Application</h3>
        <dl className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-500">Name</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.fullName || '—'}</dd>
            <dt className="text-gray-500">Email</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.email || '—'}</dd>
            <dt className="text-gray-500">WhatsApp</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.whatsappNumber || '—'}</dd>
            <dt className="text-gray-500">Role</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.appliedDomain || '—'}</dd>
            <dt className="text-gray-500">Semester</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.currentSemester || '—'}</dd>
            <dt className="text-gray-500">Location</dt>
            <dd className="col-span-2 font-medium text-gray-900">
              {formData.currentLocation === 'Other' ? formData.customLocation : formData.currentLocation || '—'}
            </dd>
            <dt className="text-gray-500">Hybrid</dt>
            <dd className="col-span-2 font-medium text-gray-900">{formData.hybridComfortable ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// --- Reusable Form Components ---

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  helperText?: string;
  className?: string;
}

function FormField({ label, name, type = 'text', value, onChange, onBlur, error, touched, placeholder, icon, helperText, className }: FormFieldProps) {
  const showError = !!(touched && error);
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-sm transition-colors ${
            showError
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500'
          }`}
          placeholder={placeholder}
          aria-invalid={showError}
          aria-describedby={showError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        />
      </div>
      {showError && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
      {!showError && helperText && (
        <p id={`${name}-helper`} className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  error?: string;
  touched?: boolean;
  options: string[];
  placeholder?: string;
}

function FormSelect({ label, name, value, onChange, onBlur, error, touched, options, placeholder }: FormSelectProps) {
  const showError = !!(touched && error);
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`w-full px-4 py-2.5 border rounded-md text-sm transition-colors appearance-none bg-white ${
          showError
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
        }`}
        aria-invalid={showError}
        aria-describedby={showError ? `${name}-error` : undefined}
      >
        <option value="" disabled>{placeholder || 'Select an option'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {showError && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  rows?: number;
  minLength?: number;
}

function FormTextarea({ label, name, value, onChange, onBlur, error, touched, placeholder, rows = 4, minLength }: FormTextareaProps) {
  const showError = !!(touched && error);
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        rows={rows}
        className={`w-full px-4 py-2.5 border rounded-md text-sm transition-colors resize-y ${
          showError
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500'
        }`}
        placeholder={placeholder}
        aria-invalid={showError}
        aria-describedby={showError ? `${name}-error` : minLength ? `${name}-hint` : undefined}
      />
      {showError && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
      {!showError && minLength && (
        <p id={`${name}-hint`} className="mt-1.5 text-sm text-gray-500">
          Minimum {minLength} characters • Current: {value.length}
        </p>
      )}
    </div>
  );
}

interface RadioOptionProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: boolean;
}

function RadioOption({ label, name, value, checked, onChange, onBlur, error }: RadioOptionProps) {
  return (
    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
      checked ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-4 h-4 text-black border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-invalid={error ? 'true' : 'false'}
      />
      <span className="text-sm text-gray-900">{label}</span>
    </label>
  );
}

interface DomainCardProps {
  domain: typeof DOMAINS[0];
  isSelected: boolean;
  onSelect: () => void;
  error?: boolean;
}

function DomainCard({ domain, isSelected, onSelect, error }: DomainCardProps) {
  const Icon = domain.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-4 border rounded-lg text-left transition-all ${
        isSelected
          ? 'border-black bg-gray-50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${error ? 'border-red-300' : ''}`}
      role="radio"
      aria-checked={isSelected}
      aria-label={domain.label}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-black' : 'bg-gray-100'
        }`}>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-700'}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
            {domain.label}
          </h4>
          <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
            {domain.description}
          </p>
        </div>
        {isSelected && (
          <Check className="w-5 h-5 text-black flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    </button>
  );
}