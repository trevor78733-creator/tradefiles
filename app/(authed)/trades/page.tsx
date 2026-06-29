import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TradesTable } from "@/components/trades/trades-table";
import { TradesFilterBar } from "@/components/trades/trades-filter-bar";
import { db } from "@/lib/db";
import { ensureDefaultAccount } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { requireUserId } from "@/lib/auth-helpers";
import { computeStats } from "@/lib/stats";
import { formatPercent, formatSigned, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIDES = new Set(["LONG", "SHORT"]);
const RESULTS = new Set(["WIN", "LOSS", "BREAKEVEN"]);

function pickParam(value: unknown, allowed?: Set<string>): string | undefined {
  if (typeof value !== "string" || value === "ALL" || !value) return undefined;
  if (allowed && !allowed.has(value)) return undefined;
  return value;
}

export default async function TradesPage(props: PageProps<"/trades">) {
  const userId = await requireUserId();
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const symbolFilter = pickParam(search.symbol);
  const sideFilter = pickParam(search.side, SIDES) as "LONG" | "SHORT" | undefined;
  const resultFilter = pickParam(search.result, RESULTS) as
    | "WIN"
    | "LOSS"
    | "BREAKEVEN"
    | undefined;
  const accountFilter = pickParam(search.account);

  const [trades, symbolRows, accounts] = await Promise.all([
    db.trade.findMany({
      where: {
        account: { userId },
        symbol: symbolFilter,
        direction: sideFilter,
        result: resultFilter,
        accountId: accountFilter,
      },
      orderBy: { closedAt: "desc" },
    }),
    db.trade.findMany({
      where: { account: { userId } },
      distinct: ["symbol"],
      select: { symbol: true },
      orderBy: { symbol: "asc" },
    }),
    listAccounts(userId),
  ]);

  const stats = computeStats(trades);
  const symbols = symbolRows.map((s) => s.symbol);
  const filtered = !!(
    symbolFilter ||
    sideFilter ||
    resultFilter ||
    accountFilter
  );

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade Log</h1>
          <p className="text-sm text-muted-foreground">
            {stats.count} {filtered ? "filtered" : "trades"}
            {filtered && " trades"} · Net{" "}
            <span
              className={cn(
                "font-mono tabular-nums",
                stats.netPnl > 0 && "text-profit",
                stats.netPnl < 0 && "text-loss"
              )}
            >
              {formatSigned(stats.netPnl)}
            </span>{" "}
            · Win{" "}
            <span className="font-mono tabular-nums">
              {formatPercent(stats.winRate)}
            </span>{" "}
            · PF{" "}
            <span className="font-mono tabular-nums">
              {formatNumber(stats.profitFactor)}
            </span>
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/trades/new" />}>
          Log a trade
        </Button>
      </header>

      <TradesFilterBar
        symbols={symbols}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />

      <TradesTable
        rows={trades.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          direction: t.direction,
          contracts: t.contracts,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          pnl: t.pnl,
          result: t.result,
          openedAt: t.openedAt.toISOString(),
          closedAt: t.closedAt.toISOString(),
          notes: t.notes,
          screenshotUrl: t.screenshotUrl,
        }))}
      />
    </div>
  );
}
