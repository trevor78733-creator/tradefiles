import type { Trade } from "./generated/prisma/client";

export type TradeStats = {
  count: number;
  netPnl: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  avgWinLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  longCount: number;
  shortCount: number;
  longWinRate: number;
  shortWinRate: number;
  avgHoldMinutes: number;
  dayCount: number;
  winningDays: number;
  losingDays: number;
  dayWinRate: number;
  bestDayPnl: number;
  worstDayPnl: number;
};

export function computeStats(trades: Trade[]): TradeStats {
  const count = trades.length;
  if (count === 0) {
    return {
      count: 0,
      netPnl: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinLoss: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      longCount: 0,
      shortCount: 0,
      longWinRate: 0,
      shortWinRate: 0,
      avgHoldMinutes: 0,
      dayCount: 0,
      winningDays: 0,
      losingDays: 0,
      dayWinRate: 0,
      bestDayPnl: 0,
      worstDayPnl: 0,
    };
  }

  let netPnl = 0;
  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let longCount = 0;
  let longWins = 0;
  let shortCount = 0;
  let shortWins = 0;
  let totalHoldMs = 0;

  for (const t of trades) {
    netPnl += t.pnl;
    if (t.result === "WIN") {
      wins += 1;
      grossProfit += t.pnl;
      if (t.pnl > largestWin) largestWin = t.pnl;
    } else if (t.result === "LOSS") {
      losses += 1;
      grossLoss += Math.abs(t.pnl);
      if (t.pnl < largestLoss) largestLoss = t.pnl;
    } else {
      breakeven += 1;
    }
    if (t.direction === "LONG") {
      longCount += 1;
      if (t.result === "WIN") longWins += 1;
    } else {
      shortCount += 1;
      if (t.result === "WIN") shortWins += 1;
    }
    totalHoldMs += Math.max(0, t.closedAt.getTime() - t.openedAt.getTime());
  }

  const decided = wins + losses;
  const winRate = decided > 0 ? wins / decided : 0;
  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const dayMap = new Map<string, number>();
  for (const t of trades) {
    const key = dayKey(t.closedAt);
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
  }
  let winningDays = 0;
  let losingDays = 0;
  let bestDayPnl = 0;
  let worstDayPnl = 0;
  for (const v of dayMap.values()) {
    if (v > 0) winningDays += 1;
    else if (v < 0) losingDays += 1;
    if (v > bestDayPnl) bestDayPnl = v;
    if (v < worstDayPnl) worstDayPnl = v;
  }
  const dayCount = dayMap.size;
  const decidedDays = winningDays + losingDays;
  const dayWinRate = decidedDays > 0 ? winningDays / decidedDays : 0;

  return {
    count,
    netPnl,
    wins,
    losses,
    breakeven,
    winRate,
    avgWin,
    avgLoss,
    avgWinLoss,
    profitFactor: isFinite(profitFactor) ? profitFactor : 0,
    largestWin,
    largestLoss,
    longCount,
    shortCount,
    longWinRate: longCount > 0 ? longWins / longCount : 0,
    shortWinRate: shortCount > 0 ? shortWins / shortCount : 0,
    avgHoldMinutes: count > 0 ? totalHoldMs / count / 60000 : 0,
    dayCount,
    winningDays,
    losingDays,
    dayWinRate,
    bestDayPnl,
    worstDayPnl,
  };
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildDailyPnl(trades: Trade[]): { date: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const key = dayKey(t.closedAt);
    map.set(key, (map.get(key) ?? 0) + t.pnl);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => ({ date, pnl }));
}

export function buildCumulativePnl(
  daily: { date: string; pnl: number }[]
): { date: string; cumulative: number }[] {
  let acc = 0;
  return daily.map((d) => ({ date: d.date, cumulative: (acc += d.pnl) }));
}

export type StreakStats = {
  current: { type: "WIN" | "LOSS" | "NONE"; length: number };
  longestWin: number;
  longestLoss: number;
};

export function computeStreaks(trades: Trade[]): StreakStats {
  if (trades.length === 0) {
    return { current: { type: "NONE", length: 0 }, longestWin: 0, longestLoss: 0 };
  }
  const sorted = [...trades].sort(
    (a, b) => a.closedAt.getTime() - b.closedAt.getTime()
  );
  let longestWin = 0;
  let longestLoss = 0;
  let runWin = 0;
  let runLoss = 0;
  let currentType: "WIN" | "LOSS" | "NONE" = "NONE";
  let currentLength = 0;
  for (const t of sorted) {
    if (t.result === "WIN") {
      runWin += 1;
      runLoss = 0;
      if (runWin > longestWin) longestWin = runWin;
      currentType = "WIN";
      currentLength = runWin;
    } else if (t.result === "LOSS") {
      runLoss += 1;
      runWin = 0;
      if (runLoss > longestLoss) longestLoss = runLoss;
      currentType = "LOSS";
      currentLength = runLoss;
    } else {
      // BE breaks both streaks but doesn't extend either
      runWin = 0;
      runLoss = 0;
      currentType = "NONE";
      currentLength = 0;
    }
  }
  return { current: { type: currentType, length: currentLength }, longestWin, longestLoss };
}

export type AfterLossStats = {
  followers: number;
  followerWins: number;
  followerLosses: number;
  followerWinRate: number;
  followerAvgPnl: number;
  baselineWinRate: number;
  baselineAvgPnl: number;
};

