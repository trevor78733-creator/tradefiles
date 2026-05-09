import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AfterLossStats } from "@/lib/stats";
import { formatPercent, formatSigned } from "@/lib/format";

export function AfterLossCard({ stats }: { stats: AfterLossStats }) {
  if (stats.followers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance after a loss</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trades have been taken right after a losing trade in this slice.
          </p>
        </CardContent>
      </Card>
    );
  }

  const winRateDelta = stats.followerWinRate - stats.baselineWinRate;
  const pnlDelta = stats.followerAvgPnl - stats.baselineAvgPnl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance after a loss</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <Cell
            label="Win rate after loss"
            value={formatPercent(stats.followerWinRate)}
            delta={
              winRateDelta === 0
                ? null
                : `${winRateDelta > 0 ? "+" : ""}${formatPercent(
                    winRateDelta
                  )} vs baseline`
            }
          />
          <Cell
            label="Avg P&L after loss"
            value={formatSigned(stats.followerAvgPnl)}
            delta={
              pnlDelta === 0
                ? null
                : `${pnlDelta > 0 ? "+" : ""}${formatSigned(pnlDelta)} vs baseline`
            }
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Based on {stats.followers}{" "}
          {stats.followers === 1 ? "trade" : "trades"} taken right after a
          losing trade. Baseline win rate{" "}
          <span className="font-mono tabular-nums">
            {formatPercent(stats.baselineWinRate)}
          </span>
          , baseline avg P&L{" "}
          <span className="font-mono tabular-nums">
            {formatSigned(stats.baselineAvgPnl)}
          </span>
          .
        </div>
      </CardContent>
    </Card>
  );
}

function Cell({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string | null;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      {delta && (
        <div className="text-xs text-muted-foreground mt-0.5">{delta}</div>
      )}
    </div>
  );
}
