'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  Target,
  FileCheck,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  BarChart3,
  Briefcase,
  Sliders,
  Printer,
  ShieldCheck,
  TrendingUp,
  Bot
} from 'lucide-react';
import { DOMAINS, DomainProfile, GeminiATSAnalysisResult } from '@/lib/ats-domains';

// Sample resumes for instant 1-click test
const SAMPLE_RESUMES: Record<string, string> = {
  fullstack: `ALEX R. RIVERA
Email: alex.rivera@email.com | Phone: +1 (555) 234-5678 | GitHub: github.com/alexrivera | LinkedIn: linkedin.com/in/alexrivera

SUMMARY
Results-oriented Full Stack Web Developer with 3+ years of experience building modern web applications using React, Next.js, Node.js, and TypeScript. Proven track record in optimizing web performance, designing REST APIs, and scaling database architectures.

TECHNICAL SKILLS
• Languages: JavaScript (ES6+), TypeScript, Python, HTML5, CSS3, SQL
• Frontend: React.js, Next.js, Tailwind CSS, Redux Toolkit, Framer Motion
• Backend: Node.js, Express.js, REST API, GraphQL, MongoDB, PostgreSQL, Redis
• Tools & Cloud: Git, Docker, AWS (S3, EC2), Postman, Jest, CI/CD GitHub Actions

EXPERIENCE
Full Stack Developer | NexaTech Solutions | 2022 - Present
• Engineered and maintained 8+ enterprise web applications using React, Next.js, and Node.js, serving 45,000+ monthly active users.
• Architected scalable RESTful API microservices that decreased server response latency by 38% through Redis query caching.
• Integrated PostgreSQL and Prisma ORM data schemas, reducing database query overhead by 25%.
• Automated deployment workflows with GitHub Actions CI/CD pipelines, cutting deployment cycle times from 40 minutes to 6 minutes.

Frontend Software Engineer | Apex Digital Studio | 2021 - 2022
• Developed 15+ responsive client UI interfaces using React and Tailwind CSS with 98% Lighthouse accessibility scores.
• Optimized client-side bundle sizes by 42% through code splitting and tree-shaking, resulting in 1.2s faster page load times.
• Collaborated with UX designers in Figma and implemented agile sprints with Jira.

PROJECTS
• CloudDocs – Real-time Collaborative Document Editor (Next.js, TypeScript, WebSockets, MongoDB)
  Built real-time cursor sync handling 100+ concurrent edits per room; deployed to Vercel with 99.9% uptime.
• E-Commerce Microservices Engine (Node.js, Express, Stripe, Docker, Redis)
  Engineered secure checkout workflow processing $120k+ mock transactions with full unit test coverage using Jest.

EDUCATION
B.S. in Computer Science | Invertis University | 2018 - 2022 (GPA: 3.8/4.0)`,

  aiml: `PRIYA SHARMA
Email: priya.sharma@aimltech.io | Phone: +91 98765 43210 | GitHub: github.com/priyasharma-ai | Portfolio: priyasharma.dev

SUMMARY
AI / Machine Learning Engineer specializing in Deep Learning, Natural Language Processing, and LLM fine-tuning. Experienced with PyTorch, Hugging Face, LangChain, and RAG systems. Passionate about deploying production-grade AI models with low latency.

TECHNICAL SKILLS
• Core: Python, Machine Learning, Deep Learning, NLP, Prompt Engineering
• Frameworks: PyTorch, TensorFlow, Scikit-learn, Hugging Face Transformers, LangChain
• Data & MLOps: NumPy, Pandas, Vector DBs (Chroma, Pinecone), Docker, MLflow, FastAPI
• Databases: PostgreSQL, MongoDB, Redis

EXPERIENCE
Machine Learning Engineer | Cognitive AI Labs | 2023 - Present
• Designed and deployed a Retrieval-Augmented Generation (RAG) pipeline utilizing LangChain, Pinecone, and Llama 3, boosting query answer relevance by 45%.
• Fine-tuned BERT and RoBERTa models for domain-specific sentiment analysis, achieving a 94.2% F1-score across 500k+ customer feedback records.
• Decreased model inference latency by 55% using TensorRT and ONNX runtime optimizations on AWS EC2 GPU instances.

Data Science Intern | DataVibe Analytics | 2022 - 2023
• Built predictive classification models in Scikit-learn to forecast customer churn with 89% precision.
• Created automated data preprocessing pipelines in Pandas and NumPy handling 2M+ tabular rows daily.

PROJECTS
• MediScan AI – Medical X-Ray Anomaly Detection (PyTorch, ResNet-50, FastAPI)
  Trained deep convolutional network with 96.5% accuracy on NIH dataset; containerized API with Docker.
• Enterprise Knowledge Chatbot (FastAPI, LangChain, ChromaDB, OpenAI API)
  Integrated semantic document search over 50,000 internal PDF documentation pages.

EDUCATION
B.Tech in Computer Science & Engineering | Invertis University | 2019 - 2023`
};

