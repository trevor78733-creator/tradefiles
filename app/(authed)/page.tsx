import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, WinLossSplitBar } from "@/components/dashboard/kpi-card";
import {
  CumulativePnlChart,
  DailyPnlChart,
  MiniArea,
} from "@/components/dashboard/charts";
import { PnlCalendar } from "@/components/dashboard/pnl-calendar";
import { AccountTabs } from "@/components/dashboard/account-tabs";
import { DailyStats, type DailyStatsData } from "@/components/dashboard/daily-stats";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TradesTable } from "@/components/trades/trades-table";
import { db } from "@/lib/db";
import { ensureDefaultAccount } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { requireUserId } from "@/lib/auth-helpers";
import {
  buildCumulativePnl,
  buildDailyPnl,
  computeStats,
} from "@/lib/stats";
import { resolveDateRange } from "@/lib/date-ranges";
import {
  formatNumber,
  formatPercent,
  formatSigned,
  formatUsd,
} from "@/lib/format";

export default async function DashboardPage(props: PageProps<"/">) {
  const userId = await requireUserId();
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const selectedAccountId =
    typeof search.account === "string" ? search.account : undefined;

  const range = resolveDateRange(search.range, search.from, search.to);

  const accounts = await listAccounts(userId);
  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : undefined;

  const allTrades = await db.trade.findMany({
    where: selectedAccountId
      ? { accountId: selectedAccountId, account: { userId } }
      : { account: { userId } },
    orderBy: { closedAt: "asc" },
  });

  // Apply date range filter to KPIs/charts/recent. Calendar keeps everything.
  const trades = allTrades.filter((t) => {
    if (range.from && t.closedAt < range.from) return false;
    if (range.to && t.closedAt > range.to) return false;
    return true;
  });

  const newTradeHref = selectedAccountId
    ? `/trades/new?account=${selectedAccountId}`
    : "/trades/new";

  if (allTrades.length === 0) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <DashboardHeader
          title={selectedAccount ? selectedAccount.name : "Dashboard"}
          subtitle={
            selectedAccount
              ? selectedAccount.broker ?? "No trades yet on this account"
              : "0 trades · 0 trading days"
          }
          newTradeHref={newTradeHref}
          showRangePicker={false}
        />
        <AccountTabs
          accounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            broker: a.broker ?? null,
          }))}
        />
        <EmptyState newTradeHref={newTradeHref} />
      </div>
    );
  }

  const stats = computeStats(trades);
  const daily = buildDailyPnl(trades);
  const cumulative = buildCumulativePnl(daily);
  const totalTrades = allTrades.length;
  const dailyStats = computeTodayStats(allTrades);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <DashboardHeader
        title={selectedAccount ? selectedAccount.name : "Dashboard"}
        subtitle={
          <>
            {stats.count} {stats.count === 1 ? "trade" : "trades"}
            {range.key !== "all" && trades.length !== totalTrades && (
              <span className="text-muted-foreground"> of {totalTrades}</span>
            )}{" "}
            · {stats.dayCount} trading {stats.dayCount === 1 ? "day" : "days"}
            {selectedAccount?.broker && (
              <>
                {" "}· <span>{selectedAccount.broker}</span>
              </>
            )}
          </>
        }
        newTradeHref={newTradeHref}
        showRangePicker
        dailyStats={dailyStats}
      />
      <AccountTabs
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          broker: a.broker ?? null,
        }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Net P&L"
          value={formatSigned(stats.netPnl)}
          tone={stats.netPnl > 0 ? "profit" : stats.netPnl < 0 ? "loss" : "default"}
          hint={`${stats.count} trades`}
        >
          <MiniArea data={cumulative} />
        </KpiCard>
        <KpiCard
          label="Trade win %"
          value={formatPercent(stats.winRate)}
          hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE`}
        />
        <KpiCard
          label="Profit factor"
          value={formatNumber(stats.profitFactor)}
          hint="gross profit / gross loss"
        />
        <KpiCard
          label="Avg win / avg loss"
          value={formatNumber(stats.avgWinLoss)}
          hint={`avg win ${formatUsd(stats.avgWin)} · avg loss ${formatUsd(stats.avgLoss)}`}
        >
          <WinLossSplitBar win={stats.avgWin} loss={stats.avgLoss} />
        </KpiCard>
        <KpiCard
          label="Day win %"
          value={formatPercent(stats.dayWinRate)}
          hint={`${stats.winningDays} winning · ${stats.losingDays} losing`}
        />
        <KpiCard
          label="Avg trade length"
          value={formatHoldMinutes(stats.avgHoldMinutes)}
          hint={`Longs ${stats.longCount} · Shorts ${stats.shortCount}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net cumulative P&L</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CumulativePnlChart data={cumulative} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net daily P&L</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DailyPnlChart data={daily} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Long vs Short</CardTitle>
          </CardHeader>
          <CardContent>
            <DirectionSplit
              longCount={stats.longCount}
              shortCount={stats.shortCount}
              longWinRate={stats.longWinRate}
              shortWinRate={stats.shortWinRate}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best & worst</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ExtremeCell label="Largest win" value={stats.largestWin} />
            <ExtremeCell label="Largest loss" value={stats.largestLoss} />
            <ExtremeCell label="Best day" value={stats.bestDayPnl} />
            <ExtremeCell label="Worst day" value={stats.worstDayPnl} />
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <span className="text-xs text-muted-foreground">
            Calendar shows all months — date range filter does not apply
          </span>
        </div>
        <PnlCalendar
          trades={allTrades.map((t) => ({
            id: t.id,
            symbol: t.symbol,
            direction: t.direction,
            result: t.result,
            contracts: t.contracts,
            pnl: t.pnl,
            closedAt: t.closedAt.toISOString(),
          }))}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent trades</h2>
          <Link
            href="/trades"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <TradesTable
          rows={[...trades]
            .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime())
            .slice(0, 5)
            .map((t) => ({
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
    </div>
  );
}

function ExtremeCell({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-mono font-semibold tabular-nums tracking-tight">
        {formatUsd(value)}
      </div>
    </div>
  );
}

function DirectionSplit({
  longCount,
  shortCount,
  longWinRate,
  shortWinRate,
}: {
  longCount: number;
  shortCount: number;
  longWinRate: number;
  shortWinRate: number;
}) {
  const total = longCount + shortCount;
  const longPct = total > 0 ? (longCount / total) * 100 : 50;
  return (
    <div className="space-y-3">
      <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
        <div
          style={{
            width: `${longPct}%`,
            backgroundColor: "var(--chart-positive)",
          }}
        />
        <div
          style={{
            width: `${100 - longPct}%`,
            backgroundColor: "var(--chart-neutral)",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "var(--chart-positive)" }}
            />
            Longs
          </div>
          <div className="text-lg font-mono font-semibold tabular-nums tracking-tight">
            {longCount}{" "}
            <span className="text-sm text-muted-foreground font-normal font-sans">
              · {formatPercent(longWinRate)} win
            </span>
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "var(--chart-neutral)" }}
            />
            Shorts
          </div>
          <div className="text-lg font-mono font-semibold tabular-nums tracking-tight">
            {shortCount}{" "}
            <span className="text-sm text-muted-foreground font-normal font-sans">
              · {formatPercent(shortWinRate)} win
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHoldMinutes(minutes: number) {
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  const h = minutes / 60;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function DashboardHeader({
  title,
  subtitle,
  newTradeHref,
  showRangePicker,
  dailyStats,
}: {
  title: string;
  subtitle: React.ReactNode;
  newTradeHref: string;
  showRangePicker: boolean;
  dailyStats?: DailyStatsData;
}) {
  return (
    <header className="flex items-center justify-between gap-4 flex-wrap">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>{subtitle}</span>
          {showRangePicker && (
            <>
              <span aria-hidden>·</span>
              <DateRangePicker />
            </>
          )}
        </div>
      </div>
      {dailyStats && <DailyStats data={dailyStats} />}
      <Button nativeButton={false} render={<Link href={newTradeHref} />}>
        Log a trade
      </Button>
    </header>
  );
}

function computeTodayStats(
  trades: { closedAt: Date; pnl: number; result: "WIN" | "LOSS" | "BREAKEVEN" }[]
): DailyStatsData {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  let pnl = 0;
  let count = 0;
  let wins = 0;
  let losses = 0;
  for (const t of trades) {
    if (t.closedAt < start || t.closedAt > end) continue;
    pnl += t.pnl;
    count += 1;
    if (t.result === "WIN") wins += 1;
    else if (t.result === "LOSS") losses += 1;
  }
  return { pnl, trades: count, wins, losses };
}

function EmptyState({ newTradeHref }: { newTradeHref: string }) {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <h2 className="text-xl font-semibold">No trades yet</h2>
      <p className="text-muted-foreground">
        Log your first trade to start building your dashboard. Stats and charts
        will populate automatically as you add trades.
      </p>
      <Button nativeButton={false} render={<Link href={newTradeHref} />}>
        Log a trade
      </Button>
    </div>
  );
}
