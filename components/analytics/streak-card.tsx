import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StreakStats } from "@/lib/stats";

export function StreakCard({ stats }: { stats: StreakStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Streaks</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <Cell
          label="Current"
          value={stats.current.length}
          suffix={
            stats.current.type === "WIN"
              ? "wins"
              : stats.current.type === "LOSS"
              ? "losses"
              : undefined
          }
        />
        <Cell label="Longest win" value={stats.longestWin} suffix="wins" />
        <Cell label="Longest loss" value={stats.longestLoss} suffix="losses" />
      </CardContent>
    </Card>
  );
}

function Cell({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        {suffix && value > 0 && (
          <div className="text-xs text-muted-foreground">{suffix}</div>
        )}
      </div>
    </div>
  );
}
