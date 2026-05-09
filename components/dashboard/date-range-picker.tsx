"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DATE_RANGE_KEYS,
  PRESET_LABELS,
  resolveDateRange,
  toDateInputValue,
  type DateRangeKey,
} from "@/lib/date-ranges";
import { cn } from "@/lib/utils";

const PRESET_KEYS: DateRangeKey[] = ["7d", "30d", "90d", "ytd", "all"];

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const resolved = resolveDateRange(
    params.get("range"),
    params.get("from"),
    params.get("to")
  );

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Seed custom inputs whenever the popover opens or url changes
  useEffect(() => {
    if (resolved.key === "custom") {
      setCustomFrom(resolved.from ? toDateInputValue(resolved.from) : "");
      setCustomTo(resolved.to ? toDateInputValue(resolved.to) : "");
    } else if (resolved.from && resolved.to) {
      setCustomFrom(toDateInputValue(resolved.from));
      setCustomTo(toDateInputValue(resolved.to));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  function applyPreset(key: DateRangeKey) {
    const next = new URLSearchParams(params.toString());
    if (key === "all") {
      next.delete("range");
    } else {
      next.set("range", key);
    }
    next.delete("from");
    next.delete("to");
    pushNext(next);
    setOpen(false);
  }

  function applyCustom() {
    if (!customFrom && !customTo) return;
    const next = new URLSearchParams(params.toString());
    next.set("range", "custom");
    if (customFrom) next.set("from", customFrom);
    else next.delete("from");
    if (customTo) next.set("to", customTo);
    else next.delete("to");
    pushNext(next);
    setOpen(false);
  }

  function pushNext(next: URLSearchParams) {
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          />
        }
      >
        <Calendar className="size-3.5" />
        <span>{resolved.label}</span>
        <ChevronDown className="size-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end" sideOffset={8}>
        <ul className="space-y-0.5">
          {PRESET_KEYS.map((k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => applyPreset(k)}
                className={cn(
                  "w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent/60 transition-colors",
                  resolved.key === k && "bg-accent/60"
                )}
              >
                <span>{PRESET_LABELS[k]}</span>
                {resolved.key === k && (
                  <Check className="size-3.5 text-primary" />
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border my-2" />
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground px-1">
            Custom range
          </div>
          <div className="grid grid-cols-2 gap-2 px-1">
            <div className="space-y-1">
              <Label htmlFor="range-from" className="text-xs">
                From
              </Label>
              <Input
                id="range-from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="range-to" className="text-xs">
                To
              </Label>
              <Input
                id="range-to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="px-1">
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={!customFrom && !customTo}
              onClick={applyCustom}
            >
              Apply custom
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Re-exported for callers that want to ensure the union is exhaustive
export { DATE_RANGE_KEYS };
