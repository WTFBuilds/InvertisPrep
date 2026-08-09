'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Send, HelpCircle, ArrowLeft, Sparkles, Smartphone, Cpu, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bugApi } from '@/lib/api';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';

export default function ReportBugPage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    bugTitle: '',
    description: '',
    severity: 'medium',
    email: '',
  });

  const [deviceInfo, setDeviceInfo] = useState({
    browser: '',
    device: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Detect browser & OS details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let browserName = 'Unknown Browser';
      let osName = 'Unknown OS';

      // Detect Browser
      if (ua.indexOf('Firefox') > -1) browserName = 'Mozilla Firefox';
      else if (ua.indexOf('SamsungBrowser') > -1) browserName = 'Samsung Internet';
      else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browserName = 'Opera';
      else if (ua.indexOf('Trident') > -1) browserName = 'Microsoft Internet Explorer';
      else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browserName = 'Microsoft Edge';
      else if (ua.indexOf('Chrome') > -1) browserName = 'Google Chrome';
      else if (ua.indexOf('Safari') > -1) browserName = 'Apple Safari';

      // Detect OS
      if (ua.indexOf('Windows NT 10.0') > -1) osName = 'Windows 10/11';
      else if (ua.indexOf('Windows NT 6.2') > -1) osName = 'Windows 8';
      else if (ua.indexOf('Windows NT 6.1') > -1) osName = 'Windows 7';
      else if (ua.indexOf('Macintosh') > -1) osName = 'macOS';
      else if (ua.indexOf('Android') > -1) osName = 'Android OS';
      else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) osName = 'iOS';
      else if (ua.indexOf('Linux') > -1) osName = 'Linux';

      setDeviceInfo({ browser: browserName, device: osName });
    }
  }, []);

  // Autofill email when user state becomes available
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bugTitle || !formData.description || !formData.email) {
      setErrorMessage('Please fill out all required fields.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await bugApi.create({
        title: formData.bugTitle,
        description: formData.description,
        severity: formData.severity,
        email: formData.email,
        browser: deviceInfo.browser,
        device: deviceInfo.device,
      });

      setStatus('success');
      setFormData((prev) => ({ ...prev, bugTitle: '', description: '', severity: 'medium' }));
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMessage(msg || 'Failed to submit bug report. Please try again.');
      setStatus('error');
    }
  };

  const inputClasses =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-rose-500/30 disabled:bg-slate-50';

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column (Header & Form) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header */}
            <div>
              <Link
                href="/support"
                className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Support
              </Link>

              <div className="text-left">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Help us improve</p>
                <h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Report a Bug
                  <Badge variant="destructive" className="ml-1">Beta</Badge>
                </h1>
                <p className="mt-2 max-w-xl leading-relaxed text-slate-500">
                  Encountered a bug or unexpected behavior? Let us know, and we&apos;ll investigate it immediately.
                </p>
              </div>
            </div>

            {/* Main Form Card */}
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Bug Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bugTitle"
                    value={formData.bugTitle}
                    onChange={handleChange}
                    placeholder="e.g. Resume download button doesn't trigger"
                    required
                    disabled={status === 'submitting'}
                    className={inputClasses}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Explain how to reproduce the bug, what browser you were using, expected outcome vs actual outcome, and any console error messages."
                    rows={6}
                    required
                    disabled={status === 'submitting'}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">
                      Severity level <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                      disabled={status === 'submitting'}
                      className={`${inputClasses} cursor-pointer`}
                    >
                      <option value="low">Low - Minor issue / UI mismatch</option>
                      <option value="medium">Medium - Functional glitch</option>
                      <option value="high">High - Feature fully blocked</option>
                      <option value="critical">Critical - System crash / Data loss</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">
                      Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      disabled={status === 'submitting'}
                      className={inputClasses}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      Submit Bug Report
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>

                {status === 'success' && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <h4 className="font-bold text-emerald-900">Thank you for reporting!</h4>
                      <p className="mt-0.5 text-xs text-emerald-700">We&apos;ve saved the bug report and our team will investigate it.</p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <h4 className="font-bold text-rose-900">Failed to Submit</h4>
                      <p className="mt-0.5 text-xs text-rose-700">{errorMessage || 'Please fix input errors and try again.'}</p>
                    </div>
                  </div>
                )}
              </form>
            </GlowCard>
          </div>

          {/* Right sidebar info */}
          <div className="flex flex-col gap-6">
            {/* Auto collected info card */}
            <GlowCard className="flex-1 rounded-2xl border-slate-200 bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Auto-Collected Specs
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">
                To help our engineers debug, we automatically detect your operating system and browser.
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Monitor className="h-4 w-4 text-indigo-500" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400">Browser</p>
                    <p className="text-xs font-bold text-slate-800">{deviceInfo.browser || 'Detecting...'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Cpu className="h-4 w-4 text-pink-500" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400">Operating System</p>
                    <p className="text-xs font-bold text-slate-800">{deviceInfo.device || 'Detecting...'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400">Device</p>
                    <p className="text-xs font-bold text-slate-800">{deviceInfo.device || 'Detecting...'}</p>
                  </div>
                </div>
              </div>
            </GlowCard>

            {/* Reporting Guide Card */}
            <GlowCard className="flex-1 rounded-2xl border-slate-200 bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-rose-600">
                <HelpCircle className="h-4 w-4" />
                Bug Guidelines
              </h3>
              <Separator className="mb-4" />
              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-rose-500">✓</span>
                  <span><strong>Reproduce:</strong> Try to outline step-by-step how we can see the bug ourselves.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-rose-500">✓</span>
                  <span><strong>Expected vs Actual:</strong> Describe what you expected to see vs what actually happened.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-rose-500">✓</span>
                  <span><strong>Severity:</strong> Select &quot;Critical&quot; only for blockers that crash the site or prevent downloads completely.</span>
                </li>
              </ul>
            </GlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}
