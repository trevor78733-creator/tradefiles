"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyPnlChart } from "@/components/dashboard/charts";
import { WinRateDonut } from "./win-rate-donut";
import { StreakCard } from "./streak-card";
import { AfterLossCard } from "./after-loss-card";
import { TradesPerDayCard } from "./trades-per-day-card";
import { Heatmap } from "./heatmap";
import { cn } from "@/lib/utils";
import {
  applyAnalyticsFilters,
  parseAnalyticsFilters,
} from "@/lib/analytics-filters";
import {
  buildDailyPnl,
  computeAfterLoss,
  computeByTradesPerDay,
  computeHeatmap,
  computeStats,
  computeStreaks,
} from "@/lib/stats";
import { formatPercent, formatSigned, formatUsd } from "@/lib/format";

export type AnalyticsTrade = {
  id: string;
  accountId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  result: "WIN" | "LOSS" | "BREAKEVEN";
  contracts: number;
  entryPrice: number | null;
  exitPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  pnl: number;
  openedAt: string;
  closedAt: string;
};

function rehydrate(
  trades: AnalyticsTrade[]
): (Omit<AnalyticsTrade, "openedAt" | "closedAt"> & { openedAt: Date; closedAt: Date })[] {
  return trades.map((t) => ({
    ...t,
    openedAt: new Date(t.openedAt),
    closedAt: new Date(t.closedAt),
  }));
}

export function AnalyticsContent({
  trades: rawTrades,
  prefix = "",
  compact = false,
}: {
  trades: AnalyticsTrade[];
  prefix?: string;
  compact?: boolean;
}) {
  const params = useSearchParams();
  const filters = parseAnalyticsFilters(params, prefix);

  const filtered = useMemo(() => {
    const hydrated = rehydrate(rawTrades);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return applyAnalyticsFilters(hydrated as any, filters);
  }, [rawTrades, filters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = useMemo(() => computeStats(filtered as any), [filtered]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const daily = useMemo(() => buildDailyPnl(filtered as any), [filtered]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streaks = useMemo(() => computeStreaks(filtered as any), [filtered]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterLoss = useMemo(() => computeAfterLoss(filtered as any), [filtered]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tradesPerDay = useMemo(() => computeByTradesPerDay(filtered as any), [filtered]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmap = useMemo(() => computeHeatmap(filtered as any), [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No trades match the current filters.
      </div>
    );
  }

  const avgPnl = stats.count > 0 ? stats.netPnl / stats.count : 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-4",
          compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        <Card>
          <CardHeader className={compact ? "pb-2" : undefined}>
            <CardTitle
              className={cn(
                "text-base flex items-baseline justify-between gap-2",
                compact && "text-sm"
              )}
            >
              <span>Net P&L</span>
              {compact && (
                <span className="text-xs text-muted-foreground font-normal">
                  {stats.count} {stats.count === 1 ? "trade" : "trades"}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "grid gap-4",
              compact ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            <BigStat
              label="Net"
              value={formatSigned(stats.netPnl)}
              tone={stats.netPnl > 0 ? "profit" : stats.netPnl < 0 ? "loss" : "default"}
              compact={compact}
            />
            <BigStat
              label="Avg / trade"
              value={formatSigned(avgPnl)}
              compact={compact}
            />
            {!compact && <BigStat label="trades" value={stats.count} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={compact ? "pb-2" : undefined}>
            <CardTitle className={cn("text-base", compact && "text-sm")}>
              Win rate
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "flex items-center",
              compact ? "gap-3" : "gap-6"
            )}
          >
            <div
              className={cn(
                "grid gap-3 flex-1 min-w-0",
                compact ? "grid-cols-3" : "grid-cols-3 gap-4"
              )}
            >
              <BigStat
                label="Win rate"
                value={formatPercent(stats.winRate)}
                compact={compact}
              />
              <BigStat label="Wins" value={stats.wins} compact={compact} />
              <BigStat label="Losses" value={stats.losses} compact={compact} />
              {!compact && stats.breakeven > 0 && (
                <BigStat label="breakeven" value={stats.breakeven} />
              )}
            </div>
            <WinRateDonut
              wins={stats.wins}
              losses={stats.losses}
              breakeven={stats.breakeven}
              size={compact ? "sm" : "md"}
            />
          </CardContent>
        </Card>
      </div>

      <div className={compact ? "" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        <StreakCard stats={streaks} />
        <AfterLossCard stats={afterLoss} />
      </div>

      <Card>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className={cn("text-base", compact && "text-sm")}>
            Best & worst
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BigStat
            label="Largest win"
            value={formatUsd(stats.largestWin)}
            compact={compact}
          />
          <BigStat
            label="Largest loss"
            value={formatUsd(stats.largestLoss)}
            compact={compact}
          />
          <BigStat
            label="Best day"
            value={formatUsd(stats.bestDayPnl)}
            compact={compact}
          />
          <BigStat
            label="Worst day"
            value={formatUsd(stats.worstDayPnl)}
            compact={compact}
          />
        </CardContent>
      </Card>

      <div className={compact ? "" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net daily P&L</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DailyPnlChart data={daily} />
          </CardContent>
        </Card>

        <TradesPerDayCard buckets={tradesPerDay} />
      </div>

      <Heatmap data={heatmap} />
    </div>
  );
}

function BigStat({
  label,
  value,
  tone = "default",
  compact = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "profit" | "loss";
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "uppercase tracking-wide text-muted-foreground truncate",
          compact ? "text-[10px]" : "text-xs"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-mono font-semibold tabular-nums tracking-tight truncate",
          compact ? "text-base" : "text-2xl",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss"
        )}
      >
        {value}
      </div>
    </div>
  );
}
