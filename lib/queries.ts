import { db } from "./db";

export async function getOrCreateDefaultAccount(userId: string) {
  // Only auto-create when the user has zero accounts. If they deleted their
  // accounts intentionally, do nothing.
  const count = await db.account.count({ where: { userId } });
  if (count === 0) {
    return db.account.create({
      data: { name: "Default", isDefault: true, user: { connect: { id: userId } } },
    });
  }
  const def = await db.account.findFirst({ where: { userId, isDefault: true } });
  return (
    def ??
    (await db.account.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }))!
  );
}

export async function listAccounts(userId: string) {
  return db.account.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getAllTrades(userId: string, accountId?: string) {
  return db.trade.findMany({
    where: accountId
      ? { accountId, account: { userId } }
      : { account: { userId } },
    orderBy: { closedAt: "desc" },
  });
}
