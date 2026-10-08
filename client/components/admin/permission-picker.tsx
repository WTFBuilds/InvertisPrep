'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, Sparkles } from 'lucide-react';
import { PERMISSION_GROUPS, SYSTEM_ONLY_PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';

const SYSTEM_KEYS = new Set<string>(SYSTEM_ONLY_PERMISSIONS);

interface PermissionPickerProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

/**
 * Grouped permission menu. Each catalog group renders as a collapsible card
 * with a group-level select-all toggle and per-permission checkboxes. A search
 * box filters across every group at once. System-only permissions
 * (e.g. roles.manage) render as locked and can never be granted.
 */
export function PermissionPicker({ selected, onChange, disabled = false }: PermissionPickerProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      PERMISSION_GROUPS.map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            !q ||
            p.label.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q)
        ),
      })).filter((group) => group.permissions.length > 0),
    [q]
  );

  const toggleOne = (key: string) => {
    if (disabled || SYSTEM_KEYS.has(key)) return;
    onChange(
      selectedSet.has(key) ? selected.filter((k) => k !== key) : [...selected, key]
    );
  };

  const toggleGroup = (keys: string[]) => {
    if (disabled) return;
    const grantable = keys.filter((k) => !SYSTEM_KEYS.has(k));
    const allOn = grantable.length > 0 && grantable.every((k) => selectedSet.has(k));
    if (allOn) {
      onChange(selected.filter((k) => !grantable.includes(k)));
    } else {
      onChange([...new Set([...selected, ...grantable])]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search permissions..."
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
        />
      </div>

      <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No permissions match your search.</p>
        )}

        {groups.map((group) => {
          const grantable = group.permissions.filter((p) => !SYSTEM_KEYS.has(p.key));
          const selectedCount = grantable.filter((p) => selectedSet.has(p.key)).length;
          const allOn = grantable.length > 0 && selectedCount === grantable.length;

          return (
            <div key={group.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 bg-slate-50/70 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
                  className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                      collapsed[group.id] && !q && '-rotate-90'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{group.label}</p>
                    <p className="truncate text-xs text-slate-400">{group.description}</p>
                  </div>
                </button>
                <span className="shrink-0 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {selectedCount}/{grantable.length}
                </span>
                <button
                  type="button"
                  disabled={disabled || grantable.length === 0}
                  onClick={() => toggleGroup(group.permissions.map((p) => p.key))}
                  className={cn(
                    'shrink-0 rounded-md px-2 py-1 text-[11px] font-bold transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    allOn ? 'text-slate-500 hover:bg-slate-100' : 'text-indigo-600 hover:bg-indigo-50'
                  )}
                >
                  {allOn ? 'Clear' : 'All'}
                </button>
              </div>
              <AnimatePresence initial={false}>
                {(!collapsed[group.id] || q) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-slate-50">
                      {group.permissions.map((permission) => {
                        const systemOnly = SYSTEM_KEYS.has(permission.key);
                        const checked = selectedSet.has(permission.key);
                        return (
                          <button
                            key={permission.key}
                            type="button"
                            disabled={disabled || systemOnly}
                            onClick={() => toggleOne(permission.key)}
                            title={permission.key}
                            className={cn(
                              'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
                              systemOnly ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-50'
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                                checked
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              )}
                            >
                              {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                {permission.label}
                                {systemOnly && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Super admin only
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">{permission.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}