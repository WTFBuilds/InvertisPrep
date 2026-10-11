'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adminMailApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewableAvatar } from '@/components/admin/viewable-avatar';
import type { MailRecipientUser } from '@/types';

const PAGE_SIZE = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PickedUser {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
}

/**
 * Server-searched multi-select for picking campaign recipients from the
 * platform's active users. Unlike the static MultiSelect, options are fetched
 * (debounced, paginated) so it scales past thousands of users.
 */
export function UserRecipientPicker({
  selected,
  onChange,
  disabled = false,
}: {
  selected: PickedUser[];
  onChange: (users: PickedUser[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MailRecipientUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against stale responses landing after a newer search.
  const reqId = useRef(0);

  const fetchPage = useCallback(
    async (search: string, nextPage: number, append: boolean) => {
      const id = ++reqId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await adminMailApi.composeUsers({
          search: search.trim() || undefined,
          page: nextPage,
          limit: PAGE_SIZE,
        });
        if (id !== reqId.current) return;
        if (res.success) {
          const rows = res.data ?? [];
          setResults((prev) => (append ? [...prev, ...rows] : rows));
          setTotal(res.meta?.total ?? rows.length);
          setPage(nextPage);
        } else setError(res.message || 'Failed to load users');
      } catch {
        if (id === reqId.current) setError('Failed to load users');
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Debounced server search; re-fetches page 1 whenever the dropdown opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchPage(query, 1, false), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, query, fetchPage]);

  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);

  const toggle = (u: MailRecipientUser) =>
    onChange(
      selectedIds.has(u.id)
        ? selected.filter((s) => s.id !== u.id)
        : [...selected, { id: u.id, name: u.name, email: u.email, picture: u.picture }]
    );

  const hasMore = results.length < total;

  return (
    <div>
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
                ? 'Select users'
                : `${selected.length} user${selected.length === 1 ? '' : 's'} selected`}
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
                placeholder="Search by name or email…"
                className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {loading && (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
              </div>
            )}
            {!loading && error && (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-rose-600">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fetchPage(query, 1, false)}
                >
                  Retry
                </Button>
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">
                {query.trim() ? 'No users match your search' : 'No active users with an email'}
              </p>
            )}
            {!loading &&
              results.map((u) => {
                const isSelected = selectedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700'
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
                    {/* plain avatar — safe inside a button (no nested button) */}
                    <ViewableAvatar
                      plain
                      src={u.picture}
                      name={u.name}
                      className="h-7 w-7 shrink-0"
                      fallbackClassName="text-[10px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{u.name}</span>
                      <span className="block truncate text-xs text-slate-400">{u.email}</span>
                    </span>
                  </button>
                );
              })}
            {!loading && !error && hasMore && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchPage(query, page + 1, true)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Load more ({results.length}/{total.toLocaleString()})
              </button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {selected.map((u) => (
              <motion.span
                key={u.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                title={u.email}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100"
              >
                {u.name}
                <button
                  type="button"
                  aria-label={`Remove ${u.name}`}
                  onClick={() => onChange(selected.filter((s) => s.id !== u.id))}
                  className="rounded-full p-0.5 transition-colors hover:bg-indigo-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
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

/**
 * Free-form recipient entry for campaigns: accepts any email address
 * (including external ones), one at a time or pasted as a comma / space /
 * newline separated list. Invalid entries are reported inline, never dropped
 * silently.
 */
export function ManualEmailInput({
  emails,
  onChange,
  disabled = false,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addFromInput = () => {
    const parts = value
      .split(/[,;\s]+/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    setValue('');
    if (parts.length === 0) return;
    const invalid = parts.filter((p) => !EMAIL_RE.test(p));
    const deduped = [...new Set(parts.filter((p) => EMAIL_RE.test(p)))].filter(
      (e) => !emails.includes(e)
    );
    if (deduped.length > 0) onChange([...emails, ...deduped]);
    setError(
      invalid.length > 0
        ? `${invalid.length} invalid address${invalid.length === 1 ? '' : 'es'} skipped: ${invalid
            .slice(0, 3)
            .join(', ')}${invalid.length > 3 ? '…' : ''}`
        : null
    );
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFromInput();
            }
          }}
          placeholder="name@example.com"
        />
        <Button type="button" variant="outline" disabled={disabled} onClick={addFromInput} className="shrink-0 font-semibold">
          Add
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Press Enter or Add after typing. Paste comma or space separated lists — external
        addresses (users without accounts) are allowed.
      </p>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}

      {emails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {emails.map((email) => (
              <motion.span
                key={email}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100"
              >
                {email}
                <button
                  type="button"
                  aria-label={`Remove ${email}`}
                  onClick={() => onChange(emails.filter((e) => e !== email))}
                  className="rounded-full p-0.5 transition-colors hover:bg-indigo-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {emails.length > 1 && (
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
