import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ensureDefaultAccount } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { resolveDateRange } from "@/lib/date-ranges";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";
import { AnalyticsContent } from "@/components/analytics/analytics-content";

export default async function AnalyticsComparePage(
  props: PageProps<"/analytics/compare">
) {
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const range = resolveDateRange(search.range, search.from, search.to);

  // Per-side account picks
  const aAccount =
    typeof search["a_account"] === "string" ? search["a_account"] : undefined;
  const bAccount =
    typeof search["b_account"] === "string" ? search["b_account"] : undefined;

  const [tradesA, tradesB, symbolRows, accounts] = await Promise.all([
    db.trade.findMany({
      where: {
        accountId: aAccount,
        closedAt: { gte: range.from ?? undefined, lte: range.to ?? undefined },
      },
      orderBy: { closedAt: "asc" },
    }),
    db.trade.findMany({
      where: {
        accountId: bAccount,
        closedAt: { gte: range.from ?? undefined, lte: range.to ?? undefined },
      },
      orderBy: { closedAt: "asc" },
    }),
    db.trade.findMany({
      distinct: ["symbol"],
      select: { symbol: true },
      orderBy: { symbol: "asc" },
    }),
    listAccounts(),
  ]);

  const symbols = symbolRows.map((s) => s.symbol);
  const accountList = accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/analytics" />}
            >
              <ArrowLeft className="size-3.5 mr-1.5" /> Back
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Same date range applies to both sides:</span>
            <DateRangePicker />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 min-w-0">
          <AnalyticsFilterBar
            symbols={symbols}
            accounts={accountList}
            prefix="a_"
            title="Set A"
          />
          <AnalyticsContent
            trades={tradesA.map((t) => ({
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
            prefix="a_"
            compact
          />
        </div>

        <div className="space-y-4 min-w-0">
          <AnalyticsFilterBar
            symbols={symbols}
            accounts={accountList}
            prefix="b_"
            title="Set B"
          />
          <AnalyticsContent
            trades={tradesB.map((t) => ({
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
            prefix="b_"
            compact
          />
        </div>
      </div>
    </div>
  );
}
