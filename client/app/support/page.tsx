'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  Mail,
  ExternalLink,
  Search,
  Shield,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { GlowCard } from '@/components/ui/glow-card';
import { FAQAccordion, ContactForm } from '@/components/ui/faq-accordion';

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
  {
    icon: HelpCircle,
    title: 'Getting Started',
    color: 'from-indigo-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    items: [
      {
        question: 'How do I sign up for InvertisPrep?',
        answer: 'Click the "Sign In" button on the top right and use your Google account to authenticate. Your account will be created automatically on first login. It takes just one click!',
      },
      {
        question: 'What can I do on InvertisPrep?',
        answer: 'You can browse and download Previous Year Question Papers (PYQs), access study materials, view syllabi, use our Resume Builder, and track your academic progress.',
      },
      {
        question: 'Is InvertisPrep free to use?',
        answer: 'Yes! Browsing PYQs, downloading papers, and using the basic Resume Builder are completely free. Premium features like watermark-free resume exports use our QCoins virtual currency.',
      },
      {
        question: 'What are QCoins?',
        answer: 'QCoins are our virtual currency used for premium features like downloading clean (watermark-free) resumes. You can earn free downloads or purchase QCoin packs.',
      },
    ],
  },
  {
    icon: BookOpen,
    title: 'PYQ Papers & Study Materials',
    color: 'from-purple-500 to-pink-600',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    items: [
      {
        question: 'How do I download PYQ papers?',
        answer: 'Navigate to the PYQ section, select your department and semester, use filters to find specific papers, and click the "Download PDF" button. It\'s that simple!',
      },
      {
        question: 'Are the papers accurate and up-to-date?',
        answer: 'Our team verifies all papers before publishing. We source them from official university examinations and ensure they\'re accurately labeled by subject, year, and exam type.',
      },
      {
        question: 'Can I request a specific paper?',
        answer: 'Yes! If you can\'t find a paper you need, contact us through the Contact page or email us at invertisprep@gmail.com with the paper details.',
      },
      {
        question: 'Can I upload papers to help other students?',
        answer: 'Currently, only verified admin users can upload papers. However, we\'re working on a community contribution feature. If you have papers to share, please contact us.',
      },
    ],
  },
  {
    icon: Shield,
    title: 'Account & Security',
    color: 'from-pink-500 to-rose-600',
    glowColor: 'rgba(236, 72, 153, 0.15)',
    items: [
      {
        question: 'Is my data safe on InvertisPrep?',
        answer: 'Absolutely. We use industry-standard security measures, OAuth 2.0 for authentication, and encrypted data storage. We never share your personal information with third parties.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Since we use Google OAuth for authentication, you don\'t have a separate password. Simply sign in with your Google account. If you\'re having trouble, make sure you\'re using the correct Google account.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'To delete your account, email us at invertisprep@gmail.com with your request. We\'ll process the deletion and remove all your data within 48 hours.',
      },
      {
        question: 'Can I change my email address?',
        answer: 'Your email is tied to your Google account. To change it, you\'d need to use a different Google account. Contact support if you need to migrate your data.',
      },
    ],
  },
  {
    icon: AlertCircle,
    title: 'Troubleshooting',
    color: 'from-orange-500 to-red-600',
    glowColor: 'rgba(249, 115, 22, 0.15)',
    items: [
      {
        question: 'I can\'t log in with Google. What should I do?',
        answer: 'Try these steps: 1) Clear your browser cache and cookies. 2) Make sure you\'re using the correct Google account. 3) Disable any ad blockers. 4) Try a different browser. If the issue persists, contact us.',
      },
      {
        question: 'Papers won\'t download. How do I fix this?',
        answer: 'Check your internet connection and ensure pop-ups are not blocked for our site. Try a different browser or device. If the issue persists, the paper might be temporarily unavailable — try again in a few minutes.',
      },
      {
        question: 'The Resume Builder isn\'t working properly.',
        answer: 'Make sure you\'re using a modern browser (Chrome, Firefox, Safari, or Edge). Clear your browser cache and refresh the page. If issues persist, try using the Resume Builder in an incognito/private window.',
      },
      {
        question: 'I was charged but didn\'t receive QCoins.',
        answer: 'Payment processing can take up to 5 minutes. If QCoins don\'t appear after that, contact us with your payment confirmation email or transaction ID, and we\'ll resolve it immediately.',
      },
    ],
  },
];

