"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatSigned } from "@/lib/format";

export type DailyStatsData = {
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
};

export function DailyStats({ data }: { data: DailyStatsData }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2.5 min-w-[260px]">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Daily stats
        </span>
        <LiveClock />
      </div>
      <div className="flex items-baseline gap-4 flex-wrap">
        <span
          className={cn(
            "font-mono tabular-nums text-lg font-semibold tracking-tight",
            data.pnl > 0 && "text-profit",
            data.pnl < 0 && "text-loss"
          )}
        >
          {formatSigned(data.pnl)}
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">
            {data.trades}
          </span>{" "}
          {data.trades === 1 ? "trade" : "trades"}
        </span>
        <span className="text-sm font-mono tabular-nums">
          <span className="text-profit">{data.wins}</span>
          <span className="text-muted-foreground"> / </span>
          <span className="text-loss">{data.losses}</span>
        </span>
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Align first tick to the next minute boundary, then every 60s.
    let interval: ReturnType<typeof setInterval> | undefined;
    const ms = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, ms);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!now) {
    return <span className="text-xs font-mono tabular-nums text-muted-foreground">&nbsp;</span>;
  }

  return (
    <span className="text-xs font-mono tabular-nums text-muted-foreground">
      {formatTime(now)} {formatTimeZone(now)}
    </span>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeZone(d: Date) {
  // Try short tz name (e.g., "PST"). Fall back to GMT offset if unavailable.
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
    }).formatToParts(d);
    const tz = parts.find((p) => p.type === "timeZoneName")?.value;
    if (tz) return tz;
  } catch {
    // ignore
  }
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}
