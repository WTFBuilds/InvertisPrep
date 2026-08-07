'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Instagram, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { ContactForm, FAQGrid } from '@/components/ui/faq-accordion';

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/invertisprep.in/', color: 'from-pink-500 to-purple-600' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/invertisprep/', color: 'from-blue-600 to-blue-700' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/invertisprep', color: 'from-sky-500 to-sky-600' },
];

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'invertisprep@gmail.com',
    href: 'mailto:invertisprep@gmail.com',
    color: 'from-indigo-500 to-purple-600',
    description: 'Our team typically responds within 24 hours.',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: 'Invertis University, Bareilly',
    href: 'https://maps.google.com/?q=Invertis+University+Bareilly',
    color: 'from-purple-500 to-pink-600',
    description: 'Bareilly, Uttar Pradesh, India',
  },
];

const quickLinks = [
  { name: 'Help & Support', href: '/support' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Cancellation & Refunds', href: '/cancellation-and-refunds' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <BackgroundGradient className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
              Get in Touch
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Have questions or feedback? We&apos;d love to hear from you.
              Our team is here to help and typically responds within 24 hours.
            </p>
          </motion.div>
        </div>
      </BackgroundGradient>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {contactInfo.map((info, idx) => (
            <motion.div key={idx} variants={item}>
              <a href={info.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <info.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {info.title}
                          <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-gray-900 font-medium truncate">{info.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Send us a message
            </h2>
            <p className="text-gray-500 mb-8">
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </p>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <ContactForm />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Quick Links */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {link.name}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Connect With Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {socialLinks.map((social, idx) => (
                    <motion.a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <social.icon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">
                        {social.name}
                      </span>
                    </motion.a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support Hours */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Support Hours</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-gray-400">Closed</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  *IST (Indian Standard Time)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-lg">
              Quick answers to common questions
            </p>
          </motion.div>

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
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackgroundGradient className="rounded-3xl">
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-10 sm:p-12 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Still have questions?
                </h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                  Can&apos;t find what you&apos;re looking for? Our support team is ready to help you with anything you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-base"
                  >
                    <a href="mailto:invertisprep@gmail.com">
                      <Mail className="h-5 w-5 mr-2" />
                      Email Us Directly
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="px-8 py-6 text-base border-gray-200"
                  >
                    <a href="/support">
                      Visit Help Center
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </BackgroundGradient>
        </div>
      </section>
    </div>
  );
}