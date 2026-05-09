"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export type NoteListItem = {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  result: "WIN" | "LOSS" | "BREAKEVEN";
  pnl: number;
  closedAt: string;
  hasNotes: boolean;
  hasScreenshot: boolean;
};

export function NotesList({ items }: { items: NoteListItem[] }) {
  const params = useSearchParams();
  const selectedId = params.get("id");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter((i) => i.symbol.toLowerCase().includes(needle));
  }, [items, q]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by symbol…"
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            No matching notes.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((n) => {
              const active = n.id === selectedId;
              return (
                <li key={n.id}>
                  <Link
                    href={`/notes?id=${n.id}`}
                    scroll={false}
                    className={cn(
                      "block px-3 py-2.5 hover:bg-accent/40 transition-colors",
                      active && "bg-accent/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{n.symbol}</span>
                          <Badge
                            variant="outline"
                            className="h-4 text-[10px] px-1.5"
                            style={{
                              color:
                                n.direction === "LONG"
                                  ? "var(--chart-positive)"
                                  : "var(--chart-neutral)",
                              borderColor:
                                n.direction === "LONG"
                                  ? "color-mix(in oklch, var(--chart-positive) 40%, transparent)"
                                  : "color-mix(in oklch, var(--chart-neutral) 40%, transparent)",
                            }}
                          >
                            {n.direction === "LONG" ? "Long" : "Short"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatLocalDate(n.closedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "font-mono text-sm font-medium tabular-nums tracking-tight",
                            n.pnl > 0 && "text-profit",
                            n.pnl < 0 && "text-loss"
                          )}
                        >
                          {formatUsd(n.pnl)}
                        </div>
                        <div className="flex justify-end gap-1 mt-0.5">
                          {n.hasNotes && (
                            <span
                              className="size-1.5 rounded-full bg-primary"
                              title="Has notes"
                            />
                          )}
                          {n.hasScreenshot && (
                            <span
                              className="size-1.5 rounded-full bg-foreground/40"
                              title="Has screenshot"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatLocalDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
