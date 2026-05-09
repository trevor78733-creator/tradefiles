"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TradesPerDayBucket } from "@/lib/stats";
import { formatPercent, formatUsd } from "@/lib/format";

const PROFIT = "var(--profit)";
const LOSS = "var(--loss)";
const BAR = "var(--chart-positive)";
const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";

export function TradesPerDayCard({ buckets }: { buckets: TradesPerDayBucket[] }) {
  // Determine y axis: win rate as percentage (0-100). Bars colored by net pnl sign.
  const data = buckets.map((b) => ({
    label: b.label,
    winRate: b.winRate * 100,
    pnl: b.pnl,
    days: b.days,
    trades: b.trades,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Win rate by trades per day</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Trades that day",
                  position: "insideBottom",
                  offset: -2,
                  fill: AXIS,
                  fontSize: 10,
                }}
              />
              <YAxis
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                width={36}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-md border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-lg space-y-1">
                      <div className="font-medium">
                        {d.label} {d.label === "1" ? "trade" : "trades"} per day
                      </div>
                      <div className="text-muted-foreground">
                        {d.days} {d.days === 1 ? "day" : "days"} · {d.trades} trades
                      </div>
                      <div className="font-mono tabular-nums">
                        Win rate:{" "}
                        <span className="font-semibold">
                          {formatPercent(d.winRate / 100)}
                        </span>
                      </div>
                      <div
                        className="font-mono tabular-nums"
                        style={{ color: d.pnl >= 0 ? PROFIT : LOSS }}
                      >
                        Net P&L:{" "}
                        <span className="font-semibold">{formatUsd(d.pnl)}</span>
                      </div>
                    </div>
                  );
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={BAR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Bar height shows win rate for days with that many trades.
        </div>
      </CardContent>
    </Card>
  );
}
