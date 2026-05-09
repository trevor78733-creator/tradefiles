"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateTradeRulesFollowed } from "@/actions/trades";
import { cn } from "@/lib/utils";

function parseList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x: unknown) => {
            if (typeof x === "string") return x;
            if (
              x &&
              typeof x === "object" &&
              typeof (x as { text: unknown }).text === "string"
            ) {
              return (x as { text: string }).text;
            }
            return null;
          })
          .filter((s): s is string => !!s && s.trim().length > 0);
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function NoteRulesCard({
  tradeId,
  rulesText,
  initialChecked,
}: {
  tradeId: string;
  rulesText: string;
  initialChecked: string[];
}) {
  const rules = useMemo(() => parseList(rulesText), [rulesText]);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(initialChecked ?? [])
  );
  const [, startSave] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const followed = useMemo(
    () => rules.filter((r) => checked.has(r)).length,
    [rules, checked]
  );

  function commit(next: Set<string>) {
    setChecked(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startSave(async () => {
        try {
          await updateTradeRulesFollowed(tradeId, Array.from(next));
        } catch {
          toast.error("Failed to save rules followed");
        }
      });
    }, 300);
  }

  function toggle(rule: string, on: boolean) {
    const next = new Set(checked);
    if (on) next.add(rule);
    else next.delete(rule);
    commit(next);
  }

  // Show stale entries (rules that were checked at log time but no longer in the
  // master list) as disabled so the user knows they exist.
  const stale = Array.from(checked).filter((r) => !rules.includes(r));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="size-4" />
          Rules followed
        </CardTitle>
        {rules.length > 0 ? (
          <CardDescription>
            <span className="font-mono tabular-nums">
              {followed}/{rules.length}
            </span>{" "}
            rules followed for this trade
          </CardDescription>
        ) : (
          <CardDescription>
            Set up rules on the{" "}
            <Link
              href="/plan"
              className="text-primary hover:underline"
              target="_blank"
            >
              Trading Plan
            </Link>{" "}
            page to start tracking discipline per trade.
          </CardDescription>
        )}
      </CardHeader>
      {(rules.length > 0 || stale.length > 0) && (
        <CardContent className="space-y-3">
          {rules.length > 0 && (
            <ul className="space-y-2">
              {rules.map((rule, i) => {
                const id = `note-rule-${tradeId}-${i}`;
                const isChecked = checked.has(rule);
                return (
                  <li key={`${rule}-${i}`} className="flex items-start gap-2">
                    <Checkbox
                      id={id}
                      checked={isChecked}
                      onCheckedChange={(v) => toggle(rule, v === true)}
                    />
                    <Label
                      htmlFor={id}
                      className={cn(
                        "text-sm leading-tight cursor-pointer select-none",
                        isChecked && "line-through text-muted-foreground"
                      )}
                    >
                      {rule}
                    </Label>
                  </li>
                );
              })}
            </ul>
          )}
          {stale.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Past rules no longer in your list
              </div>
              <ul className="space-y-1">
                {stale.map((rule) => (
                  <li
                    key={rule}
                    className="text-xs text-muted-foreground line-through"
                  >
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
