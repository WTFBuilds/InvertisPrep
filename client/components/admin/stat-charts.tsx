'use client';

import { useEffect, useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminActivityApi } from '@/lib/api';
import type { SeriesPoint, StatRange } from '@/types';

export interface StatChartPoint {
  label: string;
  value: number;
  sub?: string;
}

export const RANGE_OPTIONS: { value: StatRange; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
];

const RANGE_VS_LABEL: Record<StatRange, string> = {
  '24h': 'previous 24 hours',
  '7d': 'previous 7 days',
  '30d': 'previous 30 days',
  '90d': 'previous 3 months',
};

/** Vercel-style time-range dropdown for the analytics graphs. */
export function RangePicker({
  value,
  onChange,
}: {
  value: StatRange;
  onChange: (range: StatRange) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatRange)}>
      <SelectTrigger className="h-7 w-[112px] rounded-lg border-slate-200 text-[11px] font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Series hook ──────────────────────────────────────────────────────────────
export interface SeriesData {
  series: SeriesPoint[];
  total?: number;
  prevTotal?: number;
  loading: boolean;
}

/**
 * Polls one /series endpoint for a range-picker graph and keeps the window
 * totals for the Vercel-style stat header. Module scope = stable hook.
 */
export function useSeriesData(
  metric: 'signups' | 'active',
  range: StatRange,
  enabled = true
): SeriesData {
  const [data, setData] = useState<SeriesData>({ series: [], loading: true });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      adminActivityApi
        .series(metric, range)
        .then((r) => {
          if (cancelled) return;
          if (r.success && r.data) {
            setData({
              series: r.data.series ?? [],
              total: r.data.total,
              prevTotal: r.data.prevTotal,
              loading: false,
            });
          } else setData((d) => ({ ...d, loading: false }));
        })
        .catch(() => {
          if (!cancelled) setData((d) => ({ ...d, loading: false }));
        });
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [metric, range, enabled]);

  return data;
}

// ── Vercel-style stat header ─────────────────────────────────────────────────
// Big selected-range count + % change vs the equally-sized previous window —
// the "info above the graph" strip from Vercel Analytics.
export function ChartStatHeader({
  label,
  total,
  prevTotal,
  loading,
  range,
  onRangeChange,
}: {
  label: string;
  total?: number;
  prevTotal?: number;
  loading?: boolean;
  range?: StatRange;
  onRangeChange?: (range: StatRange) => void;
}) {
  const count = total ?? 0;
  // Server may briefly predate the total/prevTotal fields — fall back to the
  // bucket sum and hide the delta rather than showing a wrong number.
  let delta: { text: string; cls: string } | null = null;
  if (!loading && prevTotal !== undefined) {
    const prev = prevTotal;
    if (prev === 0) {
      delta = count > 0 ? { text: '+100%', cls: 'bg-emerald-50 text-emerald-600' } : null;
    } else {
      const pct = Math.round(((count - prev) / prev) * 100);
      delta =
        pct > 0
          ? { text: `+${pct}%`, cls: 'bg-emerald-50 text-emerald-600' }
          : pct < 0
            ? { text: `${pct}%`, cls: 'bg-rose-50 text-rose-600' }
            : { text: '0%', cls: 'bg-slate-100 text-slate-500' };
    }
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-500">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-8 w-20" />
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-black leading-none tracking-tight text-slate-900">
              {count.toLocaleString()}
            </span>
            {delta && (
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${delta.cls}`}>
                {delta.text}
              </span>
            )}
          </div>
        )}
        {!loading && prevTotal !== undefined && (
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            {range ? `vs ${RANGE_VS_LABEL[range]}` : 'vs previous period'}
          </p>
        )}
      </div>
      {range && onRangeChange && <RangePicker value={range} onChange={onRangeChange} />}
    </div>
  );
}

/**
 * Full Vercel-Analytics-style chart card: stat header (selected-range total +
 * delta badge) over the area chart, with the range picker top-right.
 */
export function StatChartCard({
  label,
  data,
  total,
  prevTotal,
  loading,
  range,
  onRangeChange,
  color = '#6366f1',
  height = 210,
  formatLabel,
  formatTooltipTitle,
  onBarClick,
  footer,
  className,
}: {
  label: string;
  data: StatChartPoint[];
  total?: number;
  prevTotal?: number;
  loading?: boolean;
  range: StatRange;
  onRangeChange: (range: StatRange) => void;
  color?: string;
  height?: number;
  formatLabel?: (label: string) => string;
  formatTooltipTitle?: (item: StatChartPoint) => string;
  onBarClick?: (item: StatChartPoint) => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  // Older servers omit total — fall back to the bucket sum so the header
  // number is still right during deploys.
  const sum = data.reduce((acc, p) => acc + p.value, 0);
  const resolvedTotal = total ?? sum;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className ?? ''}`}>
      <div className="border-b border-slate-100 pb-3">
        <ChartStatHeader
          label={label}
          total={resolvedTotal}
          prevTotal={prevTotal}
          loading={loading}
          range={range}
          onRangeChange={onRangeChange}
        />
      </div>
      <div className="pt-3">
        <StatAreaChart
          data={data}
          height={height}
          color={color}
          formatLabel={formatLabel}
          formatTooltipTitle={formatTooltipTitle}
          onBarClick={onBarClick}
        />
      </div>
      {footer}
    </div>
  );
}

/**
 * Vercel-Analytics-style graph built on the shadcn chart primitives: a smooth
 * monotone curve with a fading gradient fill, a vertical cursor line, hover
 * dot, exact-value tooltip — and click-anywhere drill-down (the nearest day's
 * data is passed to onBarClick).
 */
export function StatAreaChart({
  data,
  height = 200,
  color = '#6366f1',
  formatLabel,
  formatTooltipTitle,
  onBarClick,
}: {
  data: StatChartPoint[];
  height?: number;
  /** Any CSS color — page accents keep the graphs consistent. */
  color?: string;
  formatLabel?: (label: string) => string;
  formatTooltipTitle?: (item: StatChartPoint) => string;
  onBarClick?: (item: StatChartPoint) => void;
}) {
  // Unique gradient id per chart instance (3+ graphs share a page)
  const rawId = useId();
  const gradId = `grad-${rawId.replace(/[:]/g, '')}`;

  const config = {
    value: { label: 'Users', color },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 12, bottom: 0, left: 4 }}
        // Recharts passes its MouseHandlerDataParam here; typed loosely so we
        // don't depend on internal recharts type exports.
        onClick={(state: object) => {
          if (!onBarClick) return;
          const payload = (state as { activePayload?: Array<{ payload?: StatChartPoint }> })
            ?.activePayload?.[0]?.payload;
          if (payload) onBarClick(payload);
        }}
        className={onBarClick ? 'cursor-pointer' : undefined}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.38} />
            <stop offset="55%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {/* Horizontal gridlines aligned with the Y-axis notations — clearly visible */}
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.9} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) => (formatLabel ? formatLabel(value) : value)}
        />
        {/* Visible Y-axis notations — subtle ticks, integers only */}
        <YAxis
          width={34}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax * 1.2))]}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.3, strokeWidth: 1.5 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_label, payload) => {
                const point = payload?.[0]?.payload as StatChartPoint | undefined;
                if (formatTooltipTitle && point) return formatTooltipTitle(point);
                return point?.label ?? String(_label);
              }}
              formatter={(value) => (
                <div className="flex min-w-16 items-center justify-between gap-6">
                  <span className="font-medium text-muted-foreground">Users</span>
                  <span className="font-black tabular-nums text-foreground">{String(value)}</span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#fff', fill: color }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
