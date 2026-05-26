"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  CONTRACTS_KEYS,
  DOW_KEYS,
  DOW_LABELS,
  DURATION_KEYS,
  DURATION_LABELS,
  RR_KEYS,
  RR_LABELS,
  SESSION_KEYS,
  SESSION_LABELS,
  parseAnalyticsFilters,
  activeFilterCount,
} from "@/lib/analytics-filters";

const KEEP_PARAMS = new Set(["account", "range", "from", "to"]);

export function AnalyticsFilterBar({
  symbols,
  accounts,
  prefix = "",
  showAccount = true,
  title,
}: {
  symbols: string[];
  accounts: { id: string; name: string }[];
  prefix?: string;
  showAccount?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = parseAnalyticsFilters(params, prefix);
  const accountKey = `${prefix}account`;
  const accountId = showAccount ? params.get(accountKey) ?? "ALL" : "ALL";
  const totalActive =
    activeFilterCount(filters) + (showAccount && accountId !== "ALL" ? 1 : 0);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    const prefixed = prefix + key;
    if (!value || value === "ALL") next.delete(prefixed);
    else next.set(prefixed, value);
    pushNext(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    // Strip any prefixed analytics filter keys; preserve everything else
    const allFilterKeys = [
      "symbol",
      "side",
      "result",
      "session",
      "contracts",
      "duration",
      "rr",
      "dow",
    ];
    for (const k of allFilterKeys) next.delete(prefix + k);
    if (showAccount) next.delete(prefix + "account");
    pushNext(next);
  }

  function pushNext(next: URLSearchParams) {
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      {title && (
        <div className="text-sm font-semibold tracking-tight">{title}</div>
      )}
      <div className="flex items-end gap-3 flex-wrap">
        {showAccount && (
          <FilterField label="Account">
            <Select value={accountId} onValueChange={(v) => update("account", v)}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        )}

        <FilterField label="Symbol">
          <Select value={filters.symbol} onValueChange={(v) => update("symbol", v)}>
            <SelectTrigger className="w-32 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {symbols.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Side">
          <Select value={filters.side} onValueChange={(v) => update("side", v)}>
            <SelectTrigger className="w-28 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any</SelectItem>
              <SelectItem value="LONG">Long</SelectItem>
              <SelectItem value="SHORT">Short</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Result">
          <Select value={filters.result} onValueChange={(v) => update("result", v)}>
            <SelectTrigger className="w-28 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any</SelectItem>
              <SelectItem value="WIN">Win</SelectItem>
              <SelectItem value="LOSS">Loss</SelectItem>
              <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Session">
          <Select value={filters.session} onValueChange={(v) => update("session", v)}>
            <SelectTrigger className="w-44 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {SESSION_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <FilterField label="Contracts">
          <Select value={filters.contracts} onValueChange={(v) => update("contracts", v)}>
            <SelectTrigger className="w-28 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACTS_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k === "ALL" ? "Any" : k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Duration">
          <Select value={filters.duration} onValueChange={(v) => update("duration", v)}>
            <SelectTrigger className="w-36 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {DURATION_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Day of week">
          <Select value={filters.dow} onValueChange={(v) => update("dow", v)}>
            <SelectTrigger className="w-36 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOW_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {DOW_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="R:R">
          <Select value={filters.rr} onValueChange={(v) => update("rr", v)}>
            <SelectTrigger className="w-36 h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RR_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {RR_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        {totalActive > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="self-end h-8"
          >
            <X className="size-3.5 mr-1" />
            Clear ({totalActive})
          </Button>
        )}
      </div>
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
