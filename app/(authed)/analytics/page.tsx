import Link from "next/link";
import { Columns2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ensureDefaultAccount } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { resolveDateRange } from "@/lib/date-ranges";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";
import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { requireUserId } from "@/lib/auth-helpers";

export default async function AnalyticsPage(props: PageProps<"/analytics">) {
  const userId = await requireUserId();
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const accountId = typeof search.account === "string" ? search.account : undefined;
  const range = resolveDateRange(search.range, search.from, search.to);

  const [trades, symbolRows, accounts] = await Promise.all([
    db.trade.findMany({
      where: {
        account: { userId },
        accountId,
        closedAt: {
          gte: range.from ?? undefined,
          lte: range.to ?? undefined,
        },
      },
      orderBy: { closedAt: "asc" },
    }),
    db.trade.findMany({
      where: { account: { userId } },
      distinct: ["symbol"],
      select: { symbol: true },
      orderBy: { symbol: "asc" },
    }),
    listAccounts(userId),
  ]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>
              {trades.length} {trades.length === 1 ? "trade" : "trades"} in scope
            </span>
            <span aria-hidden>·</span>
            <DateRangePicker />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/analytics/compare" />}
        >
          <Columns2 className="size-3.5 mr-1.5" /> Compare A vs B
        </Button>
      </header>

      <AnalyticsFilterBar
        symbols={symbolRows.map((s) => s.symbol)}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />

      <AnalyticsContent
        trades={trades.map((t) => ({
          id: t.id,
          accountId: t.accountId,
          symbol: t.symbol,
          direction: t.direction,
          result: t.result,
          contracts: t.contracts,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          stopPrice: t.stopPrice,
          targetPrice: t.targetPrice,
          pnl: t.pnl,
          openedAt: t.openedAt.toISOString(),
          closedAt: t.closedAt.toISOString(),
        }))}
      />
    </div>
  );
}
