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
  Check,
  Copy,
  ChevronDown,
  BrainCircuit,
  BarChart3,
  Briefcase,
  Sliders,
  Printer,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
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
B.Tech in Computer Science & Engineering | Invertis University | 2019 - 2023`,
};

const EXPERIENCE_LEVELS = ['Fresher', '1-3 years', '3-5 years', '5+ years'];

// Score-driven visual language for the dial, grade chip and summary accents.
const scoreTheme = (score: number) => {
  if (score >= 85) {
    return {
      stroke: '#10b981',
      text: 'text-emerald-600',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (score >= 70) {
    return {
      stroke: '#0ea5e9',
      text: 'text-sky-600',
      chip: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }
  if (score >= 50) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-600',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    stroke: '#ef4444',
    text: 'text-red-600',
    chip: 'bg-red-50 text-red-700 border-red-200',
  };
};

const BREAKDOWN_ITEMS: {
  key: keyof GeminiATSAnalysisResult['breakdown'];
  label: string;
  bar: string;
  value: string;
}[] = [
  {
    key: 'skillsMatchScore',
    label: 'Technical Skills Match',
    bar: '[&>div]:bg-emerald-500',
    value: 'text-emerald-600',
  },
  {
    key: 'experienceRelevanceScore',
    label: 'Role & Experience Relevance',
    bar: '[&>div]:bg-indigo-500',
    value: 'text-indigo-600',
  },
  {
    key: 'quantifiableImpactScore',
    label: 'Quantifiable Metrics & Impact (STAR)',
    bar: '[&>div]:bg-pink-500',
    value: 'text-pink-600',
  },
  {
    key: 'keywordDensityScore',
    label: 'ATS Keyword Frequency & Optimization',
    bar: '[&>div]:bg-amber-500',
    value: 'text-amber-600',
  },
  {
    key: 'formattingStructureScore',
    label: 'ATS Formatting & Parseability',
    bar: '[&>div]:bg-rose-500',
    value: 'text-rose-600',
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 print:min-h-0 print:h-auto print:overflow-visible print:bg-white">
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
            color: #0f172a !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            font-size: 10.5pt !important;
          }
          nav, footer, .no-print, [class*="no-print"] {
            display: none !important;
          }

          .ats-score-printable {
            display: block !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .ats-score-printable * {
            box-shadow: none !important;
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
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 14px 16px !important;
            color: #0f172a !important;
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
            border-top: 1px solid #e2e8f0 !important;
          }
          .ats-print-stat-item {
            flex: 1 !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 6px 8px !important;
            text-align: center !important;
          }

          /* Badges in Print */
          .ats-print-badges-wrap {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            margin-top: 8px !important;
          }
          .print-badge {
            border: 1px solid #cbd5e1 !important;
            padding: 3px 8px !important;
            border-radius: 6px !important;
            font-size: 8.5pt !important;
            font-weight: 600 !important;
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .print-badge-soft {
            border: 1px solid #e2e8f0 !important;
            padding: 2px 7px !important;
            border-radius: 5px !important;
            font-size: 8pt !important;
            background-color: #ffffff !important;
            color: #334155 !important;
          }
        }
      `}</style>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none">
        {/* Top Header (Hidden on Print) */}
        <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center space-y-3 text-center no-print print:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            <Sparkles className="size-3.5" />
            <span>AI Resume Intelligence</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            ATS Score Checker
          </h1>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            Evaluate your resume against industry Applicant Tracking Systems with precision
            benchmarking and actionable recommendations.
          </p>
        </div>

        {/* ================= MAIN INTERFACE (Hidden on Print) ================= */}
        {!analysisResult && !isAnalyzing && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8 no-print print:hidden">
            {/* Left Column: Domain & Role Selector */}
            <div className="space-y-6 lg:col-span-5">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                      <Briefcase className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Target Job Domain</CardTitle>
                      <CardDescription>Select your target career path</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Domain Selector Grid */}
                  <div className="custom-scrollbar max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {DOMAINS.map((domain) => {
                      const isSelected = selectedDomain.id === domain.id;
                      return (
                        <button
                          key={domain.id}
                          type="button"
                          onClick={() => setSelectedDomain(domain)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-200'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="pt-0.5 text-2xl">{domain.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`truncate text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}
                              >
                                {domain.name}
                              </span>
                              {isSelected && (
                                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {domain.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {domain.coreSkills.slice(0, 4).map((skill) => (
                                <span
                                  key={skill}
                                  className={`rounded border px-1.5 py-0.5 text-[10px] ${
                                    isSelected
                                      ? 'border-indigo-200 bg-white text-indigo-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                              {domain.coreSkills.length > 4 && (
                                <span className="pt-0.5 text-[10px] text-slate-400">
                                  +{domain.coreSkills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Experience Level Selector */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Experience Level
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <Button
                          key={level}
                          type="button"
                          size="sm"
                          variant={experienceLevel === level ? 'default' : 'outline'}
                          onClick={() => setExperienceLevel(level)}
                          className={
                            experienceLevel === level
                              ? 'h-9 px-1 text-xs font-bold'
                              : 'h-9 px-1 text-xs font-medium text-slate-600'
                          }
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Custom Job Description */}
                  <Collapsible open={showJDInput} onOpenChange={setShowJDInput}>
                    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg text-xs font-semibold text-slate-700 transition-colors hover:text-indigo-700">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-slate-400" />
                        Add Custom Job Description (Optional)
                      </span>
                      <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Paste the target job description to benchmark directly against company
                        requirements.
                      </p>
                      <Textarea
                        value={customJD}
                        onChange={(e) => setCustomJD(e.target.value)}
                        placeholder="Paste target job description requirements, responsibilities, or qualifications here..."
                        rows={4}
                        className="custom-scrollbar text-xs"
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              {/* Instant 1-Click Samples */}
              <Card className="bg-white">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Try sample test resumes:</p>
                    <p className="text-[11px] text-slate-500">
                      Test analysis immediately with 1 click
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => loadSample('fullstack')}
                      className="h-8 cursor-pointer px-2.5 text-xs font-medium"
                    >
                      Full Stack
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => loadSample('aiml')}
                      className="h-8 cursor-pointer px-2.5 text-xs font-medium"
                    >
                      AI / ML
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Upload Resume & Content */}
            <div className="space-y-6 lg:col-span-7">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Your Resume</CardTitle>
                        <CardDescription>Upload a document or paste text</CardDescription>
                      </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'paste')}>
                      <TabsList className="h-9">
                        <TabsTrigger value="upload" className="px-3 text-xs">
                          Upload File
                        </TabsTrigger>
                        <TabsTrigger value="paste" className="px-3 text-xs">
                          Paste Text
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Zone */}
                  {activeTab === 'upload' && (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40"
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

                      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-indigo-200 group-hover:text-indigo-600">
                        <UploadCloud className="size-7 stroke-[1.75]" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                        {fileName ? (
                          <span className="flex items-center justify-center gap-1.5 font-bold text-slate-900">
                            <CheckCircle2 className="size-4 text-emerald-600" /> {fileName}
                          </span>
                        ) : (
                          'Drag & drop your resume here, or browse files'
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Supports PDF, TXT, DOCX files (Up to 10MB)
                      </p>

                      {fileName && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          <Check className="size-3" /> File loaded & ready for analysis
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paste Tab */}
                  {activeTab === 'paste' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Paste the full raw text of your resume:
                        </span>
                        {resumeText && (
                          <span className="text-xs text-slate-400">
                            {resumeText.split(/\s+/).filter(Boolean).length} words
                          </span>
                        )}
                      </div>
                      <Textarea
                        value={resumeText}
                        onChange={(e) => {
                          setResumeText(e.target.value);
                          setFileName(e.target.value ? 'Pasted_Resume_Content.txt' : null);
                        }}
                        rows={14}
                        placeholder="Paste entire resume here (including Summary, Skills, Experience, Education, Projects)..."
                        className="custom-scrollbar font-mono text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Error Banner */}
                  {errorMsg && (
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" />
                      <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Action Button */}
                  <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck className="size-4 text-slate-400" />
                      <span>
                        Selected:{' '}
                        <strong className="font-semibold text-slate-800">
                          {selectedDomain.name}
                        </strong>{' '}
                        ({experienceLevel})
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={runAnalysis}
                      disabled={!resumeText.trim() || isAnalyzing}
                      className="h-11 w-full cursor-pointer bg-slate-900 px-8 text-sm font-bold hover:bg-slate-800 sm:w-auto"
                    >
                      <Sparkles className="size-4" />
                      <span>Analyze ATS Score</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ================= LOADING SCANNER ANIMATION ================= */}
        {isAnalyzing && (
          <div className="mx-auto max-w-2xl py-12 no-print print:hidden">
            <Card className="relative overflow-hidden p-8 sm:p-12">
              <div className="relative mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <BrainCircuit className="size-10 animate-pulse" />
              </div>

              <h3 className="mb-2 text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Evaluating Your Resume
              </h3>
              <p className="mb-8 text-center text-sm text-slate-500">
                Benchmarking against{' '}
                <span className="font-semibold text-indigo-700">{selectedDomain.name}</span> hiring
                standards...
              </p>

              {/* Progress Bar */}
              <div className="mb-8 w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Processing</span>
                  <span className="font-mono text-indigo-700">{loadingProgress}%</span>
                </div>
                <Progress value={loadingProgress} className="h-2" />
              </div>

              {/* Active Step Indicator */}
              <div className="mx-auto max-w-md space-y-2.5 text-left">
                {loadingSteps.map((step, idx) => {
                  const isDone = idx < loadingStep;
                  const isCurrent = idx === loadingStep;
                  return (
                    <div
                      key={step.title}
                      className={`flex items-start gap-3 rounded-xl border p-2.5 transition-all duration-200 ${
                        isCurrent
                          ? 'border-indigo-200 bg-indigo-50/70'
                          : isDone
                            ? 'border-slate-100 bg-slate-50'
                            : 'border-transparent opacity-40'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        ) : (
                          <div className="size-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold ${isCurrent ? 'text-indigo-900' : 'text-slate-600'}`}
                        >
                          {step.title}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ================= ATS RESULTS DASHBOARD ================= */}
        {analysisResult && !isAnalyzing && (
          <div
            ref={resultRef}
            className="ats-score-printable space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 lg:space-y-8 print:space-y-4"
          >
            {/* Dedicated Print Only Header */}
            <div className="hidden border-b-2 border-slate-900 pb-3 print:block">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950">
                    INVERTISPREP ATS SCORE REPORT
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Target Domain:{' '}
                    <strong>
                      {selectedDomain.name} ({experienceLevel})
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700">
                    Document: {fileName || 'Resume Document'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Date:{' '}
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Screen Action Bar (Hidden on Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Analysis Complete
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{fileName || 'Resume Document'}</span>
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  ATS Scorecard for{' '}
                  <span className="text-indigo-700">{selectedDomain.name}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  className="cursor-pointer gap-2 text-xs font-semibold"
                >
                  <Printer className="size-4" />
                  <span>Print / Export PDF</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAnalysisResult(null);
                  }}
                  className="cursor-pointer gap-2 text-xs font-semibold text-slate-600"
                >
                  <RefreshCw className="size-4" />
                  <span>Analyze Another Resume</span>
                </Button>
              </div>
            </div>

            {/* Top Score Banner: Hero Gauge */}
            <div className="ats-print-hero grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
              {/* Score Circular Dial Card */}
              <Card className="ats-print-score-card flex flex-col items-center justify-center p-8 text-center lg:col-span-5">
                <div className="relative my-2 flex items-center justify-center">
                  <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={scoreTheme(analysisResult.atsScore).stroke}
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * analysisResult.atsScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center">
                    <span
                      className={`text-4xl font-black tracking-tight ${scoreTheme(analysisResult.atsScore).text}`}
                    >
                      {analysisResult.atsScore}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      out of 100
                    </span>
                  </div>
                </div>

                {/* Grade Badge */}
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${scoreTheme(analysisResult.atsScore).chip}`}
                  >
                    {analysisResult.grade} ATS Match
                  </Badge>
                  <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-600">
                    {analysisResult.summary}
                  </p>
                </div>
              </Card>

              {/* Breakdown Bars & Quick Checkpoints */}
              <Card className="ats-print-breakdown-card flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <BarChart3 className="size-4 text-indigo-600" />
                    Scoring Dimension Breakdown
                  </h3>

                  <div className="space-y-3">
                    {BREAKDOWN_ITEMS.map((item) => {
                      const value = analysisResult.breakdown[item.key];
                      return (
                        <div key={item.key}>
                          <div className="mb-1 flex justify-between text-xs font-semibold">
                            <span className="text-slate-600">{item.label}</span>
                            <span className={`font-mono font-bold ${item.value}`}>{value}%</span>
                          </div>
                          <Progress value={value} className={`h-2.5 bg-slate-100 ${item.bar}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Meta Stats */}
                <div className="ats-print-stats-row mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div className="ats-print-stat-item rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[10px] font-medium text-slate-500">Total Word Count</p>
                    <p className="text-sm font-bold text-slate-900">
                      {analysisResult.wordCount} words
                    </p>
                  </div>
                  <div className="ats-print-stat-item rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[10px] font-medium text-slate-500">Action Verbs</p>
                    <p className="text-sm font-bold text-slate-900">
                      {analysisResult.actionVerbsFound.length} detected
                    </p>
                  </div>
                  <div className="ats-print-stat-item rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[10px] font-medium text-slate-500">Estimated Reading</p>
                    <p className="text-sm font-bold text-slate-900">
                      ~{analysisResult.readingTimeMinutes} min
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* ================= SKILLS MATCHING SECTION ================= */}
            <div className="ats-print-grid-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Matched Skills */}
              <Card className="ats-print-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Matching Skills Detected</h3>
                      <p className="text-[11px] text-slate-500">
                        {analysisResult.matchedSkills.length} competencies identified
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-emerald-600 font-bold hover:bg-emerald-600">
                    {analysisResult.matchedSkills.length} Matched
                  </Badge>
                </div>

                {analysisResult.matchedSkills.length > 0 ? (
                  <div className="ats-print-badges-wrap flex flex-wrap gap-1.5 pt-1">
                    {analysisResult.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="print-badge inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      >
                        <Check className="size-3 stroke-[3]" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="pt-1 text-xs italic text-slate-400">
                    No direct domain skill keywords detected.
                  </p>
                )}

                {/* Soft skills */}
                {analysisResult.softSkillsFound && analysisResult.softSkillsFound.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                      Soft Skills & Leadership Detected:
                    </p>
                    <div className="ats-print-badges-wrap flex flex-wrap gap-1">
                      {analysisResult.softSkillsFound.map((soft) => (
                        <span
                          key={soft}
                          className="print-badge-soft rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
                        >
                          {soft}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Missing Skills */}
              <Card className="ats-print-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600">
                      <XCircle className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Missing Domain Keywords</h3>
                      <p className="text-[11px] text-slate-500">
                        Top keywords recommended by ATS filters
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-rose-200 bg-rose-50 font-bold text-rose-700"
                  >
                    {analysisResult.missingSkills.length} Missing
                  </Badge>
                </div>

                {analysisResult.missingSkills.length > 0 ? (
                  <div className="ats-print-badges-wrap flex flex-wrap gap-1.5 pt-1">
                    {analysisResult.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="print-badge inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        <span className="font-bold text-rose-500">+</span>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Incredible! Your resume covers all core domain technical requirements.</span>
                  </div>
                )}

                {/* Missing Keywords list */}
                {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                      Recommended Industry Keywords to Add:
                    </p>
                    <div className="ats-print-badges-wrap flex flex-wrap gap-1">
                      {analysisResult.missingKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="print-badge-soft rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ================= CRITICAL RED FLAGS & STRENGTHS ================= */}
            <div className="ats-print-grid-2 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Strengths */}
              <Card className="ats-print-card">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Award className="size-4 text-indigo-600" />
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((st, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"
                    >
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Critical Red Flags */}
              <Card className="ats-print-card">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                  <AlertTriangle className="size-4 text-rose-600" />
                  ATS Red Flags & Warnings
                </h3>
                <ul className="space-y-2">
                  {analysisResult.criticalRedFlags && analysisResult.criticalRedFlags.length > 0 ? (
                    analysisResult.criticalRedFlags.map((flag, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"
                      >
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                        <span>{flag}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      <span>No major ATS formatting or critical structure red flags detected!</span>
                    </li>
                  )}
                </ul>
              </Card>
            </div>

            {/* ================= BULLET POINT FIXER ================= */}
            {analysisResult.bulletPointFixes && analysisResult.bulletPointFixes.length > 0 && (
              <Card className="ats-print-card">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bullet Point Fixes</h3>
                    <p className="text-xs text-slate-500">
                      High-impact Google XYZ statements (Accomplished [X] by doing [Y] as measured
                      by [Z])
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {analysisResult.bulletPointFixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="shrink-0 border-slate-200 bg-white text-[9px] font-bold uppercase text-slate-500"
                        >
                          Before / Weak
                        </Badge>
                        <p className="text-xs italic text-slate-400 line-through">
                          {fix.originalContext}
                        </p>
                      </div>

                      <div className="flex items-start justify-between gap-3 border-t border-slate-200 pt-2">
                        <div className="flex items-start gap-2">
                          <Badge className="shrink-0 bg-indigo-600 text-[9px] font-bold uppercase hover:bg-indigo-600">
                            ATS Optimized
                          </Badge>
                          <div>
                            <p className="text-xs font-semibold leading-relaxed text-slate-900">
                              {fix.suggestion}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{fix.reason}</p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(fix.suggestion, `fix-${idx}`)}
                          className="no-print h-7 shrink-0 cursor-pointer gap-1 px-2 text-[10px] print:hidden"
                        >
                          {copiedSnippet === `fix-${idx}` ? (
                            <>
                              <Check className="size-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ================= STEP-BY-STEP IMPROVEMENT ROADMAP ================= */}
            <Card className="ats-print-card">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <Target className="size-4 text-indigo-600" />
                Optimization Roadmap
              </h3>

              <div className="ats-print-grid-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                {analysisResult.improvementSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.Low}`}
                        >
                          {item.priority} Priority
                        </Badge>
                      </div>
                      <h4 className="mb-1 text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bottom Actions (Hidden on Print) */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm no-print print:hidden sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                  <TrendingUp className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Need to build a 100% ATS-Compliant Resume?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Use our InvertisPrep Resume Builder with ready-made ATS templates.
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="w-full cursor-pointer bg-slate-900 text-xs font-bold hover:bg-slate-800 sm:w-auto"
              >
                <Link href="/resume-builder" className="flex items-center justify-center gap-2">
                  <span>Launch Resume Builder</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
