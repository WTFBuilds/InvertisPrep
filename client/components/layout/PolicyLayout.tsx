'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, FileText, Clock, Shield } from 'lucide-react';

interface PolicySection {
  id: string;
  title: string;
  children: React.ReactNode;
}

interface PolicyLayoutProps {
  title: string;
  description?: string;
  lastUpdated?: string;
  sections: PolicySection[];
  showBadge?: boolean;
  badgeText?: string;
}

export function PolicyLayout({
  title,
  description,
  lastUpdated,
  sections,
  showBadge = true,
  badgeText = 'Policy',
}: PolicyLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const scrollPosition = scrollContainerRef.current.scrollTop + 100;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
      
      // Show back to top button after scrolling
      if (scrollContainerRef.current.scrollTop > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      // Initial check
      handleScroll();
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              {showBadge && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  <FileText className="h-3 w-3 mr-1.5" />
                  {badgeText}
                </Badge>
              )}
              {lastUpdated && (
                <Badge variant="outline" className="text-gray-600 border-gray-200">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Last updated: {lastUpdated}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Table of Contents - Desktop Only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Table of Contents
              </h3>
              <nav aria-label="Table of contents">
                <ul className="space-y-1">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <Link
                        href={`#${section.id}`}
                        className={`block px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          activeSection === section.id
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(section.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                          setActiveSection(section.id);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full ${
                            activeSection === section.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {index + 1}
                          </span>
                          {section.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main ref={scrollContainerRef} className="lg:pr-8">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="space-y-6"
                  aria-labelledby={`${section.id}-title`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h2 
                        id={`${section.id}-title`}
                        className="text-2xl font-semibold text-gray-900 mb-4"
                      >
                        {section.title}
                      </h2>
                      <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                        {section.children}
                      </div>
                    </div>
                  </div>
                  {index < sections.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </section>
              ))}
            </div>

            {/* Acknowledgment / Footer Note */}
            <div className="mt-16 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Acknowledgment
              </h3>
              <p className="text-indigo-800 text-sm leading-relaxed">
                By using InvertisPrep, you acknowledge that you have read this policy and agree to be bound by all the terms and conditions contained herein.
              </p>
            </div>

            {/* Contact Info */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Contact Us
              </h3>
              <div className="text-gray-600 text-sm space-y-2">
                <p><strong>Email:</strong> invertisprep@gmail.com</p>
                <p><strong>Address:</strong> Invertis University, Bareilly, Uttar Pradesh, India</p>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Mobile Table of Contents */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[280px]">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Contents</h3>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
              {sections.length} sections
            </Badge>
          </div>
          <nav className="max-h-64 overflow-y-auto">
            <ul className="py-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <Link
                    href={`#${section.id}`}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(section.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      setActiveSection(section.id);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full ${
                        activeSection === section.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      {section.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}