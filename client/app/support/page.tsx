'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  Mail,
  ExternalLink,
  Search,
  Shield,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { FAQAccordion, ContactForm } from '@/components/ui/faq-accordion';

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
  {
    icon: HelpCircle,
    title: 'Getting Started',
    chipClass: 'bg-indigo-100 text-indigo-700',
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
    chipClass: 'bg-purple-100 text-purple-700',
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
    chipClass: 'bg-pink-100 text-pink-700',
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
    chipClass: 'bg-amber-100 text-amber-700',
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

const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

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
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      {/* Hero / Landing Title Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Help Center</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">FAQ &amp; Support</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-500">
          Have questions? We&apos;ve got answers. Explore our resources below or get in touch with support.
        </p>
      </section>

      {/* Search Bar Section */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for answers... (e.g. 'signup', 'papers', 'QCoins')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Nav pills */}
      <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveCategory(activeCategory === idx ? null : idx);
                setSearchQuery('');
                document
                  .getElementById(`category-${idx}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                activeCategory === idx
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.title}
              <span className="text-[10px] text-slate-400">({cat.items.length})</span>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Categories Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {displayCategories.map((category) => {
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
                <GlowCard glowColor={category.glowColor} className="rounded-2xl border-slate-200 bg-white p-6 sm:p-8">
                  {/* Category Header */}
                  <div className="mb-6 flex items-center gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.chipClass}`}>
                      <category.icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{category.title}</h2>
                      <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
                        {category.items.length} Question{category.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-2" />
                  <FAQAccordion items={category.items} />
                </GlowCard>
              </motion.div>
            );
          })}

          {/* No search results display */}
          {displayCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">No matching answers found</h3>
              <p className="mx-auto max-w-sm px-4 text-sm leading-relaxed text-slate-500">
                We couldn&apos;t find any results for your query. Try searching different keywords or check out support below.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Still Need Help CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
        >
          <GlowCard className="overflow-hidden rounded-3xl border-slate-200 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Form */}
              <div className="border-b border-slate-100 p-6 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">General Inquiry</span>
                </div>
                <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Still need help?</h2>
                <p className="mb-7 text-sm leading-relaxed text-slate-500 sm:text-base">
                  Our support team is available Monday to Friday. We typically respond within 24 hours to help you solve any issues.
                </p>

                <ContactForm />
              </div>

              {/* Right Indicators */}
              <div className="flex flex-col justify-center bg-slate-50/60 p-6 sm:p-10">
                <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trust Indicators
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Fast Response</h4>
                      <p className="text-xs text-slate-500">Under 24 hours average.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Expert Admins</h4>
                      <p className="text-xs text-slate-500">Experienced moderators.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">High Resolution</h4>
                      <p className="text-xs text-slate-500">95% tickets resolved.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Secure Data</h4>
                      <p className="text-xs text-slate-500">OAuth 2.0 encrypted flows.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </section>

      {/* Related Resources / Quick Links Section */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
        >
          <h2 className="mb-6 text-left text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Related Resources</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-indigo-50">
                  <link.icon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-500" />
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-700 transition-colors group-hover:text-indigo-600">
                  {link.name}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-400" />
              </a>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
