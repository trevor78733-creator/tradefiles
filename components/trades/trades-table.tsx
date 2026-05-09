"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTrade } from "@/actions/trades";
import { formatUsd, formatTradeDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  contracts: number;
  entryPrice: number | null;
  exitPrice: number | null;
  pnl: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  openedAt: string;
  closedAt: string;
  notes: string | null;
  screenshotUrl: string | null;
};

export function TradesTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No trades match your filters.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Closed</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">Hold</TableHead>
            <TableHead></TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatLocalDate(r.closedAt)}
              </TableCell>
              <TableCell className="font-medium">{r.symbol}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    color:
                      r.direction === "LONG"
                        ? "var(--chart-positive)"
                        : "var(--chart-neutral)",
                    borderColor:
                      r.direction === "LONG"
                        ? "color-mix(in oklch, var(--chart-positive) 40%, transparent)"
                        : "color-mix(in oklch, var(--chart-neutral) 40%, transparent)",
                  }}
                >
                  {r.direction === "LONG" ? "Long" : "Short"}
                </Badge>
              </TableCell>
              <TableCell>
                <ResultBadge result={r.result} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {r.contracts}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {r.entryPrice ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {r.exitPrice ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums font-medium",
                  r.pnl > 0 && "text-profit",
                  r.pnl < 0 && "text-loss"
                )}
              >
                {formatUsd(r.pnl)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {formatTradeDuration(new Date(r.openedAt), new Date(r.closedAt))}
              </TableCell>
              <TableCell>
                {r.screenshotUrl ? (
                  <a
                    href={r.screenshotUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Shot <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </TableCell>
              <TableCell>
                <RowMenu id={r.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResultBadge({ result }: { result: Row["result"] }) {
  if (result === "WIN") {
    return (
      <Badge className="bg-profit/15 text-profit border-profit/30 hover:bg-profit/15">
        Win
      </Badge>
    );
  }
  if (result === "LOSS") {
    return (
      <Badge className="bg-loss/15 text-loss border-loss/30 hover:bg-loss/15">
        Loss
      </Badge>
    );
  }
  return <Badge variant="secondary">BE</Badge>;
}

function RowMenu({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" disabled={pending} />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/trades/${id}/edit`} />}>
          <Pencil className="size-4 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault();
            if (!confirm("Delete this trade? This cannot be undone.")) return;
            startTransition(async () => {
              try {
                await deleteTrade(id);
                toast.success("Trade deleted");
              } catch {
                toast.error("Failed to delete trade");
              }
            });
          }}
        >
          <Trash2 className="size-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatLocalDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