export default function ATSResumeAnalyserPage() {
  const [selectedDomain, setSelectedDomain] = useState<DomainProfile>(DOMAINS[0]);
  const [experienceLevel, setExperienceLevel] = useState('1-3 years');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [customJD, setCustomJD] = useState('');
  const [showJDInput, setShowJDInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<GeminiATSAnalysisResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    { title: 'Connecting to Gemini AI Engine', detail: 'Initializing Google Gemini intelligence pipeline...' },
    { title: 'Semantic Document Parsing', detail: 'Extracting candidate skills, experience blocks, and achievements...' },
    { title: 'Target Domain Benchmark', detail: 'Comparing resume profile against top industry hiring filters...' },
    { title: 'Impact & STAR Evaluation', detail: 'Evaluating action verb metrics and quantitative deliverables...' },
    { title: 'Generating Actionable Scorecard', detail: 'Synthesizing final ATS score and tailored bullet rewrites...' },
  ];

  // Handle file drop / upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);

    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      setResumeText(text);
    } else if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let binaryStr = '';
        const len = Math.min(uint8Array.length, 500000);
        for (let i = 0; i < len; i++) {
          const charCode = uint8Array[i];
          if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
            binaryStr += String.fromCharCode(charCode);
          } else {
            binaryStr += ' ';
          }
        }

        const cleanedText = binaryStr
          .replace(/stream[\s\S]*?endstream/g, ' ')
          .replace(/[\\/()[\]{}<>]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanedText.length > 100) {
          setResumeText(cleanedText);
        } else {
          const text = await file.text();
          setResumeText(text || `[Uploaded PDF: ${file.name}]`);
        }
      } catch (err) {
        console.warn('PDF parsing fallback:', err);
        setResumeText(`[Document File: ${file.name} - Ready for Evaluation]`);
      }
    } else {
      const text = await file.text();
      setResumeText(text);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (type: 'fullstack' | 'aiml') => {
    setResumeText(SAMPLE_RESUMES[type]);
    setFileName(`Sample_${type === 'fullstack' ? 'FullStack_Developer' : 'AIML_Engineer'}.txt`);
    if (type === 'fullstack') {
      setSelectedDomain(DOMAINS[0]);
    } else {
      const aimlDomain = DOMAINS.find(d => d.id === 'ai-ml') || DOMAINS[0];
      setSelectedDomain(aimlDomain);
    }
    setErrorMsg(null);
  };

  // Run Gemini AI Analysis
  const runAnalysis = async () => {
    if (!resumeText.trim()) {
      setErrorMsg('Please upload a resume or paste your resume content before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep(0);
    setLoadingProgress(10);
    setErrorMsg(null);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 400);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    try {
      const response = await fetch('/api/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          domainId: selectedDomain.id,
          customJobDescription: customJD,
          experienceLevel,
        }),
      });

      const data = await response.json();

      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setLoadingProgress(100);
      setLoadingStep(loadingSteps.length - 1);

      setTimeout(() => {
        setIsAnalyzing(false);
        if (data.success && data.data) {
          setAnalysisResult(data.data);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        } else {
          setErrorMsg(data.error || 'Unable to complete analysis. Please try again.');
        }
      }, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      const message = err instanceof Error ? err.message : 'Network error during analysis.';
      setErrorMsg(message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-zinc-800 selection:text-white print:min-h-0 print:h-auto print:overflow-visible print:bg-white print:text-zinc-950">
      {/* Print Specific CSS Overrides */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm 12mm;
            size: A4 portrait;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #09090b !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            font-size: 10.5pt !important;
          }
          nav, footer, .no-print, [class*="no-print"] {
            display: none !important;
          }

          /* Print Container */
          .ats-score-printable {
            display: block !important;
            visibility: visible !important;
            background: #ffffff !important;
            color: #09090b !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .ats-score-printable * {
            visibility: visible !important;
          }

          /* Hero Section in Print: Clean 2-column flex */
          .ats-print-hero {
            display: flex !important;
            flex-direction: row !important;
            align-items: stretch !important;
            gap: 16px !important;
            width: 100% !important;
            margin-bottom: 14px !important;
          }
          .ats-print-score-card {
            width: 34% !important;
            min-width: 34% !important;
            max-width: 34% !important;
            background-color: #f4f4f5 !important;
            border: 1px solid #d4d4d8 !important;
            border-radius: 12px !important;
            padding: 16px !important;
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .ats-print-breakdown-card {
            width: 64% !important;
            flex: 1 !important;
            background-color: #ffffff !important;
            border: 1px solid #d4d4d8 !important;
            border-radius: 12px !important;
            padding: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          /* 2-Column Grid Sections in Print */
          .ats-print-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 14px !important;
            width: 100% !important;
            margin-bottom: 14px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Full Width Cards in Print */
          .ats-print-card {
            background-color: #ffffff !important;
            border: 1px solid #d4d4d8 !important;
            border-radius: 12px !important;
            padding: 14px 16px !important;
            color: #09090b !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 14px !important;
            width: 100% !important;
          }

          /* Meta Stats Strip in Print */
          .ats-print-stats-row {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 8px !important;
            width: 100% !important;
            margin-top: 12px !important;
            padding-top: 10px !important;
            border-top: 1px solid #e4e4e7 !important;
          }
          .ats-print-stat-item {
            flex: 1 !important;
            background-color: #f4f4f5 !important;
            border: 1px solid #e4e4e7 !important;
            border-radius: 8px !important;
            padding: 6px 8px !important;
            text-align: center !important;
          }

          /* Skills Badges in Print */
          .ats-print-badges-wrap {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            margin-top: 8px !important;
          }
          .print-badge-matched {
            background-color: #f4f4f5 !important;
            color: #09090b !important;
            border: 1px solid #a1a1aa !important;
            padding: 3px 8px !important;
            border-radius: 6px !important;
            font-size: 8.5pt !important;
            font-weight: 600 !important;
          }
          .print-badge-missing {
            background-color: #ffffff !important;
            color: #71717a !important;
            border: 1px dashed #d4d4d8 !important;
            padding: 3px 8px !important;
            border-radius: 6px !important;
            font-size: 8.5pt !important;
            font-weight: 500 !important;
          }
          .print-badge-soft {
            background-color: #f4f4f5 !important;
            color: #27272a !important;
            border: 1px solid #d4d4d8 !important;
            padding: 2px 7px !important;
            border-radius: 5px !important;
            font-size: 8pt !important;
          }

          /* Progress Bars in Print */
          .print-progress-bar {
            background-color: #e4e4e7 !important;
            height: 6px !important;
            border-radius: 9999px !important;
            overflow: hidden !important;
          }
          .print-progress-fill {
            background-color: #18181b !important;
            height: 100% !important;
          }
        }
      `}</style>

      {/* Subtle Background Grid Pattern (Hidden on Print) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print print:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 print:p-0 print:m-0 print:max-w-none">
        {/* Top Header (Hidden on Print) */}
        <div className="flex flex-col items-center text-center space-y-3 max-w-4xl mx-auto mb-10 no-print print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs font-semibold tracking-wider uppercase shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>AI Resume Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            ATS SCORE CHECKER
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl">
            Evaluate your resume against industry Applicant Tracking Systems with precision benchmarking and actionable recommendations.
          </p>
        </div>

        {/* ================= MAIN INTERFACE (Hidden on Print) ================= */}
        {!analysisResult && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print print:hidden">
            {/* Left Column: Domain & Role Selector */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-800 mb-5">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                    <Briefcase className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Target Job Domain</h2>
                    <p className="text-xs text-zinc-400">Select your target career path</p>
                  </div>
                </div>

                {/* Domain Selector Grid */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {DOMAINS.map((domain) => {
                    const isSelected = selectedDomain.id === domain.id;
                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => setSelectedDomain(domain)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 ${isSelected
                            ? 'border-white bg-zinc-900 text-white ring-1 ring-white/20'
                            : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                          }`}
                      >
                        <span className="text-2xl pt-0.5">{domain.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {domain.name}
                            </span>
                            {isSelected && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{domain.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {domain.coreSkills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected
                                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                  }`}
                              >
                                {skill}
                              </span>
                            ))}
                            {domain.coreSkills.length > 4 && (
                              <span className="text-[10px] text-zinc-500 pt-0.5">
                                +{domain.coreSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Experience Level Selector */}
                <div className="mt-5 pt-4 border-t border-zinc-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Fresher', '1-3 years', '3-5 years', '5+ years'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setExperienceLevel(level)}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${experienceLevel === level
                            ? 'border-white bg-white text-black font-bold'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Job Description */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowJDInput(!showJDInput)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-zinc-400" />
                      Add Custom Job Description (Optional)
                    </span>
                    {showJDInput ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>

                  {showJDInput && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-zinc-400">
                        Paste target job description to benchmark directly against company requirements.
                      </p>
                      <textarea
                        value={customJD}
                        onChange={(e) => setCustomJD(e.target.value)}
                        placeholder="Paste target job description requirements, responsibilities, or qualifications here..."
                        rows={4}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 custom-scrollbar"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Instant 1-Click Samples */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Try sample test resumes:</p>
                  <p className="text-[11px] text-zinc-500">Test analysis immediately with 1 click</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadSample('fullstack')}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  >
                    Full Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample('aiml')}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  >
                    AI / ML
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Upload Resume & Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl">
                {/* Tabs: Upload File vs Paste Text */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Your Resume</h2>
                      <p className="text-xs text-zinc-400">Upload document or paste text</p>
                    </div>
                  </div>

                  <div className="flex rounded-lg border border-zinc-800 bg-black p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTab === 'upload'
                          ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('paste')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTab === 'paste'
                          ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {/* Upload Zone */}
                {activeTab === 'upload' ? (
                  <div className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-zinc-800 bg-black p-8 text-center transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900/40"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 group-hover:scale-105 group-hover:border-zinc-600 group-hover:text-white transition-all duration-200">
                        <UploadCloud className="size-7 stroke-[1.75]" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-zinc-200 group-hover:text-white">
                        {fileName ? (
                          <span className="text-white font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="size-4 text-zinc-400" /> {fileName}
                          </span>
                        ) : (
                          'Drag & drop your resume here, or browse files'
                        )}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Supports PDF, TXT, DOCX files (Up to 10MB)
                      </p>

                      {fileName && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200">
                          <Check className="size-3 text-white" /> File loaded & ready for analysis
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Paste Tab */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        Paste the full raw text of your resume:
                      </span>
                      {resumeText && (
                        <span className="text-xs text-zinc-500">
                          {resumeText.split(/\s+/).filter(Boolean).length} words
                        </span>
                      )}
                    </div>
                    <textarea
                      value={resumeText}
                      onChange={(e) => {
                        setResumeText(e.target.value);
                        setFileName(e.target.value ? 'Pasted_Resume_Content.txt' : null);
                      }}
                      rows={14}
                      placeholder="Paste entire resume here (including Summary, Skills, Experience, Education, Projects)..."
                      className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 custom-scrollbar leading-relaxed"
                    />
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-zinc-700 bg-zinc-900 p-3.5 text-xs text-zinc-200">
                    <AlertTriangle className="size-4 shrink-0 text-zinc-400 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <ShieldCheck className="size-4 text-zinc-300" />
                    <span>Selected: <strong className="text-zinc-200">{selectedDomain.name}</strong> ({experienceLevel})</span>
                  </div>

                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={!resumeText.trim()}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg ${resumeText.trim()
                        ? 'bg-white text-black hover:bg-zinc-200 active:scale-98'
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                      }`}
                  >
                    <Sparkles className="size-4" />
                    <span>Analyze ATS Score</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= LOADING SCANNER ANIMATION ================= */}
        {isAnalyzing && (
          <div className="max-w-2xl mx-auto py-12 no-print print:hidden">
            <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-white shadow-xl">
                <BrainCircuit className="size-10 text-white animate-pulse" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                Evaluating Your Resume
              </h3>
              <p className="text-sm text-zinc-400 mb-8">
                Benchmarking against <span className="text-white font-semibold">{selectedDomain.name}</span> hiring standards...
              </p>

              {/* Progress Bar */}
              <div className="w-full space-y-2 mb-8">
                <div className="flex justify-between text-xs font-semibold text-zinc-400">
                  <span>Processing</span>
                  <span className="text-white font-mono">{loadingProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                  <div
                    className="h-full bg-white transition-all duration-300 rounded-full"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>

              {/* Active Step Indicator */}
              <div className="space-y-2.5 text-left max-w-md mx-auto">
                {loadingSteps.map((step, idx) => {
                  const isDone = idx < loadingStep;
                  const isCurrent = idx === loadingStep;
                  return (
                    <div
                      key={step.title}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-200 ${isCurrent
                          ? 'border-zinc-600 bg-zinc-900 text-white'
                          : isDone
                            ? 'border-zinc-800/80 bg-zinc-950/60 text-zinc-400'
                            : 'border-transparent text-zinc-600 opacity-40'
                        }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-white" />
                        ) : isCurrent ? (
                          <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <div className="size-4 rounded-full border border-zinc-700" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= ATS RESULTS DASHBOARD ================= */}
        {analysisResult && !isAnalyzing && (
          <div ref={resultRef} className="ats-score-printable space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 print:space-y-4">
            {/* Dedicated Print Only Header */}
            <div className="hidden print:block border-b-2 border-zinc-900 pb-3 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-zinc-950">INVERTISPREP ATS SCORE REPORT</h1>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Target Domain: <strong>{selectedDomain.name}</strong> ({experienceLevel})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-700 font-semibold">Document: {fileName || 'Resume Document'}</p>
                  <p className="text-[10px] text-zinc-500">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Screen Action Bar (Hidden on Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 no-print print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Analysis Complete</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">{fileName || 'Resume Document'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  ATS Scorecard for <span className="text-white underline decoration-zinc-600 underline-offset-4">{selectedDomain.name}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Printer className="size-4 text-zinc-400" />
                  <span>Print / Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-4 text-zinc-400" />
                  <span>Analyze Another Resume</span>
                </button>
              </div>
            </div>

            {/* Top Score Banner: Hero Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ats-print-hero">
              {/* Score Circular Dial Card */}
              <div className="lg:col-span-5 border border-zinc-800 bg-zinc-950 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden ats-print-score-card">
                {/* Score Dial Visual */}
                <div className="relative my-2 flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#27272a"
                      className="print:stroke-zinc-200"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#ffffff"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * analysisResult.atsScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out print:stroke-zinc-900"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tracking-tight text-white print:text-zinc-950">
                      {analysisResult.atsScore}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 print:text-zinc-600">
                      out of 100
                    </span>
                  </div>
                </div>

                {/* Grade Badge */}
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-zinc-900 text-white border border-zinc-700 print:bg-zinc-100 print:text-zinc-900 print:border-zinc-300">
                    {analysisResult.grade} ATS Match
                  </span>
                  <p className="mt-2 text-xs text-zinc-400 max-w-sm leading-relaxed print:text-zinc-700 print:text-[9.5pt]">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>

              {/* Breakdown Bars & Quick Checkpoints */}
              <div className="lg:col-span-7 border border-zinc-800 bg-zinc-950 rounded-3xl p-8 shadow-xl flex flex-col justify-between ats-print-breakdown-card">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 print:text-zinc-950 print:text-base print:mb-3">
                    <BarChart3 className="size-4 text-zinc-400" />
                    Scoring Dimension Breakdown
                  </h3>

                  <div className="space-y-3 print:space-y-2">
                    {/* Skills Match - Green */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-300 print:text-zinc-800">Technical Skills Match</span>
                        <span className="text-emerald-400 font-mono print:text-emerald-800 font-bold">{analysisResult.breakdown.skillsMatchScore}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden print-progress-bar">
                        <div
                          className="h-full bg-emerald-500 rounded-full print-progress-fill"
                          style={{ width: `${analysisResult.breakdown.skillsMatchScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Experience Relevance - Indigo */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-300 print:text-zinc-800">Role & Experience Relevance</span>
                        <span className="text-indigo-400 font-mono print:text-indigo-800 font-bold">{analysisResult.breakdown.experienceRelevanceScore}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden print-progress-bar">
                        <div
                          className="h-full bg-indigo-500 rounded-full print-progress-fill"
                          style={{ width: `${analysisResult.breakdown.experienceRelevanceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantifiable Impact - Pink */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-300 print:text-zinc-800">Quantifiable Metrics & Impact (STAR Method)</span>
                        <span className="text-pink-400 font-mono print:text-pink-800 font-bold">{analysisResult.breakdown.quantifiableImpactScore}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden print-progress-bar">
                        <div
                          className="h-full bg-pink-500 rounded-full print-progress-fill"
                          style={{ width: `${analysisResult.breakdown.quantifiableImpactScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Keyword Density - Yellow */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-300 print:text-zinc-800">ATS Keyword Frequency & Optimization</span>
                        <span className="text-yellow-400 font-mono print:text-yellow-800 font-bold">{analysisResult.breakdown.keywordDensityScore}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden print-progress-bar">
                        <div
                          className="h-full bg-yellow-400 rounded-full print-progress-fill"
                          style={{ width: `${analysisResult.breakdown.keywordDensityScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Formatting & Structure - Red */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-300 print:text-zinc-800">ATS Formatting & Parseability</span>
                        <span className="text-red-400 font-mono print:text-red-800 font-bold">{analysisResult.breakdown.formattingStructureScore}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden print-progress-bar">
                        <div
                          className="h-full bg-red-500 rounded-full print-progress-fill"
                          style={{ width: `${analysisResult.breakdown.formattingStructureScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Meta Stats */}
                <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center ats-print-stats-row">
                  <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800 ats-print-stat-item">
                    <p className="text-[10px] text-zinc-400 print:text-zinc-600 font-medium">Total Word Count</p>
                    <p className="text-sm font-bold text-white print:text-zinc-950">{analysisResult.wordCount} words</p>
                  </div>
                  <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800 ats-print-stat-item">
                    <p className="text-[10px] text-zinc-400 print:text-zinc-600 font-medium">Action Verbs</p>
                    <p className="text-sm font-bold text-white print:text-zinc-950">{analysisResult.actionVerbsFound.length} detected</p>
                  </div>
                  <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800 ats-print-stat-item">
                    <p className="text-[10px] text-zinc-400 print:text-zinc-600 font-medium">Estimated Reading</p>
                    <p className="text-sm font-bold text-white print:text-zinc-950">~{analysisResult.readingTimeMinutes} min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= SKILLS MATCHING SECTION ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ats-print-grid-2">
              {/* Matched Skills */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white print:bg-zinc-100 print:text-zinc-900">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white print:text-zinc-950">Matching Skills Detected</h3>
                      <p className="text-[11px] text-zinc-400 print:text-zinc-600">
                        {analysisResult.matchedSkills.length} competencies identified
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-black font-bold text-xs print:bg-zinc-100 print:text-zinc-900 print:border print:border-zinc-300">
                    {analysisResult.matchedSkills.length} Matched
                  </span>
                </div>

                {analysisResult.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 ats-print-badges-wrap">
                    {analysisResult.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold shadow-sm print-badge-matched"
                      >
                        <Check className="size-3 stroke-[3]" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 print:text-zinc-500 italic">No direct domain skill keywords detected.</p>
                )}

                {/* Soft skills */}
                {analysisResult.softSkillsFound && analysisResult.softSkillsFound.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 print:border-zinc-200">
                    <p className="text-[11px] font-semibold text-zinc-300 print:text-zinc-800 mb-1.5">Soft Skills & Leadership Detected:</p>
                    <div className="flex flex-wrap gap-1 ats-print-badges-wrap">
                      {analysisResult.softSkillsFound.map((soft) => (
                        <span
                          key={soft}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 print-badge-soft"
                        >
                          {soft}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Skills */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 print:bg-zinc-100 print:text-zinc-900">
                      <XCircle className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white print:text-zinc-950">Missing Domain Keywords</h3>
                      <p className="text-[11px] text-zinc-400 print:text-zinc-600">
                        Top keywords recommended by ATS filters
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700 print:bg-zinc-100 print:text-zinc-700 print:border-zinc-300">
                    {analysisResult.missingSkills.length} Missing
                  </span>
                </div>

                {analysisResult.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 ats-print-badges-wrap">
                    {analysisResult.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-dashed border-zinc-700 text-zinc-300 text-xs font-medium shadow-sm print-badge-missing"
                      >
                        <span className="text-zinc-400 font-bold">+</span>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300 text-xs py-2 print:text-zinc-800">
                    <CheckCircle2 className="size-4 text-white" />
                    <span>Incredible! Your resume covers all core domain technical requirements.</span>
                  </div>
                )}

                {/* Missing Keywords list */}
                {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 print:border-zinc-200">
                    <p className="text-[11px] font-semibold text-zinc-300 print:text-zinc-800 mb-1.5">Recommended Industry Keywords to Add:</p>
                    <div className="flex flex-wrap gap-1 ats-print-badges-wrap">
                      {analysisResult.missingKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 print:bg-zinc-50 print:text-zinc-700 print:border-zinc-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= CRITICAL RED FLAGS & STRENGTHS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ats-print-grid-2">
              {/* Strengths */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3 print:text-zinc-950">
                  <Award className="size-4 text-zinc-300" />
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((st, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed print:text-zinc-800">
                      <CheckCircle2 className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical Red Flags */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3 print:text-zinc-950">
                  <AlertTriangle className="size-4 text-zinc-400" />
                  ATS Red Flags & Warnings
                </h3>
                <ul className="space-y-2">
                  {analysisResult.criticalRedFlags && analysisResult.criticalRedFlags.length > 0 ? (
                    analysisResult.criticalRedFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed print:text-zinc-800">
                        <AlertTriangle className="size-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2 text-xs text-zinc-300 print:text-zinc-800">
                      <CheckCircle2 className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>No major ATS formatting or critical structure red flags detected!</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* ================= BULLET POINT FIXER ================= */}
            {analysisResult.bulletPointFixes && analysisResult.bulletPointFixes.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white print:text-zinc-950">Bullet Point Fixes</h3>
                    <p className="text-xs text-zinc-400 print:text-zinc-600">
                      High-impact Google XYZ statements (Accomplished [X] by doing [Y] as measured by [Z])
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {analysisResult.bulletPointFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-800 bg-black p-4 space-y-2 print:bg-zinc-50 print:border-zinc-300 print:p-3 print:rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 text-[9px] font-bold uppercase shrink-0 mt-0.5 print:bg-zinc-200 print:text-zinc-800 print:border-zinc-300">
                          Before / Weak
                        </span>
                        <p className="text-xs text-zinc-400 line-through italic print:text-zinc-500">{fix.originalContext}</p>
                      </div>

                      <div className="flex items-start justify-between gap-3 pt-1.5 border-t border-zinc-900 print:border-zinc-200">
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-bold uppercase shrink-0 mt-0.5 print:bg-zinc-900 print:text-white">
                            ATS Optimized
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-white leading-relaxed print:text-zinc-950">
                              {fix.suggestion}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 print:text-zinc-600">{fix.reason}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(fix.suggestion, `fix-${idx}`)}
                          className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1 shrink-0 transition-colors no-print print:hidden cursor-pointer"
                        >
                          {copiedSnippet === `fix-${idx}` ? (
                            <>
                              <Check className="size-3 text-white" />
                              <span className="text-white text-[10px]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= STEP-BY-STEP IMPROVEMENT ROADMAP ================= */}
            <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xl ats-print-card">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 print:text-zinc-950">
                <Target className="size-4 text-zinc-300" />
                Optimization Roadmap
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ats-print-grid-2">
                {analysisResult.improvementSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-zinc-800 bg-black flex flex-col justify-between print:bg-zinc-50 print:border-zinc-200 print:p-3 print:rounded-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">
                          {item.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.priority === 'High'
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : item.priority === 'Medium'
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                            }`}
                        >
                          {item.priority} Priority
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1 print:text-zinc-950">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed print:text-zinc-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions (Hidden on Print) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-800 bg-zinc-950 no-print print:hidden shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                  <TrendingUp className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Need to build a 100% ATS-Compliant Resume?</h4>
                  <p className="text-xs text-zinc-400">Use our InvertisPrep Resume Builder with ready-made ATS templates.</p>
                </div>
              </div>

              <Link
                href="/resume-builder"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Launch Resume Builder</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
