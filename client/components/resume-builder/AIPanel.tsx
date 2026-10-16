'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { aiApi, type AIFillResult } from '@/lib/api';
import type { Resume, ResumeExperience, ResumeProject } from '@/types';
import { Sparkles, Wand2, ListPlus, Check, CheckCircle2, Loader2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AIPanelProps {
  resume: Resume;
  update: (patch: Partial<Resume>) => void;
  updatePersonal: (patch: Partial<Resume['personal']>) => void;
}

type AITab = 'jd' | 'rephrase' | 'enhance';

export function AIPanel({ resume, update }: AIPanelProps) {
  const { user } = useAuth();
  const canUseAI = hasPermission(user, 'ai.resume');

  const [activeTab, setActiveTab] = useState<AITab>('jd');

  // Tab 1: JD Fill
  const [jobDescription, setJobDescription] = useState('');
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [jdResult, setJdResult] = useState<AIFillResult | null>(null);
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    experience: true,
    projects: true,
    skills: true,
  });
  const [appendMode, setAppendMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    experience: false,
    projects: false,
    skills: false,
  });

  // Tab 2: Rephrase
  const [rephraseTarget, setRephraseTarget] = useState<'summary' | 'exp' | 'proj'>('summary');
  const [expIndex, setExpIndex] = useState(0);
  const [projIndex, setProjIndex] = useState(0);
  const [rephraseLoading, setRephraseLoading] = useState(false);
  const [rephrasedText, setRephrasedText] = useState<string | null>(null);

  // Tab 3: Enhance
  const [enhanceTarget, setEnhanceTarget] = useState<'experience' | 'projects'>('experience');
  const [roughNotes, setRoughNotes] = useState('');
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhancedEntries, setEnhancedEntries] = useState<(ResumeExperience | ResumeProject)[] | null>(null);

  const guardAction = (): boolean => {
    if (!canUseAI) {
      toast.info('AI generation requires an authorized role. Contact an administrator to request access.');
      return false;
    }
    return true;
  };

  const handleAnalyzeJD = async () => {
    if (!guardAction()) return;
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description.');
      return;
    }
    setAnalyzingJD(true);
    setJdResult(null);
    try {
      const res = await aiApi.fillFromJD(jobDescription, {
        title: resume.title,
        personal: resume.personal,
        summary: resume.summary,
        education: resume.education,
        experience: resume.experience,
        projects: resume.projects,
        skillGroups: resume.skillGroups,
      });
      if (res.success && res.data) {
        setJdResult(res.data);
        toast.success('Job description analyzed.');
      } else {
        toast.error(res.message ?? 'Analysis failed.');
      }
    } catch {
      toast.error('Failed to analyze job description.');
    } finally {
      setAnalyzingJD(false);
    }
  };

  const handleApplyJD = () => {
    if (!jdResult) return;
    const patch: Partial<Resume> = {};

    if (selectedSections.summary && jdResult.summary) patch.summary = jdResult.summary;
    if (selectedSections.experience && jdResult.experience?.length)
      patch.experience = appendMode ? [...resume.experience, ...jdResult.experience] : jdResult.experience;
    if (selectedSections.projects && jdResult.projects?.length)
      patch.projects = appendMode ? [...resume.projects, ...jdResult.projects] : jdResult.projects;
    if (selectedSections.skills && jdResult.skillGroups?.length)
      patch.skillGroups = appendMode ? [...resume.skillGroups, ...jdResult.skillGroups] : jdResult.skillGroups;

    update(patch);
    toast.success('Resume updated with generated content.');
    setJdResult(null);
  };

  const getSelectedText = () => {
    if (rephraseTarget === 'summary') return resume.summary;
    if (rephraseTarget === 'exp') return resume.experience[expIndex]?.description ?? '';
    if (rephraseTarget === 'proj') return resume.projects[projIndex]?.description ?? '';
    return '';
  };

  const handleRephrase = async () => {
    if (!guardAction()) return;
    const current = getSelectedText();
    if (!current?.trim()) {
      toast.error('The selected field has no text to rephrase.');
      return;
    }
    setRephraseLoading(true);
    setRephrasedText(null);
    try {
      const fieldType = rephraseTarget === 'summary' ? 'summary' : 'description';
      const res = await aiApi.rephrase(current, fieldType);
      if (res.success && res.data?.text) {
        setRephrasedText(res.data.text);
        toast.success('Text rephrased.');
      } else {
        toast.error(res.message ?? 'Rephrase failed.');
      }
    } catch {
      toast.error('Failed to rephrase.');
    } finally {
      setRephraseLoading(false);
    }
  };

  const handleApplyRephrased = () => {
    if (!rephrasedText) return;
    if (rephraseTarget === 'summary') {
      update({ summary: rephrasedText });
    } else if (rephraseTarget === 'exp') {
      const next = resume.experience.map((item, i) => (i === expIndex ? { ...item, description: rephrasedText } : item));
      update({ experience: next });
    } else if (rephraseTarget === 'proj') {
      const next = resume.projects.map((item, i) => (i === projIndex ? { ...item, description: rephrasedText } : item));
      update({ projects: next });
    }
    toast.success('Field updated in editor.');
    setRephrasedText(null);
  };

  const handleEnhance = async () => {
    if (!guardAction()) return;
    if (!roughNotes.trim()) {
      toast.error('Please enter your notes.');
      return;
    }
    setEnhanceLoading(true);
    setEnhancedEntries(null);
    try {
      const context = `Headline: ${resume.personal.headline}. Summary: ${resume.summary}`;
      const res = await aiApi.enhanceSection(enhanceTarget, roughNotes, context);
      if (res.success && res.data?.entries?.length) {
        setEnhancedEntries(res.data.entries);
        toast.success('Entries generated.');
      } else {
        toast.error(res.message ?? 'Failed to generate.');
      }
    } catch {
      toast.error('Failed to generate entries.');
    } finally {
      setEnhanceLoading(false);
    }
  };

  const handleAddEnhancedEntries = () => {
    if (!enhancedEntries) return;
    if (enhanceTarget === 'experience') {
      update({ experience: [...(enhancedEntries as ResumeExperience[]), ...resume.experience] });
    } else {
      update({ projects: [...(enhancedEntries as ResumeProject[]), ...resume.projects] });
    }
    toast.success(`Added ${enhancedEntries.length} ${enhanceTarget} entry to resume.`);
    setEnhancedEntries(null);
    setRoughNotes('');
  };

  const tabs = [
    { id: 'jd', label: 'JD Fill', icon: Sparkles },
    { id: 'rephrase', label: 'Rephrase', icon: Wand2 },
    { id: 'enhance', label: 'Enhance', icon: ListPlus },
  ] as const;

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 overflow-hidden">
      {/* Panel Header */}
      <div className="relative flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white shrink-0 overflow-hidden">
        {/* Subtle bluish top accent line matching the editor */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-sky-500" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">AI Assistant</h2>
            <p className="text-[10px] text-slate-500 font-medium">Content generation & suggestions</p>
          </div>
        </div>
        {!canUseAI && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500" title="AI features require an authorized role">
            <Lock className="h-2.5 w-2.5 text-slate-400" />
            <span>Role Required</span>
          </span>
        )}
      </div>

      {/* Tabs with smooth sliding active pill */}
      <div className="border-b border-slate-200 p-2.5 bg-slate-50/70 shrink-0">
        <div className="relative grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-150 ${
                  isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAITabHighlight"
                    className="absolute inset-0 rounded-lg bg-white shadow-xs border border-indigo-100/50"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5">
        {!canUseAI && (
          <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-[11px] text-slate-700">
            <Lock className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-semibold text-slate-900">Preview Mode: </span>
              You can explore the fields and test prompts below. Generating content with AI is currently reserved for authorized roles.
            </div>
          </div>
        )}

        {/* ── Tab 1: JD Fill ── */}
        {activeTab === 'jd' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Job Description
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements, responsibilities, or skills here..."
                rows={6}
              />
            </div>
            <Button
              type="button"
              disabled={analyzingJD || !jobDescription.trim()}
              onClick={handleAnalyzeJD}
              className={`w-full text-white text-xs font-semibold h-8.5 rounded-lg transition shadow-xs ${
                canUseAI ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {analyzingJD ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing job requirements...
                </span>
              ) : !canUseAI ? (
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-300" /> Analyze & Generate (Role Required)
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Analyze & Generate Content
                </span>
              )}
            </Button>

            {jdResult && (
              <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">Generated Content</span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appendMode}
                      onChange={(e) => setAppendMode(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Append to existing</span>
                  </label>
                </div>

                {/* Summary */}
                {jdResult.summary && (
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedSections.summary}
                          onChange={(e) => setSelectedSections((p) => ({ ...p, summary: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span>Summary</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExpandedSections((p) => ({ ...p, summary: !expandedSections.summary }))}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedSections.summary ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                    {expandedSections.summary && (
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                        {jdResult.summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Experience */}
                {jdResult.experience && jdResult.experience.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedSections.experience}
                          onChange={(e) => setSelectedSections((p) => ({ ...p, experience: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span>Experience ({jdResult.experience.length})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExpandedSections((p) => ({ ...p, experience: !expandedSections.experience }))}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedSections.experience ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                    {expandedSections.experience && (
                      <div className="mt-1.5 space-y-1.5">
                        {jdResult.experience.map((exp, i) => (
                          <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                            <p className="font-semibold text-slate-900">{exp.role} · {exp.company}</p>
                            {exp.description && <p className="text-[11px] text-slate-500 mt-0.5">{exp.description}</p>}
                            {exp.achievements?.length > 0 && (
                              <ul className="mt-1 list-disc pl-3 text-[11px] text-slate-600 space-y-0.5">
                                {exp.achievements.map((a, idx) => (a ? <li key={idx}>{a}</li> : null))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {jdResult.skillGroups && jdResult.skillGroups.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedSections.skills}
                          onChange={(e) => setSelectedSections((p) => ({ ...p, skills: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span>Skill Groups ({jdResult.skillGroups.length})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExpandedSections((p) => ({ ...p, skills: !expandedSections.skills }))}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedSections.skills ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                    {expandedSections.skills && (
                      <div className="mt-1.5 space-y-1">
                        {jdResult.skillGroups.map((g, i) => (
                          <div key={i} className="bg-slate-50 p-1.5 rounded text-[11px] text-slate-600 border border-slate-100">
                            <span className="font-semibold text-slate-800">{g.title}:</span>{' '}
                            <span>{g.items.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleApplyJD}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8.5 rounded-lg shadow-xs mt-2"
                >
                  <span className="flex items-center gap-1.5"><Check size={13} /> Apply Selected to Resume</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Rephrase ── */}
        {activeTab === 'rephrase' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Target Section
              </label>
              <Select
                value={rephraseTarget}
                onValueChange={(v) => {
                  setRephraseTarget(v as 'summary' | 'exp' | 'proj');
                  setRephrasedText(null);
                }}
              >
                <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Professional Summary</SelectItem>
                  {resume.experience.length > 0 && <SelectItem value="exp">Work Experience</SelectItem>}
                  {resume.projects.length > 0 && <SelectItem value="proj">Projects</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {rephraseTarget === 'exp' && resume.experience.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Experience
                </label>
                <select
                  value={expIndex}
                  onChange={(e) => setExpIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-400"
                >
                  {resume.experience.map((item, i) => (
                    <option key={i} value={i}>{item.role || 'Role'} at {item.company || 'Company'}</option>
                  ))}
                </select>
              </div>
            )}

            {rephraseTarget === 'proj' && resume.projects.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Project
                </label>
                <select
                  value={projIndex}
                  onChange={(e) => setProjIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-400"
                >
                  {resume.projects.map((item, i) => (
                    <option key={i} value={i}>{item.name || 'Untitled Project'}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Current Content
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 leading-relaxed min-h-[64px] max-h-36 overflow-y-auto">
                {getSelectedText() || <span className="italic text-slate-400">Empty field</span>}
              </div>
            </div>

            <Button
              type="button"
              disabled={rephraseLoading || !getSelectedText()}
              onClick={handleRephrase}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8.5 rounded-lg transition shadow-xs"
            >
              {rephraseLoading ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rephrasing...</span>
              ) : (
                <span className="flex items-center gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Rephrase with AI</span>
              )}
            </Button>

            {rephrasedText && (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>AI Suggestion</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {rephrasedText}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleApplyRephrased}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold h-7.5 rounded-lg shadow-xs"
                  >
                    Accept & Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRephrasedText(null)}
                    className="border-slate-200 bg-white text-slate-600 text-xs font-medium h-7.5 rounded-lg hover:bg-slate-50"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Enhance ── */}
        {activeTab === 'enhance' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Section to Enhance
              </label>
              <select
                value={enhanceTarget}
                onChange={(e) => setEnhanceTarget(e.target.value as 'experience' | 'projects')}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-indigo-400"
              >
                <option value="experience">Work Experience</option>
                <option value="projects">Projects</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Rough Notes / Bullets
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={roughNotes}
                onChange={(e) => setRoughNotes(e.target.value)}
                placeholder={
                  enhanceTarget === 'experience'
                    ? 'e.g. Worked at Google as frontend dev for 2 years. Built dashboards, reduced query latency by 40%, led a team of 4...'
                    : 'e.g. Built an e-commerce platform with Next.js and Stripe. Real-time cart updates, handled 5000 users...'
                }
                rows={5}
              />
            </div>
            <Button
              type="button"
              disabled={enhanceLoading || !roughNotes.trim()}
              onClick={handleEnhance}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8.5 rounded-lg transition shadow-xs"
            >
              {enhanceLoading ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Structuring entries...</span>
              ) : (
                <span className="flex items-center gap-1.5"><ListPlus className="h-3.5 w-3.5" /> Generate Structured Entries</span>
              )}
            </Button>

            {enhancedEntries && enhancedEntries.length > 0 && (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                <span className="text-xs font-bold text-slate-800">Generated entries ({enhancedEntries.length}):</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {enhancedEntries.map((entry, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs shadow-2xs">
                      <p className="font-semibold text-slate-900">
                        {'role' in entry ? `${entry.role} · ${entry.company}` : entry.name}
                      </p>
                      {entry.description && <p className="text-[11px] text-slate-500 mt-0.5">{entry.description}</p>}
                      {entry.achievements && entry.achievements.length > 0 && (
                        <ul className="mt-1 list-disc pl-3 text-[11px] text-slate-600 space-y-0.5">
                          {entry.achievements.map((a, i) => (a ? <li key={i}>{a}</li> : null))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleAddEnhancedEntries}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold h-8 rounded-lg mt-1 shadow-xs"
                >
                  <span className="flex items-center gap-1.5"><ListPlus size={13} /> Add to Resume</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
