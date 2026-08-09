'use client';

import { Mail, MapPin, Instagram, Linkedin, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spotlight } from '@/components/ui/spotlight';
import { GlowCard } from '@/components/ui/glow-card';
import { ContactForm, FAQGrid } from '@/components/ui/faq-accordion';

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/invertisprep.in/', chipClass: 'bg-pink-100 text-pink-600' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/invertisprep/', chipClass: 'bg-blue-100 text-blue-700' },
];

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'invertisprep@gmail.com',
    href: 'mailto:invertisprep@gmail.com',
    chipClass: 'bg-indigo-100 text-indigo-700',
    description: 'Our team typically responds within 24 hours.',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: 'Invertis University, Bareilly',
    href: 'https://maps.google.com/?q=Invertis+University+Bareilly',
    chipClass: 'bg-purple-100 text-purple-700',
    description: 'Bareilly, Uttar Pradesh, India',
  },
];

const quickLinks = [
  { name: 'Help & Support', href: '/support' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Cancellation & Refunds', href: '/cancellation-and-refunds' },
];

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Subtle professional light accent */}
      <Spotlight
        className="absolute inset-x-0 top-0 h-80 overflow-hidden"
        gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50.11%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 50.11%)"
        gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)"
      />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <Badge variant="indigo" className="mb-3">Get in Touch</Badge>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-500">
          Have questions or feedback? We&apos;d love to hear from you. Our team typically responds within 24 hours.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {contactInfo.map((info) => (
            <a key={info.title} href={info.href} target="_blank" rel="noopener noreferrer" className="block h-full">
              <GlowCard className="h-full rounded-2xl border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${info.chipClass}`}>
                    <info.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900">
                      {info.title}
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </h3>
                    <p className="mt-0.5 truncate font-medium text-slate-800">{info.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{info.description}</p>
                  </div>
                </div>
              </GlowCard>
            </a>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Send us a message</h2>
            <p className="mb-6 mt-1 text-slate-500">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6 sm:p-8">
              <ContactForm />
            </GlowCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6">
              <h3 className="mb-3 font-bold text-slate-900">Quick Links</h3>
              <Separator className="mb-3" />
              <div className="space-y-1">
                {quickLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="group flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-indigo-600">
                      {link.name}
                    </span>
                    <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500" />
                  </a>
                ))}
              </div>
            </GlowCard>

            {/* Social Links */}
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6">
              <h3 className="mb-3 font-bold text-slate-900">Connect With Us</h3>
              <Separator className="mb-3" />
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${social.chipClass}`}>
                      <social.icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{social.name}</span>
                  </a>
                ))}
              </div>
            </GlowCard>

            {/* Support Hours */}
            <GlowCard className="rounded-2xl border-slate-200 bg-white p-6">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Clock className="h-4 w-4 text-indigo-600" />
                Support Hours
              </h3>
              <Separator className="mb-3" />
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-semibold">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-slate-400">Closed</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">*IST (Indian Standard Time)</p>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative border-t border-slate-100 bg-slate-50/60 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-500">Quick answers to common questions</p>
          </div>
          <FAQGrid
            items={[
              {
                question: 'How do I sign up?',
                answer: 'Click the "Sign In" button and use your Google account to authenticate. Your account will be created automatically on first login.',
              },
              {
                question: 'Are PYQ papers free?',
                answer: 'Yes! All PYQ papers on InvertisPrep are completely free to download and use for educational purposes.',
              },
              {
                question: 'How do I download papers?',
                answer: 'Browse to the desired department, use filters to find papers, and click the "Download PDF" button to download.',
              },
              {
                question: 'Is my data safe?',
                answer: 'Yes, we use industry-standard security measures and OAuth 2.0 for authentication. See our Privacy Policy for details.',
              },
              {
                question: 'Can I upload papers?',
                answer: 'Only admin users can upload papers. If you\'d like to contribute, please contact us through this form.',
              },
              {
                question: 'How do I report an issue?',
                answer: 'Use this contact form or email us at invertisprep@gmail.com with details of the problem you\'re experiencing.',
              },
            ]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <GlowCard className="rounded-3xl border-slate-200 bg-white p-10 text-center sm:p-12">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Still have questions?</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-500">
            Can&apos;t find what you&apos;re looking for? Our support team is ready to help you with anything you need.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="bg-slate-900 px-8 py-6 text-base font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <a href="mailto:invertisprep@gmail.com">
                <Mail className="mr-2 h-5 w-5" />
                Email Us Directly
              </a>
            </Button>
            <Button asChild variant="outline" className="border-slate-300 px-8 py-6 text-base font-semibold text-slate-700 hover:bg-slate-100">
              <a href="/support">
                Visit Help Center
              </a>
            </Button>
          </div>
        </GlowCard>
      </section>
    </div>
  );
}
