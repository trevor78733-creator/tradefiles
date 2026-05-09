export const DATE_RANGE_KEYS = ["7d", "30d", "90d", "ytd", "all", "custom"] as const;
export type DateRangeKey = (typeof DATE_RANGE_KEYS)[number];

export const PRESET_LABELS: Record<DateRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  all: "All time",
  custom: "Custom range",
};

export type ResolvedRange = {
  key: DateRangeKey;
  from: Date | null;
  to: Date | null;
  label: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseDateInput(s: string | undefined): Date | null {
  if (!s) return null;
  // Accept YYYY-MM-DD; treat as local midnight.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(d.getTime()) ? d : null;
}

export function isDateRangeKey(v: unknown): v is DateRangeKey {
  return typeof v === "string" && (DATE_RANGE_KEYS as readonly string[]).includes(v);
}

export function resolveDateRange(
  rawKey: unknown,
  rawFrom: unknown,
  rawTo: unknown,
  now: Date = new Date()
): ResolvedRange {
  const key: DateRangeKey = isDateRangeKey(rawKey) ? rawKey : "all";

  if (key === "all") {
    return { key, from: null, to: null, label: PRESET_LABELS.all };
  }

  if (key === "ytd") {
    const from = new Date(now.getFullYear(), 0, 1);
    return {
      key,
      from: startOfDay(from),
      to: endOfDay(now),
      label: PRESET_LABELS.ytd,
    };
  }

  if (key === "custom") {
    const from = parseDateInput(typeof rawFrom === "string" ? rawFrom : undefined);
    const to = parseDateInput(typeof rawTo === "string" ? rawTo : undefined);
    if (!from && !to) {
      return { key: "all", from: null, to: null, label: PRESET_LABELS.all };
    }
    return {
      key,
      from: from ? startOfDay(from) : null,
      to: to ? endOfDay(to) : null,
      label: formatCustomLabel(from, to),
    };
  }

  const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);
  return {
    key,
    from: startOfDay(from),
    to: endOfDay(now),
    label: PRESET_LABELS[key],
  };
}

function formatCustomLabel(from: Date | null, to: Date | null): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  if (to) return `Through ${fmt(to)}`;
  return PRESET_LABELS.custom;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
