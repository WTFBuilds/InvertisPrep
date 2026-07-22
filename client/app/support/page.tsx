'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Badge } from '@/components/ui/badge';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { FAQAccordion } from '@/components/ui/faq-accordion';

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

const stats = [
  { label: 'Response Time', value: '< 24hrs', icon: Clock },
  { label: 'Resolution Rate', value: '95%', icon: CheckCircle },
  { label: 'Happy Users', value: '10K+', icon: Users },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Flatten all FAQ items for search
  const allItems = useMemo(
    () => categories.flatMap((cat) => cat.items),
    []
  );

  // Filter items based on search query
  const filteredCategories = useMemo(() => {
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

  // Show filtered results when searching, show all when idle
  const displayCategories = searchQuery.trim() ? filteredCategories : categories;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ─── Hero Section (Dark with Spotlight) ───────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-24 sm:py-32">
        <Spotlight
          className="absolute inset-0"
          gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 50.11%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50.11%)"
          gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)"
          spread={100}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Badge
              variant="secondary"
              className="mb-6 bg-white/10 text-indigo-300 border-indigo-500/30 backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              Help Center
            </Badge>
          </motion.div>

          <TextGenerateEffect
            words="How can we help you today?"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Find answers to common questions, troubleshoot issues, or reach out
            to our dedicated support team.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-12"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Search Bar ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-300 blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for answers... (e.g. 'how to download', 'QCoins', 'refund')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-5 text-lg border-0 focus:ring-0 focus:outline-none bg-transparent rounded-2xl text-gray-900 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

      {/* ─── Search Results Info ─────────────────────────────────────────── */}
      <AnimatePresence>
        {searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
          >
            <p className="text-sm text-gray-500">
              {displayCategories.reduce((acc, cat) => acc + cat.items.length, 0)}{' '}
              results found for{' '}
              <span className="font-semibold text-gray-900">&quot;{searchQuery}&quot;</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Category Quick Nav ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setActiveCategory(activeCategory === idx ? null : idx);
                  setSearchQuery('');
                  // Scroll to the category section
                  document
                    .getElementById(`category-${idx}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCategory === idx
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.title}
                <span className="text-xs text-gray-400">({cat.items.length})</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── FAQ Categories ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {displayCategories.map((category, idx) => {
            const catIndex = categories.findIndex((c) => c.title === category.title);
            return (
              <motion.div
                key={category.title}
                id={`category-${catIndex}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <GlowCard glowColor={category.glowColor} className="p-0">
                  <div className="p-6 sm:p-8">
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <motion.div
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                      >
                        <category.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {category.title}
                        </h2>
                        <p className="text-gray-500 text-sm mt-0.5">
                          {category.items.length} questions
                        </p>
                      </div>
                    </div>

                    {/* FAQ Items */}
                    <FAQAccordion items={category.items} />
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}

          {/* No results */}
          {displayCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn&apos;t find any answers matching your search. Try different
                keywords or{' '}
                <a href="/contact" className="text-indigo-600 hover:underline font-medium">
                  contact our team
                </a>{' '}
                directly.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Still Need Help CTA ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BackgroundGradient className="rounded-3xl">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Left — CTA */}
                  <div className="p-10 sm:p-12">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <MessageCircle className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600">
                          Get in Touch
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Still need help?
                      </h2>
                      <p className="text-gray-600 mb-8 leading-relaxed">
                        Our support team is available Monday to Friday, 9 AM to 6 PM
                        IST. We typically respond within 24 hours.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                        >
                          <a href="mailto:invertisprep@gmail.com">
                            <Mail className="h-4 w-4 mr-2" />
                            Email Support
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-gray-200"
                        >
                          <a href="/contact">
                            Contact Form
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right — Trust Indicators */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-10 sm:p-12">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="space-y-5"
                    >
                      {[
                        {
                          icon: CheckCircle,
                          title: 'Fast Response',
                          desc: 'Usually within 24 hours',
                          color: 'text-green-500',
                        },
                        {
                          icon: Users,
                          title: 'Expert Team',
                          desc: 'Dedicated support staff',
                          color: 'text-indigo-500',
                        },
                        {
                          icon: Sparkles,
                          title: 'Issue Resolution',
                          desc: '95% resolved on first contact',
                          color: 'text-purple-500',
                        },
                        {
                          icon: Shield,
                          title: 'Data Privacy',
                          desc: 'Your information is secure',
                          color: 'text-pink-500',
                        },
                      ].map((item, i) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-start gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white"
                        >
                          <item.icon
                            className={`h-5 w-5 ${item.color} mt-0.5 flex-shrink-0`}
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </BackgroundGradient>
          </motion.div>
        </div>
      </section>

      {/* ─── Quick Links ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Related Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, idx) => (
                <motion.a
                  key={idx}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                    <link.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors flex-1">
                    {link.name}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
