'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const customStyles = `
  @supports (animation-timeline: view()) {
    .reveal-text {
      animation: revealText linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 50%;
    }
    
    @keyframes revealText {
      from { opacity: 0; transform: translateY(100px) scale(0.95); filter: blur(8px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
    }
  }
`;

export default function Footer() {
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent('footerVisibilityChange', { 
            detail: { isVisible: entry.isIntersecting } 
          })
        );
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const footerLinks = {
    "Quick Links": [
      { name: "Home", path: "/" },
      { name: "Browse PYQ", path: "/pyq" },
      { name: "About", path: "/about" },
      { name: "Our Team", path: "/our-team" },
    ],
    "Resources": [
      { name: "Study Materials", path: "/resources" },
      { name: "Previous Year Papers", path: "/pyq" },
      { name: "Syllabus", path: "/resources/syllabus" },
    ],
    "Legal": [
      { name: "Terms and Conditions", path: "/terms-of-service" },
      { name: "Privacy Policy", path: "/privacy-policy" },
      { name: "Shipping Policy", path: "/shipping-policy" },
      { name: "Cancellation & Refunds", path: "/cancellation-and-refunds" },
      { name: "Contact Us", path: "/contact" },
    ],
    "Support": [
      { name: "Help & Support", path: "/support" },
    ],
  };

  // Hide footer on view pages
  if (pathname && (pathname.includes('/view/') || pathname.startsWith('/view/'))) {
    return null;
  }

  return (
    <footer ref={footerRef} className="relative bg-[#050505] text-white overflow-hidden min-h-screen flex flex-col justify-between border-t border-white/5">
      <style>{customStyles}</style>
      
      {/* Premium Visible Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Radial fade to soften the grid towards the edges to keep focus on center */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#050505_90%)]" />

      {/* Top Academic OS Label */}
      <div className="relative z-10 w-full pt-16 flex justify-center">
        <p className="text-[10px] md:text-xs font-semibold tracking-[0.5em] text-white/40 uppercase">
          [ Academic OS ]
        </p>
      </div>

      {/* Giant Flagship Brand Section Dominating Center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4 reveal-text py-20">
        <div className="flex flex-col items-center justify-center leading-[0.75] select-none text-center">
          <h1 className="text-[20vw] sm:text-[18vw] lg:text-[15vw] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 hover:scale-[1.02] transition-transform duration-700">
            INVERTIS
          </h1>
          <h1 className="text-[20vw] sm:text-[18vw] lg:text-[15vw] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white/90 to-white/20 hover:scale-[1.02] transition-transform duration-700">
            PREP<span className="text-white/20">.</span>
          </h1>
        </div>
      </div>

      {/* Existing Content Pushed to the Edges/Bottom */}
      <div className="relative z-10 w-full px-6 lg:px-12 pb-8 flex flex-col gap-12 bg-gradient-to-t from-[#050505] to-transparent pt-12">
        
        {/* Links Grid across bottom */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-12">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-block group">
              <span className="text-xl font-black tracking-tighter text-white group-hover:text-white/80 transition-colors">
                INVERTISPREP
              </span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
              Your gateway to academic excellence at Invertis University.
            </p>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={`${title}-${link.name}-${link.path}`}>
                    <Link
                      href={link.path}
                      className="text-xs text-white/40 hover:text-white transition-colors duration-300 block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30 tracking-widest uppercase border-t border-white/10 pt-6">
          <p>
            © {new Date().getFullYear()} InvertisPrep. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span>Founded & Developed by</span>
            <a
              href="https://www.linkedin.com/in/ahqaf-ali/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/80 transition-colors"
            >
              Ahqaf Ali
            </a>
            <span className="text-white/20">&amp;</span>
            <a
              href="/our-team"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/80 transition-colors"
            >
              Team
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}