"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tradeFormSchema } from "@/lib/validators";
import { getOrCreateDefaultAccount } from "@/lib/queries";
import { storeScreenshot } from "@/lib/storage";

export type TradeActionState = {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

function parseTrade(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const rulesFollowed = formData.getAll("rulesFollowed").map(String);
  return tradeFormSchema.safeParse({ ...raw, rulesFollowed });
}

function flattenErrors(parsed: {
  error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
}) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function createTrade(
  _prev: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const parsed = parseTrade(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed) };
  }
  const data = parsed.data;
  await db.trade.create({
    data: {
      account: { connect: { id: data.accountId } },
      symbol: data.symbol,
      direction: data.direction,
      contracts: data.contracts,
      entryPrice: data.entryPrice ?? null,
      exitPrice: data.exitPrice ?? null,
      stopPrice: data.stopPrice ?? null,
      targetPrice: data.targetPrice ?? null,
      pnl: data.pnl,
      result: data.result,
      openedAt: new Date(data.openedAt),
      closedAt: new Date(data.closedAt),
      notes: data.notes ?? null,
      screenshotUrl: data.screenshotUrl ?? null,
      rulesFollowed: data.rulesFollowed ?? [],
    },
  });
  revalidatePath("/");
  revalidatePath("/trades");
  redirect("/trades");
}

export async function updateTrade(
  id: string,
  _prev: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const parsed = parseTrade(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed) };
  }
  const data = parsed.data;
  await db.trade.update({
    where: { id },
    data: {
      account: { connect: { id: data.accountId } },
      symbol: data.symbol,
      direction: data.direction,
      contracts: data.contracts,
      entryPrice: data.entryPrice ?? null,
      exitPrice: data.exitPrice ?? null,
      stopPrice: data.stopPrice ?? null,
      targetPrice: data.targetPrice ?? null,
      pnl: data.pnl,
      result: data.result,
      openedAt: new Date(data.openedAt),
      closedAt: new Date(data.closedAt),
      notes: data.notes ?? null,
      screenshotUrl: data.screenshotUrl ?? null,
      rulesFollowed: data.rulesFollowed ?? [],
    },
  });
  revalidatePath("/");
  revalidatePath("/trades");
  redirect("/trades");
}

export async function deleteTrade(id: string) {
  await db.trade.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/trades");
}

export async function ensureDefaultAccount() {
  return getOrCreateDefaultAccount();
}

export type NotesActionState = { ok: boolean; error?: string };

export async function updateTradeRulesFollowed(
  tradeId: string,
  rulesFollowed: string[]
) {
  await db.trade.update({
    where: { id: tradeId },
    data: { rulesFollowed },
  });
  revalidatePath("/notes");
  revalidatePath("/trades");
}

export async function updateTradeNotes(
  tradeId: string,
  _prev: NotesActionState,
  formData: FormData
): Promise<NotesActionState> {
  const notes = String(formData.get("notes") ?? "").trim();
  await db.trade.update({
    where: { id: tradeId },
    data: { notes: notes.length ? notes : null },
  });
  revalidatePath("/notes");
  revalidatePath("/trades");
  return { ok: true };
}

export type UploadActionState = { ok: boolean; url?: string; error?: string };

export async function uploadTradeScreenshot(
  tradeId: string,
  _prev: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected" };
  }
  const stored = await storeScreenshot(file, tradeId);
  if (!stored.ok) return stored;

  await db.trade.update({
    where: { id: tradeId },
    data: { screenshotUrl: stored.url },
  });
  revalidatePath("/notes");
  revalidatePath("/trades");
  return { ok: true, url: stored.url };
}

export type ImageUploadResult = { ok: boolean; url?: string; error?: string };

// Uploads a screenshot before a trade exists (e.g. on the new-trade form via
// drop/paste). The URL is stored on the form and attached when the trade is
// saved.
export async function uploadImage(formData: FormData): Promise<ImageUploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected" };
  }
  return storeScreenshot(file, "pasted");
}

export async function clearTradeScreenshot(tradeId: string) {
  await db.trade.update({
    where: { id: tradeId },
    data: { screenshotUrl: null },
  });
  revalidatePath("/notes");
  revalidatePath("/trades");
}
