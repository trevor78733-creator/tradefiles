const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const formatUsd = (n: number) => usd.format(n);
export const formatUsdCompact = (n: number) => usdCompact.format(n);
export const formatPercent = (n: number) => pct.format(n);
export const formatNumber = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
export const formatSigned = (n: number) =>
  (n > 0 ? "+" : "") + formatUsd(n);

export function formatTradeDuration(openedAt: Date, closedAt: Date) {
  const ms = closedAt.getTime() - openedAt.getTime();
  if (ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remM = minutes % 60;
  if (hours < 24) return remM ? `${hours}h ${remM}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH ? `${days}d ${remH}h` : `${days}d`;
}
