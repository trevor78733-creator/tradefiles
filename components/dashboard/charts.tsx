"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsd, formatUsdCompact } from "@/lib/format";

const POSITIVE = "var(--chart-positive)";
const NEUTRAL = "var(--chart-neutral)";
const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "P&L",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-md border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground">{label}</div>
      <div
        className="font-mono font-semibold tabular-nums"
        style={{ color: v >= 0 ? POSITIVE : NEUTRAL }}
      >
        {valueLabel}: {formatUsd(v)}
      </div>
    </div>
  );
}

export function CumulativePnlChart({
  data,
}: {
  data: { date: string; cumulative: number }[];
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={POSITIVE} stopOpacity={0.5} />
              <stop offset="100%" stopColor={POSITIVE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatUsdCompact(Number(v))}
            width={56}
          />
          <Tooltip
            content={(p) => (
              <ChartTooltip
                active={p.active}
                label={typeof p.label === "string" ? p.label : undefined}
                payload={p.payload as unknown as { value: number }[] | undefined}
                valueLabel="Cumulative"
              />
            )}
            cursor={{ stroke: GRID }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={POSITIVE}
            strokeWidth={2}
            fill="url(#cumulative)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniArea({
  data,
}: {
  data: { date: string; cumulative: number }[];
}) {
  return (
    <div className="h-12 w-32">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mini" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={POSITIVE} stopOpacity={0.6} />
              <stop offset="100%" stopColor={POSITIVE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={POSITIVE}
            strokeWidth={1.5}
            fill="url(#mini)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyPnlChart({ data }: { data: { date: string; pnl: number }[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatUsdCompact(Number(v))}
            width={56}
          />
          <Tooltip
            content={(p) => (
              <ChartTooltip
                active={p.active}
                label={typeof p.label === "string" ? p.label : undefined}
                payload={p.payload as unknown as { value: number }[] | undefined}
              />
            )}
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? POSITIVE : NEUTRAL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
