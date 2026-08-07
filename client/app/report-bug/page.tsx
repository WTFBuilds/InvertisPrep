'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle, 
  Send, 
  HelpCircle, 
  ArrowLeft, 
  Sparkles,
  Smartphone,
  Cpu,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bugApi } from '@/lib/api';
import Link from 'next/link';

// Animation variants
const letterContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const letterVariants: Variants = {
  hidden: { y: 60, opacity: 0, rotateX: -60 },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 100,
    },
  },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

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
      let browserName = "Unknown Browser";
      let osName = "Unknown OS";

      // Detect Browser
      if (ua.indexOf("Firefox") > -1) browserName = "Mozilla Firefox";
      else if (ua.indexOf("SamsungBrowser") > -1) browserName = "Samsung Internet";
      else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browserName = "Opera";
      else if (ua.indexOf("Trident") > -1) browserName = "Microsoft Internet Explorer";
      else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browserName = "Microsoft Edge";
      else if (ua.indexOf("Chrome") > -1) browserName = "Google Chrome";
      else if (ua.indexOf("Safari") > -1) browserName = "Apple Safari";

      // Detect OS
      if (ua.indexOf("Windows NT 10.0") > -1) osName = "Windows 10/11";
      else if (ua.indexOf("Windows NT 6.2") > -1) osName = "Windows 8";
      else if (ua.indexOf("Windows NT 6.1") > -1) osName = "Windows 7";
      else if (ua.indexOf("Macintosh") > -1) osName = "macOS";
      else if (ua.indexOf("Android") > -1) osName = "Android OS";
      else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) osName = "iOS";
      else if (ua.indexOf("Linux") > -1) osName = "Linux";

      setDeviceInfo({
        browser: browserName,
        device: osName
      });
    }
  }, []);

  // Autofill email when user state becomes available
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bugTitle || !formData.description || !formData.email) {
      setErrorMessage("Please fill out all required fields.");
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
      // Reset form title and description but keep email
      setFormData(prev => ({
        ...prev,
        bugTitle: '',
        description: '',
        severity: 'medium',
      }));

      // Return status to idle after 4 seconds
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to submit bug report. Please try again.");
      setStatus('error');
    }
  };

  const titleName = "Report a Bug";
  const titleLetters = Array.from(titleName);

  return (
    <div className="min-h-screen pt-12 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 overflow-x-hidden relative transition-colors duration-300">
      
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-[5%] w-[450px] h-[450px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute -top-[10%] right-[5%] w-[550px] h-[550px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2.5s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch w-full">
          
          {/* Left Column (Header & Form) */}
          <div className="lg:col-span-2 space-y-8 w-full">
            {/* Header info */}
            <div>
              {/* Navigation back */}
              <Link href="/support" className="inline-flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-semibold transition-colors mb-6 group cursor-pointer">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Support
              </Link>

              <div className="text-left">
                <motion.div 
                  variants={letterContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap justify-start items-center gap-x-1 sm:gap-x-2 select-none mb-3"
                >
                  {titleLetters.map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="text-3xl sm:text-5xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 drop-shadow-sm"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl"
                >
                  Encountered a bug or unexpected behavior? Let us know, and we'll investigate it immediately.
                </motion.p>
              </div>
            </div>

            {/* Main Form Card */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="w-full overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm"
            >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Bug Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bugTitle"
                  value={formData.bugTitle}
                  onChange={handleChange}
                  placeholder="e.g. Resume download button doesn't trigger"
                  required
                  disabled={status === 'submitting'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all bg-transparent text-slate-900 dark:text-zinc-100 disabled:bg-slate-50 dark:disabled:bg-zinc-950 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Explain how to reproduce the bug, what browser you were using, expected outcome vs actual outcome, and any console error messages."
                  rows={6}
                  required
                  disabled={status === 'submitting'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all bg-transparent text-slate-900 dark:text-zinc-100 disabled:bg-slate-50 dark:disabled:bg-zinc-950 placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                    Severity level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    disabled={status === 'submitting'}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 disabled:bg-slate-50 dark:disabled:bg-zinc-950 cursor-pointer"
                  >
                    <option value="low">Low - Minor issue / UI mismatch</option>
                    <option value="medium">Medium - Functional glitch</option>
                    <option value="high">High - Feature fully blocked</option>
                    <option value="critical">Critical - System crash / Data loss</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    disabled={status === 'submitting'}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all bg-transparent text-slate-900 dark:text-zinc-100 disabled:bg-slate-50 dark:disabled:bg-zinc-950 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                whileTap={{ scale: 0.99 }}
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Submitting...
                  </span>
                ) : (
                  <>
                    Submit Bug Report <Send className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Thank you for reporting!</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">We've saved the bug report and our team will investigate it.</p>
                    </div>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-900 dark:text-rose-300">Failed to Submit</h4>
                      <p className="text-xs text-rose-700 dark:text-rose-500 mt-0.5">{errorMessage || "Please fix input errors and try again."}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>

          {/* Right sidebar info */}
          <div className="lg:col-span-1 w-full lg:h-full flex flex-col gap-6">
            
            {/* Auto collected info card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm flex-1 flex flex-col justify-center"
            >
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Auto-Collected Specs
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                To help our engineers debug, we automatically detect your operating system and browser.
              </p>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <Monitor className="w-4 h-4 text-indigo-500" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">Browser</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">{deviceInfo.browser || "Detecting..."}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <Cpu className="w-4 h-4 text-pink-500" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">Operating System</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">{deviceInfo.device || "Detecting..."}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reporting Guide Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-br from-red-500/5 to-rose-500/5 dark:from-red-950/10 dark:to-rose-950/5 rounded-3xl border border-red-200/40 dark:border-red-900/40 p-6 shadow-sm flex-1 flex flex-col justify-center"
            >
              <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Bug Guidelines
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-600 dark:text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">✓</span>
                  <span><strong>Reproduce:</strong> Try to outline step-by-step how we can see the bug ourselves.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">✓</span>
                  <span><strong>Expected vs Actual:</strong> Describe what you expected to see vs what actually happened.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">✓</span>
                  <span><strong>Severity:</strong> Select "Critical" only for blockers that crash the site or prevent downloads completely.</span>
                </li>
              </ul>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
