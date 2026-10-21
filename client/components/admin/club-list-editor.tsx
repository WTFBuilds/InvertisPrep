'use client';

import { useState } from 'react';
import { Plus, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button as UiButton } from '@/components/ui/button';

/**
 * A repeatable list of plain strings — used for a club's highlights,
 * perks and agenda entries. Each row can be reordered, edited inline and
 * removed; a new row is appended from a single input.
 */
export function StringListEditor({
  value,
  onChange,
  placeholder = 'Add an item…',
  addLabel = 'Add item',
  rows = 1,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={disabled || index === 0}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={disabled || index === value.length - 1}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </span>
          <Input
            value={item}
            onChange={(e) => {
              const next = [...value];
              next[index] = e.target.value;
              onChange(next);
            }}
            disabled={disabled}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            disabled={disabled}
            className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        {rows > 1 ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                commit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="flex-1"
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
        )}
        <UiButton
          type="button"
          variant="outline"
          onClick={commit}
          disabled={disabled || !draft.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </UiButton>
      </div>
    </div>
  );
}

/**
 * A repeatable list of key/value pairs — used for a club's stats and
 * logistics rows, which are all `{ label, value }` shaped.
 */
export function PairListEditor({
  value,
  onChange,
  labelPlaceholder = 'Label',
  valuePlaceholder = 'Value',
  addLabel = 'Add row',
  disabled,
}: {
  value: { label: string; value: string }[];
  onChange: (next: { label: string; value: string }[]) => void;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<{ label: string; value: string }>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={row.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder={labelPlaceholder}
            disabled={disabled}
            className="w-1/3"
          />
          <Input
            value={row.value}
            onChange={(e) => update(index, { value: e.target.value })}
            placeholder={valuePlaceholder}
            disabled={disabled}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            disabled={disabled}
            className="rounded p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            aria-label="Remove row"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...value, { label: '', value: '' }])}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
