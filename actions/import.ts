"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getBrokerAdapter } from "@/lib/csv/registry";
import type { ParseRowError } from "@/lib/csv/types";
import { requireUserId } from "@/lib/auth-helpers";

export type PreviewRow = {
  symbol: string;
  direction: "LONG" | "SHORT";
  contracts: number;
  entryPrice: number | null;
  exitPrice: number | null;
  pnl: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  openedAt: string;
  closedAt: string;
  dedupKey: string;
  isDuplicate: boolean;
};

export type PreviewResult =
  | {
      ok: true;
      brokerName: string;
      rows: PreviewRow[];
      errors: ParseRowError[];
      counts: { new: number; duplicate: number; errors: number };
    }
  | { ok: false; error: string };

export async function parseCsvPreview(
  brokerId: string,
  csv: string
): Promise<PreviewResult> {
  const userId = await requireUserId();
  const adapter = getBrokerAdapter(brokerId);
  if (!adapter) return { ok: false, error: "Unknown broker" };
  if (!csv || !csv.trim()) return { ok: false, error: "Empty CSV" };

  const { rows, errors } = adapter.parse(csv);

  // Only consider duplicates from this user's own trades — two users can each
  // import the same Tradovate file and both should see their rows as new.
  const dedupKeys = rows.map((r) => r.dedupKey);
  const existing = dedupKeys.length
    ? await db.trade.findMany({
        where: { dedupKey: { in: dedupKeys }, account: { userId } },
        select: { dedupKey: true },
      })
    : [];
  const existingSet = new Set(existing.map((e) => e.dedupKey).filter(Boolean) as string[]);

  const previewRows: PreviewRow[] = rows.map((r) => ({
    symbol: r.symbol,
    direction: r.direction,
    contracts: r.contracts,
    entryPrice: r.entryPrice,
    exitPrice: r.exitPrice,
    pnl: r.pnl,
    result: r.result,
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt.toISOString(),
    dedupKey: r.dedupKey,
    isDuplicate: existingSet.has(r.dedupKey),
  }));

  const newCount = previewRows.filter((r) => !r.isDuplicate).length;
  const dupCount = previewRows.length - newCount;

  return {
    ok: true,
    brokerName: adapter.name,
    rows: previewRows,
    errors,
    counts: { new: newCount, duplicate: dupCount, errors: errors.length },
  };
}

export type ImportResult =
  | { ok: true; inserted: number; skipped: number; errors: number }
  | { ok: false; error: string };

export async function importTrades(
  accountId: string,
  brokerId: string,
  csv: string
): Promise<ImportResult> {
  const userId = await requireUserId();
  const adapter = getBrokerAdapter(brokerId);
  if (!adapter) return { ok: false, error: "Unknown broker" };
  if (!accountId) return { ok: false, error: "Account is required" };
  if (!csv || !csv.trim()) return { ok: false, error: "Empty CSV" };

  const account = await db.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return { ok: false, error: "Account not found" };

  const { rows, errors } = adapter.parse(csv);
  if (rows.length === 0) {
    return { ok: false, error: "No valid trades found in CSV" };
  }

  // Filter out rows whose dedupKey already exists for this user, so createMany
  // doesn't partially fail on the unique constraint. dedupKey is globally
  // unique, but two users importing the same file should each get their rows
  // inserted — collisions across users shouldn't happen in practice (broker
  // fill IDs are per-account) but the per-user filter is the defensive read.
  const dedupKeys = rows.map((r) => r.dedupKey);
  const existing = await db.trade.findMany({
    where: { dedupKey: { in: dedupKeys }, account: { userId } },
    select: { dedupKey: true },
  });
  const existingSet = new Set(existing.map((e) => e.dedupKey).filter(Boolean) as string[]);
  const toInsert = rows.filter((r) => !existingSet.has(r.dedupKey));

  if (toInsert.length === 0) {
    return { ok: true, inserted: 0, skipped: rows.length, errors: errors.length };
  }

  const result = await db.trade.createMany({
    data: toInsert.map((r) => ({
      accountId,
      symbol: r.symbol,
      direction: r.direction,
      contracts: r.contracts,
      entryPrice: r.entryPrice,
      exitPrice: r.exitPrice,
      pnl: r.pnl,
      result: r.result,
      openedAt: r.openedAt,
      closedAt: r.closedAt,
      dedupKey: r.dedupKey,
      importSource: `${brokerId}_csv`,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/analytics");

  return {
    ok: true,
    inserted: result.count,
    skipped: rows.length - result.count,
    errors: errors.length,
  };
}
