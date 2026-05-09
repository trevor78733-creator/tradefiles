import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "profit" | "loss";
  children?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
            <div
              className={cn(
                "mt-1 text-2xl font-mono font-semibold tabular-nums tracking-tight",
                tone === "profit" && "text-profit",
                tone === "loss" && "text-loss"
              )}
            >
              {value}
            </div>
            {hint && (
              <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function WinLossSplitBar({
  win,
  loss,
}: {
  win: number;
  loss: number;
}) {
  const total = Math.abs(win) + Math.abs(loss);
  const winPct = total > 0 ? (Math.abs(win) / total) * 100 : 50;
  return (
    <div className="w-32 h-2 rounded-full overflow-hidden flex bg-muted">
      <div
        style={{
          width: `${winPct}%`,
          backgroundColor: "var(--chart-positive)",
        }}
      />
      <div
        style={{
          width: `${100 - winPct}%`,
          backgroundColor: "var(--chart-neutral)",
        }}
      />
    </div>
  );
}
