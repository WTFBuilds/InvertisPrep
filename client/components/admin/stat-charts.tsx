'use client';

import { useId } from 'react';
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
import type { StatRange } from '@/types';

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
