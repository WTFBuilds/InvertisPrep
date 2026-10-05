'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Show animated chips of the current selection under the trigger. */
  showChips?: boolean;
  className?: string;
}

/**
 * Animated searchable multi-select dropdown. Built on the project's Radix
 * DropdownMenu so open/close animations, portal positioning and keyboard
 * support come for free; rows toggle without closing so many branches can be
 * picked in one pass. Selection renders as chips with layout animations.
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No matches found',
  disabled = false,
  showChips = true,
  className,
}: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  );

  const selectedLabels = useMemo(
    () =>
      selected
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter((l): l is string => Boolean(l)),
    [selected, options]
  );

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              'group flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all',
              'hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100',
              'disabled:cursor-not-allowed disabled:opacity-50',
              open && 'border-indigo-400 ring-2 ring-indigo-100'
            )}
          >
            <span
              className={cn(
                'truncate font-medium',
                selected.length === 0 ? 'text-slate-400' : 'text-slate-800'
              )}
            >
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
        >
          {/* Search — keydown stopped so Radix typeahead doesn't swallow keys */}
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">{emptyMessage}</p>
            )}
            {filtered.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {showChips && selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {selectedLabels.map((label) => {
              const value = selected.find(
                (v) => options.find((o) => o.value === v)?.label === label
              )!;
              return (
                <motion.span
                  key={label}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100"
                >
                  {label}
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() => toggle(value)}
                    className="rounded-full p-0.5 transition-colors hover:bg-indigo-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
          {selected.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
