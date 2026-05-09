import type { BrokerAdapter, ParsedTradeRow, ParseResult, ParseRowError } from "./types";

const REQUIRED_COLS = [
  "symbol",
  "buyFillId",
  "sellFillId",
  "qty",
  "buyPrice",
  "sellPrice",
  "pnl",
  "boughtTimestamp",
  "soldTimestamp",
] as const;

export const tradovateAdapter: BrokerAdapter = {
  id: "tradovate",
  name: "Tradovate (Performance CSV)",
  parse(csv) {
    return parseTradovate(csv);
  },
};

function parseTradovate(csv: string): ParseResult {
  const rows: ParsedTradeRow[] = [];
  const errors: ParseRowError[] = [];

  const lines = splitLines(csv);
  if (lines.length === 0) {
    return { rows, errors: [{ line: 0, message: "Empty file" }] };
  }

  const header = parseCsvLine(lines[0]);
  const idx: Record<string, number> = {};
  header.forEach((h, i) => (idx[h.trim()] = i));

  for (const col of REQUIRED_COLS) {
    if (!(col in idx)) {
      return {
        rows,
        errors: [{ line: 1, message: `Missing required column: ${col}` }],
      };
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    const lineNum = i + 1;
    const cells = parseCsvLine(raw);
    try {
      const symbol = cells[idx.symbol]?.trim();
      const buyFillId = cells[idx.buyFillId]?.trim();
      const sellFillId = cells[idx.sellFillId]?.trim();
      const qty = Number(cells[idx.qty]);
      const buyPrice = Number(cells[idx.buyPrice]);
      const sellPrice = Number(cells[idx.sellPrice]);
      const pnl = parsePnl(cells[idx.pnl]);
      const boughtAt = parseTradovateTimestamp(cells[idx.boughtTimestamp]);
      const soldAt = parseTradovateTimestamp(cells[idx.soldTimestamp]);

      if (!symbol) throw new Error("Missing symbol");
      if (!buyFillId || !sellFillId) throw new Error("Missing fill ID");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid qty");
      if (!Number.isFinite(buyPrice)) throw new Error("Invalid buyPrice");
      if (!Number.isFinite(sellPrice)) throw new Error("Invalid sellPrice");
      if (!Number.isFinite(pnl)) throw new Error("Invalid pnl");
      if (!boughtAt) throw new Error("Invalid boughtTimestamp");
      if (!soldAt) throw new Error("Invalid soldTimestamp");

      // Direction: which fill came first
      const isLong = boughtAt.getTime() <= soldAt.getTime();
      const direction = isLong ? "LONG" : "SHORT";
      const openedAt = isLong ? boughtAt : soldAt;
      const closedAt = isLong ? soldAt : boughtAt;
      const entryPrice = isLong ? buyPrice : sellPrice;
      const exitPrice = isLong ? sellPrice : buyPrice;

      const result =
        pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN";

      rows.push({
        symbol,
        direction,
        contracts: qty,
        entryPrice,
        exitPrice,
        pnl,
        result,
        openedAt,
        closedAt,
        dedupKey: `tradovate:${buyFillId}:${sellFillId}`,
      });
    } catch (e) {
      errors.push({
        line: lineNum,
        message: e instanceof Error ? e.message : "Parse error",
        raw,
      });
    }
  }

  return { rows, errors };
}

function splitLines(s: string): string[] {
  // Strip BOM, normalize line endings
  return s.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

// Tradovate writes pnl as $332.50 or $(22.50) for negatives.
function parsePnl(raw: string | undefined): number {
  if (!raw) return NaN;
  const s = raw.trim();
  const negative = s.startsWith("(") || s.startsWith("$(");
  const stripped = s.replace(/[$(),\s]/g, "");
  const n = Number(stripped);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

// Tradovate timestamp: "MM/DD/YYYY HH:MM:SS" (24h). Parsed as the server's
// local time so it lines up with how datetime-local form values are stored
// for manually entered trades.
function parseTradovateTimestamp(raw: string | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
  );
  if (!m) return null;
  const [, mo, d, y, h, mi, sec] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(sec)
  );
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
