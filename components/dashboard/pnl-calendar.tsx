"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { buildCalendar, dayKey } from "@/lib/stats";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarTrade = {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  result: "WIN" | "LOSS" | "BREAKEVEN";
  contracts: number;
  pnl: number;
  closedAt: string;
};

export function PnlCalendar({ trades }: { trades: CalendarTrade[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const tradesParsed = useMemo(
    () =>
      trades.map((t) => ({
        ...t,
        closedAt: new Date(t.closedAt),
      })),
    [trades]
  );

  const tradesByDay = useMemo(() => {
    const map = new Map<string, typeof tradesParsed>();
    for (const t of tradesParsed) {
      const key = dayKey(t.closedAt);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
    }
    return map;
  }, [tradesParsed]);

  const calendar = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => buildCalendar(tradesParsed as any, year, month),
    [tradesParsed, year, month]
  );

  function prev() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }
  function next() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-base font-medium tabular-nums">
            {MONTH_NAMES[month]} {year}
          </div>
          <Button variant="ghost" size="icon" onClick={next} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Monthly P&L:{" "}
            <span
              className={cn(
                "font-mono font-semibold tabular-nums tracking-tight",
                calendar.monthPnl > 0 && "text-profit",
                calendar.monthPnl < 0 && "text-loss"
              )}
            >
              {formatUsd(calendar.monthPnl)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1.5 text-xs text-muted-foreground mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center py-1">
            {w}
          </div>
        ))}
        <div className="text-center py-1">Week</div>
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: 6 }).map((_, w) => {
          const weekDays = calendar.days.slice(w * 7, w * 7 + 7);
          const weekly = calendar.weeklyPnl.find(
            (wk) =>
              wk.weekStart.getTime() === weekDays[0].date.getTime()
          );
          return (
            <CalendarRow
              key={w}
              days={weekDays}
              weekly={weekly}
              tradesByDay={tradesByDay}
            />
          );
        })}
      </div>
    </Card>
  );
}

function CalendarRow({
  days,
  weekly,
  tradesByDay,
}: {
  days: { date: Date; inMonth: boolean; pnl: number; tradeCount: number }[];
  weekly?: { pnl: number; tradeCount: number };
  tradesByDay: Map<string, (CalendarTrade & { closedAt: Date })[]>;
}) {
  const today = new Date();
  return (
    <>
      {days.map((d, i) => {
        const isToday =
          d.date.getFullYear() === today.getFullYear() &&
          d.date.getMonth() === today.getMonth() &&
          d.date.getDate() === today.getDate();
        const hasTrades = d.tradeCount > 0;
        const dayTrades = tradesByDay.get(dayKey(d.date)) ?? [];

        const cell = (
          <div
            className={cn(
              "min-h-[80px] rounded-md border p-1.5 flex flex-col text-xs w-full text-left",
              !d.inMonth && "opacity-40",
              hasTrades && d.pnl > 0 && "bg-profit/10 border-profit/30",
              hasTrades && d.pnl < 0 && "bg-loss/10 border-loss/30",
              hasTrades && d.pnl === 0 && "bg-muted border-border",
              !hasTrades && "bg-card border-border",
              isToday && "ring-2 ring-primary",
              hasTrades && "cursor-pointer hover:ring-1 hover:ring-foreground/20 transition-shadow"
            )}
          >
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{d.date.getDate()}</span>
            </div>
            {hasTrades && (
              <div className="mt-auto">
                <div
                  className={cn(
                    "font-mono font-semibold tabular-nums tracking-tight",
                    d.pnl > 0 && "text-profit",
                    d.pnl < 0 && "text-loss",
                    d.pnl === 0 && "text-foreground"
                  )}
                >
                  {formatUsd(d.pnl)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {d.tradeCount} {d.tradeCount === 1 ? "trade" : "trades"}
                </div>
              </div>
            )}
          </div>
        );

        if (!hasTrades) {
          return <div key={i}>{cell}</div>;
        }

        return (
          <Popover key={i}>
            <PopoverTrigger
              render={<button type="button" className="block" />}
            >
              {cell}
            </PopoverTrigger>
            <PopoverContent
              className="w-80 max-h-96 overflow-auto"
              align="center"
              sideOffset={6}
            >
              <DayDetails date={d.date} pnl={d.pnl} trades={dayTrades} />
            </PopoverContent>
          </Popover>
        );
      })}
      <div className="min-h-[80px] rounded-md border border-border bg-secondary/40 p-1.5 flex flex-col text-xs">
        <div className="text-[11px] text-muted-foreground">Week</div>
        {weekly && weekly.tradeCount > 0 && (
          <div className="mt-auto">
            <div
              className={cn(
                "font-mono font-semibold tabular-nums tracking-tight",
                weekly.pnl > 0 && "text-profit",
                weekly.pnl < 0 && "text-loss",
                weekly.pnl === 0 && "text-foreground"
              )}
            >
              {formatUsdCompact(weekly.pnl)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {weekly.tradeCount} trades
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DayDetails({
  date,
  pnl,
  trades,
}: {
  date: Date;
  pnl: number;
  trades: (CalendarTrade & { closedAt: Date })[];
}) {
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-medium">{dateLabel}</div>
          <div className="text-xs text-muted-foreground">
            {trades.length} {trades.length === 1 ? "trade" : "trades"}
          </div>
        </div>
        <div
          className={cn(
            "font-mono font-semibold tabular-nums tracking-tight",
            pnl > 0 && "text-profit",
            pnl < 0 && "text-loss"
          )}
        >
          {formatUsd(pnl)}
        </div>
      </div>
      <ul className="space-y-1.5">
        {trades.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{t.symbol}</span>
                <Badge
                  variant="outline"
                  className="h-4 text-[10px] px-1"
                  style={{
                    color:
                      t.direction === "LONG"
                        ? "var(--chart-positive)"
                        : "var(--chart-neutral)",
                    borderColor:
                      t.direction === "LONG"
                        ? "color-mix(in oklch, var(--chart-positive) 40%, transparent)"
                        : "color-mix(in oklch, var(--chart-neutral) 40%, transparent)",
                  }}
                >
                  {t.direction === "LONG" ? "L" : "S"}
                </Badge>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {t.contracts}c · {formatTime(t.closedAt)}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "font-mono text-sm font-medium tabular-nums tracking-tight",
                t.pnl > 0 && "text-profit",
                t.pnl < 0 && "text-loss"
              )}
            >
              {formatUsd(t.pnl)}
            </div>
            <Link
              href={`/notes?id=${t.id}`}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open note"
            >
              <ExternalLink className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