const quickLinks = [
  { name: 'Terms of Service', href: '/terms-of-service', icon: BookOpen },
  { name: 'Privacy Policy', href: '/privacy-policy', icon: Shield },
  { name: 'Shipping Policy', href: '/shipping-policy', icon: ExternalLink },
  { name: 'Cancellation & Refunds', href: '/cancellation-and-refunds', icon: ExternalLink },
  { name: 'Contact Us', href: '/contact', icon: Mail },
];

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
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const brandName = "FAQ & Support";
  const brandLetters = Array.from(brandName);

  // Filter items based on search query
  const displayCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen pt-16 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 overflow-x-hidden relative transition-colors duration-300">

      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-[5%] w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute -top-[10%] right-[5%] w-[550px] h-[550px] bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2.5s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Hero / Landing Title Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0 w-full text-left">
        {/* Text Landing Animation */}
        <motion.div
          variants={letterContainerVariants}
          initial="hidden"
          animate="visible"
          className="mb-4 flex flex-wrap justify-start items-center gap-x-1 sm:gap-x-2 select-none"
        >
          {brandLetters.map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-4xl sm:text-7xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 drop-shadow-sm"
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
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-base sm:text-lg text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8"
        >
          Have questions? We've got answers. Explore our resources below or get in touch with support.
        </motion.p>
      </section>

      {/* Search Bar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="max-w-3xl"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-pink-500 to-blue-500 rounded-2xl opacity-25 group-hover:opacity-45 transition duration-300 blur-sm" />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200/50 dark:border-zinc-800/80">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search for answers... (e.g. 'signup', 'papers', 'QCoins')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-12 py-4.5 text-base sm:text-lg border-0 focus:ring-0 focus:outline-none bg-transparent rounded-2xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Category Nav pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap gap-2.5"
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveCategory(activeCategory === idx ? null : idx);
                setSearchQuery('');
                // Scroll to category
                document
                  .getElementById(`category-${idx}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border cursor-pointer ${activeCategory === idx
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm'
                }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.title}
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">({cat.items.length})</span>
            </button>
          ))}
        </motion.div>
      </section>

      {/* FAQ Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="space-y-10">
          {displayCategories.map((category, idx) => {
            const catIndex = categories.findIndex((c) => c.title === category.title);
            return (
              <motion.div
                key={category.title}
                id={`category-${catIndex}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeInUp}
              >
                <GlowCard glowColor={category.glowColor} className="p-0 border border-slate-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 sm:p-8">
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-md`} >
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                          {category.title}
                        </h2>
                        <p className="text-slate-400 dark:text-zinc-500 text-xs sm:text-sm mt-0.5">
                          {category.items.length} Questions
                        </p>
                      </div>
                    </div>

                    {/* FAQ Items Accordion list */}
                    <FAQAccordion items={category.items} />
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}

          {/* No search results display */}
          {displayCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 max-w-xl mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-zinc-700">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No matching answers found
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto px-4 leading-relaxed">
                We couldn't find any results for your query. Try searching different keywords or check out support below.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Still Need Help CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <BackgroundGradient className="rounded-3xl p-0.5 overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* Left Form */}
                <div className="p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-slate-200/50 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <MessageCircle className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      General Inquiry
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                    Still need help?
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
                    Our support team is available Monday to Friday. We typically respond within 24 hours to help you solve any issues.
                  </p>

                  {/* Reuse importable ContactForm */}
                  <ContactForm />
                </div>

                {/* Right Indicators */}
                <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/20 to-transparent dark:from-indigo-950/20 dark:via-zinc-950/40 p-8 sm:p-12 flex flex-col justify-center">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 dark:bg-pink-500/5 text-pink-600 dark:text-pink-400 text-xs font-semibold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Trust Indicators
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/40 dark:border-zinc-800 shadow-sm">
                        <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Fast Response</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">Under 24 hours average.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/40 dark:border-zinc-800 shadow-sm">
                        <Users className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Expert Admins</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">Experienced moderators.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/40 dark:border-zinc-800 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">High Resolution</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">95% tickets resolved.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/40 dark:border-zinc-800 shadow-sm">
                        <Shield className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Secure Data</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">OAuth 2.0 encrypted flows.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </BackgroundGradient>
        </motion.div>
      </section>

      {/* Related Resources / Quick Links Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight text-left">
            Related Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 flex items-center justify-center transition-colors">
                  <link.icon className="h-5 w-5 text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1">
                  {link.name}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </a>
            ))}
          </div>
        </motion.div>
      </section>

    </div>
  );
}
