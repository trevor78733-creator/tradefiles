import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TradeDirection, TradeResult } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SYMBOLS = ["NQ", "ES", "MES", "MNQ"] as const;

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function isWeekday(d: Date) {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

async function main() {
  const user = await db.user.upsert({
    where: { googleId: "seed-demo" },
    update: {},
    create: {
      id: "seed-demo-user",
      googleId: "seed-demo",
      email: "demo@example.com",
      name: "Demo User",
    },
  });

  const account = await db.account.upsert({
    where: { id: "seed-default" },
    update: {},
    create: {
      id: "seed-default",
      userId: user.id,
      name: "Demo Account",
      broker: "TopstepX",
      isDefault: true,
    },
  });

  await db.trade.deleteMany({ where: { accountId: account.id } });

  const trades: Parameters<typeof db.trade.create>[0]["data"][] = [];

  // 60 days of synthetic trades
  for (let i = 60; i >= 0; i--) {
    const day = new Date();
    day.setHours(9, 30, 0, 0);
    day.setDate(day.getDate() - i);
    if (!isWeekday(day)) continue;
    const tradesToday = Math.floor(rand(0, 6));
    for (let j = 0; j < tradesToday; j++) {
      const direction = Math.random() > 0.45 ? TradeDirection.LONG : TradeDirection.SHORT;
      const winRoll = Math.random();
      const result =
        winRoll > 0.42 ? TradeResult.WIN : winRoll > 0.07 ? TradeResult.LOSS : TradeResult.BREAKEVEN;
      const symbol = randomChoice(SYMBOLS);
      const contracts = Math.ceil(rand(1, 4));
      const tickValue = symbol.startsWith("M") ? 0.5 : 5;
      const entryPrice = +rand(15000, 20000).toFixed(2);
      const moveTicks =
        result === TradeResult.WIN
          ? rand(2, 25)
          : result === TradeResult.LOSS
          ? -rand(2, 18)
          : rand(-1, 1);
      const exitPrice = +(entryPrice + moveTicks).toFixed(2);
      const pnl = +(moveTicks * tickValue * contracts * (direction === TradeDirection.LONG ? 1 : -1) * (Math.sign(moveTicks) || 0) * (Math.abs(moveTicks))).toFixed(2);
      // simpler P&L: ticks * tick value * contracts, sign by win/loss
      const simplePnl =
        result === TradeResult.WIN
          ? +(rand(50, 700) * contracts).toFixed(2)
          : result === TradeResult.LOSS
          ? -+(rand(40, 500) * contracts).toFixed(2)
          : +(rand(-15, 15) * contracts).toFixed(2);
      const opened = new Date(day);
      opened.setHours(9, 30 + Math.floor(rand(0, 360)), Math.floor(rand(0, 60)), 0);
      const holdMin = Math.max(1, Math.floor(rand(1, 90)));
      const closed = new Date(opened);
      closed.setMinutes(closed.getMinutes() + holdMin);
      void pnl;
      trades.push({
        accountId: account.id,
        symbol,
        direction,
        contracts,
        entryPrice,
        exitPrice,
        stopPrice: null,
        targetPrice: null,
        pnl: simplePnl,
        result,
        openedAt: opened,
        closedAt: closed,
        notes: result === TradeResult.LOSS && Math.random() > 0.6 ? "Forced entry against trend." : null,
        screenshotUrl: null,
      });
    }
  }

  for (const t of trades) {
    await db.trade.create({ data: t });
  }

  console.log(`Seeded ${trades.length} trades on account "${account.name}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
