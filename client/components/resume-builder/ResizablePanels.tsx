'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Sparkles, Eye, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface ResizablePanelsProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

const STORAGE_KEY_LEFT = 'invertisprep_rb_left_width';
const STORAGE_KEY_RIGHT = 'invertisprep_rb_right_width';

export function ResizablePanels({ left, center, right }: ResizablePanelsProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'preview'>('editor');
  const [isMobile, setIsMobile] = useState(false);

  const [leftWidth, setLeftWidth] = useState(360);
  const [rightWidth, setRightWidth] = useState(560);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const draggingRef = useRef<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPtrXRef = useRef(0);
  const startLeftWidthRef = useRef(0);
  const startRightWidthRef = useRef(0);

  useEffect(() => {
    try {
      const savedLeft = localStorage.getItem(STORAGE_KEY_LEFT);
      if (savedLeft) {
        const val = parseInt(savedLeft, 10);
        if (val >= 280 && val <= 540) setLeftWidth(val);
      }
      const savedRight = localStorage.getItem(STORAGE_KEY_RIGHT);
      if (savedRight) {
        const val = parseInt(savedRight, 10);
        if (val >= 420 && val <= 850) setRightWidth(val);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handlePointerDown = useCallback((divider: 'left' | 'right') => {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingRef.current = divider;
      startPtrXRef.current = e.clientX;
      if (divider === 'left') {
        if (isLeftCollapsed) setIsLeftCollapsed(false);
        startLeftWidthRef.current = leftWidth;
      } else {
        if (isRightCollapsed) setIsRightCollapsed(false);
        startRightWidthRef.current = rightWidth;
      }
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
  }, [leftWidth, rightWidth, isLeftCollapsed, isRightCollapsed]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;

    const deltaX = e.clientX - startPtrXRef.current;

    if (draggingRef.current === 'left') {
      const newWidth = Math.min(Math.max(startLeftWidthRef.current + deltaX, 280), 540);
      setLeftWidth(newWidth);
    } else {
      const newWidth = Math.min(Math.max(startRightWidthRef.current - deltaX, 420), 850);
      setRightWidth(newWidth);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try {
      localStorage.setItem(STORAGE_KEY_LEFT, String(leftWidth));
      localStorage.setItem(STORAGE_KEY_RIGHT, String(rightWidth));
    } catch {
      /* ignore */
    }
  }, [leftWidth, rightWidth]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e);
    const onUp = () => handlePointerUp();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ── Mobile layout: 3-tab segmented control filling 100% viewport ──────────
  if (isMobile) {
    const tabs = [
      { id: 'editor', label: 'Editor', icon: Edit3 },
      { id: 'ai', label: 'AI Assistant', icon: Sparkles },
      { id: 'preview', label: 'Preview', icon: Eye },
    ] as const;

    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
        {/* Mobile Tab Switcher */}
        <div className="no-print shrink-0 border-b border-slate-200 bg-white p-2 shadow-2xs">
          <div className="relative grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileTabHighlight"
                      className="absolute inset-0 rounded-lg bg-white shadow-xs"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${isActive ? (tab.id === 'ai' ? 'text-indigo-600' : 'text-slate-900') : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content — full height, independently scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'ai' && <div className="h-full">{left}</div>}
          {activeTab === 'editor' && <div className="h-full px-2 py-3">{center}</div>}
          {activeTab === 'preview' && <div className="h-full">{right}</div>}
        </div>
      </div>
    );
  }

  // ── Desktop 3-Panel Resizable Layout (Overleaf-style) ─────────────────────
  return (
    <div
      ref={containerRef}
      className="resizable-panels-root flex h-full w-full items-stretch gap-0 overflow-hidden select-none"
    >
      {/* ── Left Panel (AI Copilot) ── */}
      <div
        className="panel-left-container shrink-0 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col h-full transition-[width,opacity] duration-200 ease-out"
        style={{
          width: isLeftCollapsed ? 0 : leftWidth,
          opacity: isLeftCollapsed ? 0 : 1,
          display: isLeftCollapsed ? 'none' : 'flex',
        }}
      >
        <div className="h-full overflow-hidden flex flex-col">{left}</div>
      </div>

      {/* ── Left Divider with Overleaf-style Arrow Toggle ── */}
      <div
        onMouseDown={handlePointerDown('left')}
        className="panel-divider group relative flex w-3.5 shrink-0 cursor-col-resize items-center justify-center transition-all z-20 hover:w-4"
        title="Drag to resize · Click arrow to toggle"
      >
        {/* Subtle vertical guideline */}
        <div className="h-full w-[2px] bg-slate-300 transition-colors group-hover:bg-indigo-500 group-hover:w-[3px]" />

        {/* Overleaf-style Collapsible Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLeftCollapsed((prev) => !prev);
          }}
          className="absolute z-30 flex h-8 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-xs transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-400 group-hover:scale-105"
          title={isLeftCollapsed ? 'Expand AI Panel' : 'Collapse AI Panel'}
        >
          {isLeftCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* ── Center Panel (Editor) — INDEPENDENT VERTICAL SCROLL ── */}
      <div className="panel-center flex-1 min-w-[340px] h-full overflow-y-auto px-1.5">
        <div className="pb-24">{center}</div>
      </div>

      {/* ── Right Divider with Overleaf-style Arrow Toggle ── */}
      <div
        onMouseDown={handlePointerDown('right')}
        className="panel-divider group relative flex w-3.5 shrink-0 cursor-col-resize items-center justify-center transition-all z-20 hover:w-4"
        title="Drag to resize · Click arrow to toggle"
      >
        {/* Subtle vertical guideline */}
        <div className="h-full w-[2px] bg-slate-300 transition-colors group-hover:bg-indigo-500 group-hover:w-[3px]" />

        {/* Overleaf-style Collapsible Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsRightCollapsed((prev) => !prev);
          }}
          className="absolute z-30 flex h-8 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-xs transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-400 group-hover:scale-105"
          title={isRightCollapsed ? 'Expand Preview' : 'Collapse Preview'}
        >
          {isRightCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* ── Right Panel (Preview) — INDEPENDENT VERTICAL SCROLL ── */}
      <div
        className="panel-right shrink-0 h-full overflow-hidden transition-[width,opacity] duration-200 ease-out"
        style={{
          width: isRightCollapsed ? 0 : rightWidth,
          opacity: isRightCollapsed ? 0 : 1,
          display: isRightCollapsed ? 'none' : 'block',
        }}
      >
        {right}
      </div>
    </div>
  );
}
