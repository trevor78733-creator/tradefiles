import type { Trade } from "./generated/prisma/client";

export type Side = "ALL" | "LONG" | "SHORT";
export type Result = "ALL" | "WIN" | "LOSS" | "BREAKEVEN";

export const SESSION_KEYS = [
  "ALL",
  "PREMARKET",
  "MORNING",
  "LUNCH",
  "AFTERNOON",
  "AFTERHOURS",
] as const;
export type Session = (typeof SESSION_KEYS)[number];

export const SESSION_LABELS: Record<Session, string> = {
  ALL: "Any session",
  PREMARKET: "Pre-market (before 9:30)",
  MORNING: "Morning (9:30–11:30)",
  LUNCH: "Lunch (11:30–13:00)",
  AFTERNOON: "Afternoon (13:00–16:00)",
  AFTERHOURS: "After hours (after 16:00)",
};

export const CONTRACTS_KEYS = ["ALL", "1", "2-3", "4-5", "6+"] as const;
export type ContractsBucket = (typeof CONTRACTS_KEYS)[number];

export const DURATION_KEYS = [
  "ALL",
  "LT5M",
  "5_15M",
  "15_60M",
  "1_4H",
  "GT4H",
] as const;
export type DurationBucket = (typeof DURATION_KEYS)[number];

export const DURATION_LABELS: Record<DurationBucket, string> = {
  ALL: "Any duration",
  LT5M: "Under 5m",
  "5_15M": "5–15m",
  "15_60M": "15–60m",
  "1_4H": "1–4h",
  GT4H: "Over 4h",
};

export const RR_KEYS = ["ALL", "UNKNOWN", "LT1", "1_2", "2_3", "GT3"] as const;
export type RRBucket = (typeof RR_KEYS)[number];

export const RR_LABELS: Record<RRBucket, string> = {
  ALL: "Any R:R",
  UNKNOWN: "No stop set",
  LT1: "Under 1R",
  "1_2": "1–2R",
  "2_3": "2–3R",
  GT3: "Over 3R",
};

export const DOW_KEYS = ["ALL", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type DayOfWeek = (typeof DOW_KEYS)[number];

export const DOW_LABELS: Record<DayOfWeek, string> = {
  ALL: "Any day",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export type AnalyticsFilters = {
  symbol: string | "ALL";
  side: Side;
  result: Result;
  session: Session;
  contracts: ContractsBucket;
  duration: DurationBucket;
  rr: RRBucket;
  dow: DayOfWeek;
};

export const DEFAULT_FILTERS: AnalyticsFilters = {
  symbol: "ALL",
  side: "ALL",
  result: "ALL",
  session: "ALL",
  contracts: "ALL",
  duration: "ALL",
  rr: "ALL",
  dow: "ALL",
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== "string") return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseAnalyticsFilters(
  search: Record<string, string | string[] | undefined> | URLSearchParams,
  prefix = ""
): AnalyticsFilters {
  const get = (k: string): string | undefined => {
    const key = prefix + k;
    if (search instanceof URLSearchParams) return search.get(key) ?? undefined;
    const v = search[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    symbol: get("symbol") || "ALL",
    side: pick(get("side"), ["ALL", "LONG", "SHORT"], "ALL"),
    result: pick(get("result"), ["ALL", "WIN", "LOSS", "BREAKEVEN"], "ALL"),
    session: pick(get("session"), SESSION_KEYS, "ALL"),
    contracts: pick(get("contracts"), CONTRACTS_KEYS, "ALL"),
    duration: pick(get("duration"), DURATION_KEYS, "ALL"),
    rr: pick(get("rr"), RR_KEYS, "ALL"),
    dow: pick(get("dow"), DOW_KEYS, "ALL"),
  };
}

export function getSession(d: Date): Exclude<Session, "ALL"> {
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes < 9 * 60 + 30) return "PREMARKET";
  if (minutes < 11 * 60 + 30) return "MORNING";
  if (minutes < 13 * 60) return "LUNCH";
  if (minutes < 16 * 60) return "AFTERNOON";
  return "AFTERHOURS";
}

export function getContractsBucket(contracts: number): Exclude<ContractsBucket, "ALL"> {
  if (contracts <= 1) return "1";
  if (contracts <= 3) return "2-3";
  if (contracts <= 5) return "4-5";
  return "6+";
}

export function getDurationBucket(opened: Date, closed: Date): Exclude<DurationBucket, "ALL"> {
  const minutes = (closed.getTime() - opened.getTime()) / 60000;
  if (minutes < 5) return "LT5M";
  if (minutes < 15) return "5_15M";
  if (minutes < 60) return "15_60M";
  if (minutes < 240) return "1_4H";
  return "GT4H";
}

/**
 * R:R = |exit - entry| / |entry - stop|. When stop is missing or risk is 0,
 * returns null (we bucket as UNKNOWN).
 */
export function computeRR(
  entryPrice: number | null,
  exitPrice: number | null,
  stopPrice: number | null
): number | null {
  if (entryPrice == null || exitPrice == null || stopPrice == null) return null;
  const risk = Math.abs(entryPrice - stopPrice);
  if (risk === 0) return null;
  return Math.abs(exitPrice - entryPrice) / risk;
}

export function getRRBucket(rr: number | null): Exclude<RRBucket, "ALL"> {
  if (rr == null) return "UNKNOWN";
  if (rr < 1) return "LT1";
  if (rr < 2) return "1_2";
  if (rr < 3) return "2_3";
  return "GT3";
}

const DOW_INDEX: Record<Exclude<DayOfWeek, "ALL">, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export function applyAnalyticsFilters(trades: Trade[], filters: AnalyticsFilters): Trade[] {
  return trades.filter((t) => {
    if (filters.symbol !== "ALL" && t.symbol !== filters.symbol) return false;
    if (filters.side !== "ALL" && t.direction !== filters.side) return false;
    if (filters.result !== "ALL" && t.result !== filters.result) return false;
    if (filters.session !== "ALL" && getSession(t.openedAt) !== filters.session) return false;
    if (filters.contracts !== "ALL" && getContractsBucket(t.contracts) !== filters.contracts)
      return false;
    if (
      filters.duration !== "ALL" &&
      getDurationBucket(t.openedAt, t.closedAt) !== filters.duration
    )
      return false;
    if (filters.rr !== "ALL") {
      const bucket = getRRBucket(computeRR(t.entryPrice, t.exitPrice, t.stopPrice));
      if (bucket !== filters.rr) return false;
    }
    if (filters.dow !== "ALL") {
      if (t.closedAt.getDay() !== DOW_INDEX[filters.dow]) return false;
    }
    return true;
  });
}

export function activeFilterCount(filters: AnalyticsFilters): number {
  return Object.values(filters).filter((v) => v !== "ALL").length;
}
