"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tradeFormSchema } from "@/lib/validators";
import { getOrCreateDefaultAccount } from "@/lib/queries";
import { storeScreenshot } from "@/lib/storage";
import { requireUserId } from "@/lib/auth-helpers";

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

// Verify the account belongs to the user. Throws if not.
async function assertAccountOwner(userId: string, accountId: string) {
  const account = await db.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) throw new Error("Account not found");
}

// Verify the trade belongs to the user (via its account). Throws if not.
async function assertTradeOwner(userId: string, tradeId: string) {
  const trade = await db.trade.findFirst({
    where: { id: tradeId, account: { userId } },
    select: { id: true },
  });
  if (!trade) throw new Error("Trade not found");
}

export async function createTrade(
  _prev: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const userId = await requireUserId();
  const parsed = parseTrade(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed) };
  }
  const data = parsed.data;
  await assertAccountOwner(userId, data.accountId);
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
  const userId = await requireUserId();
  const parsed = parseTrade(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed) };
  }
  const data = parsed.data;
  await assertTradeOwner(userId, id);
  await assertAccountOwner(userId, data.accountId);
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
  const userId = await requireUserId();
  const result = await db.trade.deleteMany({
    where: { id, account: { userId } },
  });
  if (result.count === 0) throw new Error("Trade not found");
  revalidatePath("/");
  revalidatePath("/trades");
}

export async function ensureDefaultAccount() {
  const userId = await requireUserId();
  return getOrCreateDefaultAccount(userId);
}

export type NotesActionState = { ok: boolean; error?: string };

export async function updateTradeRulesFollowed(
  tradeId: string,
  rulesFollowed: string[]
) {
  const userId = await requireUserId();
  const result = await db.trade.updateMany({
    where: { id: tradeId, account: { userId } },
    data: { rulesFollowed },
  });
  if (result.count === 0) throw new Error("Trade not found");
  revalidatePath("/notes");
  revalidatePath("/trades");
}

export async function updateTradeNotes(
  tradeId: string,
  _prev: NotesActionState,
  formData: FormData
): Promise<NotesActionState> {
  const userId = await requireUserId();
  const notes = String(formData.get("notes") ?? "").trim();
  const result = await db.trade.updateMany({
    where: { id: tradeId, account: { userId } },
    data: { notes: notes.length ? notes : null },
  });
  if (result.count === 0) return { ok: false, error: "Trade not found" };
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
  const userId = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected" };
  }
  await assertTradeOwner(userId, tradeId);
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
  await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected" };
  }
  return storeScreenshot(file, "pasted");
}

export async function clearTradeScreenshot(tradeId: string) {
  const userId = await requireUserId();
  const result = await db.trade.updateMany({
    where: { id: tradeId, account: { userId } },
    data: { screenshotUrl: null },
  });
  if (result.count === 0) throw new Error("Trade not found");
  revalidatePath("/notes");
  revalidatePath("/trades");
}
