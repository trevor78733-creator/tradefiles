import { db } from "./db";

export async function getOrCreateDefaultAccount() {
  // Only auto-create when there are zero accounts. If the user deleted the
  // seed-default account but has others, do nothing.
  const count = await db.account.count();
  if (count === 0) {
    return db.account.create({
      data: { name: "Default", isDefault: true },
    });
  }
  const def = await db.account.findFirst({ where: { isDefault: true } });
  return def ?? (await db.account.findFirst({ orderBy: { createdAt: "asc" } }))!;
}

export async function listAccounts() {
  return db.account.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
}

export async function getAllTrades(accountId?: string) {
  return db.trade.findMany({
    where: accountId ? { accountId } : undefined,
    orderBy: { closedAt: "desc" },
  });
}
