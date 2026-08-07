'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function ResumeShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  


  // Hide the navbar when this section is in view by reusing the footer's event
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.dispatchEvent(
            new CustomEvent('footerVisibilityChange', { detail: { isVisible: true } })
          );
        } else {
          if (entry.boundingClientRect.top > 0) {
            window.dispatchEvent(
              new CustomEvent('footerVisibilityChange', { detail: { isVisible: false } })
            );
          }
        }
      },
      { threshold: 0, rootMargin: "-10px 0px 0px 0px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      window.dispatchEvent(
        new CustomEvent('footerVisibilityChange', { detail: { isVisible: false } })
      );
    };
  }, []);

  return (
    <section ref={containerRef} className="relative bg-zinc-50 pt-16 sm:pt-20 pb-24 sm:pb-32 overflow-hidden border-t border-zinc-100">
      <div className="w-full flex flex-col items-center justify-center">
        
        {/* The Entire Product Mockup Window */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-[90%] max-w-6xl rounded-xl md:rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden will-change-transform"
        >
          
          {/* Subtle inner glow for the glass frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10"></div>
          
          {/* Mac Window Controls Bar */}
          <div className="relative z-20 flex items-center border-b border-white/10 bg-zinc-900 px-4 py-3">
            {/* Authentic Mac Window Dots */}
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
              <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
              <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
            </div>
            <div className="mx-auto flex items-center justify-center rounded-md bg-zinc-800/80 px-3 py-1 text-xs text-zinc-400 border border-white/5">
              <FileText className="mr-1.5 h-3 w-3" />
              resume-builder.app
            </div>
            <div className="w-[52px]"></div>
          </div>

          {/* App Wireframe UI */}
          <div className="flex flex-col md:flex-row h-[60vh] max-h-[750px] bg-zinc-950 relative z-0">
            
            {/* Sidebar (Form Controls) - Minimal monochrome styling */}
            <div className="hidden md:flex w-1/4 min-w-[280px] flex-col border-r border-white/10 bg-zinc-900/20 p-6 lg:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Content Sections</h3>
              </div>
              
              <div className="space-y-3">
                {['Personal Details', 'Professional Summary', 'Experience', 'Education', 'Skills', 'Projects'].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border px-4 py-4 ${i === 2 ? 'border-zinc-500/30 bg-zinc-500/10' : 'border-white/5 bg-white/5'}`}>
                    <CheckCircle2 className={`h-4 w-4 ${i === 2 ? 'text-zinc-300' : 'text-zinc-600'}`} />
                    <span className={`text-sm ${i === 2 ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <div className="h-12 w-full rounded-lg bg-zinc-200 opacity-90 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>
              </div>
            </div>

            {/* Main Area (Document Preview) */}
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] p-4 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              {/* Real Developer Resume Paper */}
              <div className="relative h-[110%] w-[95%] sm:w-[90%] max-w-[500px] rounded-sm bg-white shadow-2xl p-6 md:p-8 flex flex-col gap-3 md:gap-4 overflow-hidden text-zinc-800 font-sans">
                
                {/* Header */}
                <div className="text-center border-b border-zinc-200 pb-3 md:pb-4">
                  <h1 className="text-base md:text-xl font-bold uppercase tracking-wide text-zinc-900 mb-1">Alex Developer</h1>
                  <p className="text-[8px] md:text-[10px] text-zinc-600">
                    alex.developer@email.com • (555) 123-4567 • github.com/alexdev • linkedin.com/in/alexdev
                  </p>
                </div>
                
                {/* Summary */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-100 pb-0.5">Professional Summary</h2>
                  <p className="text-[7px] md:text-[9px] leading-relaxed text-zinc-700">
                    Results-driven Full Stack Engineer with 4+ years of experience building scalable web applications. Proficient in React, Next.js, and Node.js. Passionate about performance optimization, clean code architecture, and mentoring junior developers to achieve engineering excellence.
                  </p>
                </div>

                {/* Experience */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-100 pb-0.5">Experience</h2>
                  
                  {/* Job 1 */}
                  <div className="mb-1.5 md:mb-2">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[8px] md:text-[10px] font-semibold text-zinc-900">Senior Frontend Engineer — TechCorp</h3>
                      <span className="text-[7px] md:text-[9px] text-zinc-500 font-medium">Jan 2022 - Present</span>
                    </div>
                    <ul className="list-disc list-inside text-[7px] md:text-[9px] text-zinc-700 space-y-0.5 leading-relaxed ml-1">
                      <li>Architected and launched a new React-based dashboard serving over 1M+ active monthly users.</li>
                      <li>Reduced application bundle size by 45% utilizing dynamic imports and Webpack optimization strategies.</li>
                      <li>Spearheaded the migration from REST APIs to GraphQL, improving data fetching efficiency by 30%.</li>
                    </ul>
                  </div>

                  {/* Job 2 */}
                  <div>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[8px] md:text-[10px] font-semibold text-zinc-900">Software Engineer — WebSolutions Inc.</h3>
                      <span className="text-[7px] md:text-[9px] text-zinc-500 font-medium">Aug 2019 - Dec 2021</span>
                    </div>
                    <ul className="list-disc list-inside text-[7px] md:text-[9px] text-zinc-700 space-y-0.5 leading-relaxed ml-1">
                      <li>Developed and maintained multiple full-stack features using Node.js, Express, and Next.js.</li>
                      <li>Implemented automated CI/CD pipelines using GitHub Actions, cutting deployment time by half.</li>
                      <li>Collaborated with design teams to build a comprehensive UI component library using Tailwind CSS.</li>
                    </ul>
                  </div>
                </div>

                {/* Education */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-100 pb-0.5">Education</h2>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[8px] md:text-[10px] font-semibold text-zinc-900">B.Tech in Computer Science — XYZ University</h3>
                    <span className="text-[7px] md:text-[9px] text-zinc-500 font-medium">2015 - 2019</span>
                  </div>
                  <p className="text-[7px] md:text-[9px] text-zinc-700 mt-0.5">GPA: 3.8/4.0 | Dean's List (All Semesters)</p>
                </div>

                {/* Skills */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-100 pb-0.5">Technical Skills</h2>
                  <p className="text-[7px] md:text-[9px] leading-relaxed text-zinc-700">
                    <span className="font-semibold text-zinc-900">Languages:</span> JavaScript (ES6+), TypeScript, Python, HTML5, CSS3<br/>
                    <span className="font-semibold text-zinc-900">Frameworks:</span> React, Next.js, Node.js, Express, Tailwind CSS<br/>
                    <span className="font-semibold text-zinc-900">Tools:</span> Git, GitHub Actions, AWS, Docker, Webpack, Figma
                  </p>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated Headline - Reveals below card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 text-center px-4 w-full mt-12 md:mt-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 max-w-4xl mx-auto leading-[1.2] md:leading-[1.3]">
            Create ATS-friendly <br className="hidden sm:block" />
            <span className="relative inline-block mt-1">
              <span className="relative z-10 bg-[#facc15] text-zinc-900 font-medium tracking-normal px-3 md:px-5 py-0.5 md:py-1 rounded-md md:rounded-lg inline-block transform -rotate-1 shadow-md">
                resumes in minutes.
              </span>
              
              {/* Minimal Hand-drawn Sparks */}
              <svg 
                className="absolute -right-4 -top-2 md:-right-6 md:-top-3 w-6 h-6 md:w-8 md:h-8 text-indigo-600 transform rotate-12" 
                viewBox="0 0 60 60" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10,25 C20,15 35,10 45,5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <path d="M5,35 C20,32 40,32 50,32" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <path d="M10,45 C20,50 35,50 45,55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </h2>
        </motion.div>
      </div>
    </section>
  );
}
