"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "ALL";

export function TradesFilterBar({
  symbols,
  accounts,
}: {
  symbols: string[];
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const symbol = params.get("symbol") ?? ALL;
  const side = params.get("side") ?? ALL;
  const result = params.get("result") ?? ALL;
  const account = params.get("account") ?? ALL;

  const activeCount =
    (symbol !== ALL ? 1 : 0) +
    (side !== ALL ? 1 : 0) +
    (result !== ALL ? 1 : 0) +
    (account !== ALL ? 1 : 0);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(`/trades${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function clearAll() {
    router.push("/trades", { scroll: false });
  }

  return (
    <div className="flex items-end gap-3 flex-wrap rounded-lg border border-border bg-card p-3">
      <FilterField label="Account">
        <Select value={account} onValueChange={(v) => update("account", v)}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Symbol">
        <Select value={symbol} onValueChange={(v) => update("symbol", v)}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {symbols.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Side">
        <Select value={side} onValueChange={(v) => update("side", v)}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="LONG">Long</SelectItem>
            <SelectItem value="SHORT">Short</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Result">
        <Select value={result} onValueChange={(v) => update("result", v)}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="WIN">Win</SelectItem>
            <SelectItem value="LOSS">Loss</SelectItem>
            <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="self-end h-8"
        >
          <X className="size-3.5 mr-1" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