export function computeAfterLoss(trades: Trade[]): AfterLossStats {
  const sorted = [...trades].sort(
    (a, b) => a.closedAt.getTime() - b.closedAt.getTime()
  );
  let followers = 0;
  let fWins = 0;
  let fLosses = 0;
  let fPnl = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].result === "LOSS") {
      const next = sorted[i + 1];
      followers += 1;
      if (next.result === "WIN") fWins += 1;
      else if (next.result === "LOSS") fLosses += 1;
      fPnl += next.pnl;
    }
  }
  const fDecided = fWins + fLosses;
  let bWins = 0;
  let bLosses = 0;
  let bPnl = 0;
  for (const t of sorted) {
    if (t.result === "WIN") bWins += 1;
    if (t.result === "LOSS") bLosses += 1;
    bPnl += t.pnl;
  }
  const bDecided = bWins + bLosses;
  return {
    followers,
    followerWins: fWins,
    followerLosses: fLosses,
    followerWinRate: fDecided > 0 ? fWins / fDecided : 0,
    followerAvgPnl: followers > 0 ? fPnl / followers : 0,
    baselineWinRate: bDecided > 0 ? bWins / bDecided : 0,
    baselineAvgPnl: sorted.length > 0 ? bPnl / sorted.length : 0,
  };
}

export type TradesPerDayBucket = {
  label: string;
  days: number;
  trades: number;
  pnl: number;
  winRate: number;
};

export function computeByTradesPerDay(trades: Trade[]): TradesPerDayBucket[] {
  const dayMap = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = dayKey(t.closedAt);
    const list = dayMap.get(k) ?? [];
    list.push(t);
    dayMap.set(k, list);
  }
  const labels = ["1", "2", "3", "4", "5+"] as const;
  const out: Record<string, { days: number; trades: number; pnl: number; wins: number; losses: number }> = {};
  for (const l of labels) out[l] = { days: 0, trades: 0, pnl: 0, wins: 0, losses: 0 };
  for (const list of dayMap.values()) {
    const k = list.length >= 5 ? "5+" : String(list.length);
    if (!(k in out)) continue;
    out[k].days += 1;
    for (const t of list) {
      out[k].trades += 1;
      out[k].pnl += t.pnl;
      if (t.result === "WIN") out[k].wins += 1;
      if (t.result === "LOSS") out[k].losses += 1;
    }
  }
  return labels.map((l) => {
    const b = out[l];
    const decided = b.wins + b.losses;
    return {
      label: l,
      days: b.days,
      trades: b.trades,
      pnl: b.pnl,
      winRate: decided > 0 ? b.wins / decided : 0,
    };
  });
}

export type HeatmapCell = {
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
};

export type HeatmapResult = {
  cells: HeatmapCell[][]; // [dow 0-6][bucket]
  bucketStartMinutes: number;
  bucketSizeMinutes: number;
  bucketCount: number;
};

/**
 * 15-minute buckets between 09:00 and 16:30 local time, indexed by day of week.
 * Trades outside that window are not included in the heatmap (they show in the
 * "out of window" overflow handled separately if needed).
 */
export function computeHeatmap(
  trades: Trade[],
  startMinutes = 9 * 60,
  endMinutes = 16 * 60 + 30,
  bucketSize = 15
): HeatmapResult {
  const bucketCount = Math.ceil((endMinutes - startMinutes) / bucketSize);
  const cells: HeatmapCell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: bucketCount }, () => ({ trades: 0, pnl: 0, wins: 0, losses: 0 }))
  );
  for (const t of trades) {
    const d = t.openedAt;
    const dow = d.getDay();
    const minute = d.getHours() * 60 + d.getMinutes();
    if (minute < startMinutes || minute >= endMinutes) continue;
    const idx = Math.floor((minute - startMinutes) / bucketSize);
    if (idx < 0 || idx >= bucketCount) continue;
    const cell = cells[dow][idx];
    cell.trades += 1;
    cell.pnl += t.pnl;
    if (t.result === "WIN") cell.wins += 1;
    if (t.result === "LOSS") cell.losses += 1;
  }
  return {
    cells,
    bucketStartMinutes: startMinutes,
    bucketSizeMinutes: bucketSize,
    bucketCount,
  };
}

export function buildCalendar(
  trades: Trade[],
  year: number,
  month: number // 0-indexed
): {
  days: { date: Date; inMonth: boolean; pnl: number; tradeCount: number }[];
  monthPnl: number;
  weeklyPnl: { weekStart: Date; pnl: number; tradeCount: number }[];
} {
  const map = new Map<string, { pnl: number; count: number }>();
  for (const t of trades) {
    const key = dayKey(t.closedAt);
    const cur = map.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += t.pnl;
    cur.count += 1;
    map.set(key, cur);
  }

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const start = new Date(year, month, 1 - startWeekday);
  const days: { date: Date; inMonth: boolean; pnl: number; tradeCount: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    const entry = map.get(key);
    days.push({
      date: d,
      inMonth: d.getMonth() === month,
      pnl: entry?.pnl ?? 0,
      tradeCount: entry?.count ?? 0,
    });
  }

  let monthPnl = 0;
  for (const d of days) if (d.inMonth) monthPnl += d.pnl;

  const weeklyPnl: { weekStart: Date; pnl: number; tradeCount: number }[] = [];
  for (let w = 0; w < 6; w++) {
    let pnl = 0;
    let count = 0;
    let hasInMonth = false;
    for (let i = 0; i < 7; i++) {
      const d = days[w * 7 + i];
      if (d.inMonth) {
        pnl += d.pnl;
        count += d.tradeCount;
        hasInMonth = true;
      }
    }
    if (hasInMonth) {
      weeklyPnl.push({ weekStart: days[w * 7].date, pnl, tradeCount: count });
    }
  }

  return { days, monthPnl, weeklyPnl };
}
