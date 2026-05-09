"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeatmapResult } from "@/lib/stats";
import { formatPercent, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function Heatmap({ data }: { data: HeatmapResult }) {
  const { cells, bucketStartMinutes, bucketSizeMinutes, bucketCount } = data;

  const [hovered, setHovered] = useState<{ dow: number; idx: number } | null>(
    null
  );

  // Compute max absolute pnl for color scaling
  const maxAbs = useMemo(() => {
    let m = 0;
    for (const row of cells) {
      for (const c of row) {
        const a = Math.abs(c.pnl);
        if (a > m) m = a;
      }
    }
    return m;
  }, [cells]);

  // Determine which DOW rows have any trades
  const activeDows = useMemo(() => {
    const out: number[] = [];
    for (let d = 0; d < 7; d++) {
      if (cells[d].some((c) => c.trades > 0)) out.push(d);
    }
    if (out.length === 0) {
      // Default to Mon-Fri so the grid still renders
      return [1, 2, 3, 4, 5];
    }
    return out;
  }, [cells]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Time-of-day heatmap
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {minutesToLabel(bucketStartMinutes)}–
            {minutesToLabel(bucketStartMinutes + bucketCount * bucketSizeMinutes)}{" "}
            local · {bucketSizeMinutes}-min buckets
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="w-10" />
                {Array.from({ length: bucketCount }).map((_, i) => {
                  const m = bucketStartMinutes + i * bucketSizeMinutes;
                  const isHourMark = m % 60 === 0;
                  return (
                    <th
                      key={i}
                      className={cn(
                        "text-[10px] font-normal text-muted-foreground w-5 align-bottom h-5",
                        !isHourMark && "opacity-0"
                      )}
                    >
                      {isHourMark ? `${Math.floor(m / 60)}` : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeDows.map((d) => (
                <tr key={d}>
                  <td className="text-[11px] text-muted-foreground pr-2 w-10 text-right">
                    {DOW_LABELS[d]}
                  </td>
                  {cells[d].map((cell, i) => {
                    const intensity =
                      maxAbs > 0 ? Math.min(1, Math.abs(cell.pnl) / maxAbs) : 0;
                    const isPositive = cell.pnl > 0;
                    const isNegative = cell.pnl < 0;
                    // Cells: red for winning, blue for losing
                    const bgVar = isPositive
                      ? "var(--loss)"
                      : isNegative
                      ? "var(--chart-positive)"
                      : "var(--muted)";
                    const opacity =
                      cell.trades === 0 ? 0.06 : 0.15 + intensity * 0.65;
                    const isHovered =
                      hovered?.dow === d && hovered?.idx === i;
                    return (
                      <td key={i} className="p-0">
                        <button
                          type="button"
                          onMouseEnter={() => setHovered({ dow: d, idx: i })}
                          onMouseLeave={() => setHovered(null)}
                          className={cn(
                            "block size-5 rounded-sm transition-all relative",
                            isHovered && "ring-1 ring-primary"
                          )}
                          style={{
                            backgroundColor: bgVar,
                            opacity,
                          }}
                          aria-label={`${DOW_LABELS[d]} ${minutesToLabel(
                            bucketStartMinutes + i * bucketSizeMinutes
                          )}: ${cell.trades} trades`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 min-h-[40px] text-xs">
          {hovered ? (
            <HeatmapTooltip
              dow={hovered.dow}
              idx={hovered.idx}
              cell={cells[hovered.dow][hovered.idx]}
              startMinutes={bucketStartMinutes + hovered.idx * bucketSizeMinutes}
              bucketSize={bucketSizeMinutes}
            />
          ) : (
            <div className="text-muted-foreground">
              Hover a cell for trade count, win rate and P&L.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapTooltip({
  dow,
  cell,
  startMinutes,
  bucketSize,
}: {
  dow: number;
  idx: number;
  cell: { trades: number; pnl: number; wins: number; losses: number };
  startMinutes: number;
  bucketSize: number;
}) {
  const decided = cell.wins + cell.losses;
  const winRate = decided > 0 ? cell.wins / decided : 0;
  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <div className="font-medium">
        {DOW_LABELS[dow]}{" "}
        <span className="font-mono tabular-nums">
          {minutesToLabel(startMinutes)}–{minutesToLabel(startMinutes + bucketSize)}
        </span>
      </div>
      {cell.trades === 0 ? (
        <div className="text-muted-foreground">No trades.</div>
      ) : (
        <>
          <div className="text-muted-foreground">
            {cell.trades} {cell.trades === 1 ? "trade" : "trades"}
          </div>
          <div className="text-muted-foreground">
            Win rate:{" "}
            <span className="font-mono tabular-nums">
              {formatPercent(winRate)}
            </span>
          </div>
          <div
            className="font-mono tabular-nums"
            style={{
              color:
                cell.pnl > 0
                  ? "var(--profit)"
                  : cell.pnl < 0
                  ? "var(--loss)"
                  : undefined,
            }}
          >
            {formatUsd(cell.pnl)}
          </div>
        </>
      )}
    </div>
  );
}
