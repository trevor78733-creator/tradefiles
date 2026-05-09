"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setSettingValue } from "@/actions/settings";
import { cn } from "@/lib/utils";

export type GoalItem = { id: string; text: string; completed: boolean };

/**
 * Parses the stored goals value. Supports two shapes for backward compat:
 *  - JSON array of { text, completed } (the new format)
 *  - Plain text with one goal per line (the legacy format)
 */
export function parseGoalsValue(raw: string): GoalItem[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (x: unknown): x is { text: string; completed?: boolean } =>
              !!x && typeof x === "object" && typeof (x as { text: unknown }).text === "string"
          )
          .map((x, i) => ({
            id: `g-${i}-${Math.random().toString(36).slice(2, 8)}`,
            text: x.text,
            completed: !!x.completed,
          }));
      }
    } catch {
      // fall through to text parsing
    }
  }
  return trimmed
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text, i) => ({
      id: `g-${i}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      completed: false,
    }));
}

function serialize(goals: GoalItem[]): string {
  return JSON.stringify(
    goals.map((g) => ({ text: g.text, completed: g.completed }))
  );
}

function newId() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsChecklist({ initialValue }: { initialValue: string }) {
  const [items, setItems] = useState<GoalItem[]>(() => parseGoalsValue(initialValue));
  const [, startSave] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialKeyRef = useRef(initialValue);

  // If parent reloads with a different stored value, re-seed
  useEffect(() => {
    if (initialValue !== initialKeyRef.current) {
      initialKeyRef.current = initialValue;
      setItems(parseGoalsValue(initialValue));
    }
  }, [initialValue]);

  const completedCount = useMemo(
    () => items.filter((i) => i.completed).length,
    [items]
  );

  function commit(next: GoalItem[]) {
    setItems(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startSave(async () => {
        try {
          await setSettingValue("goals", serialize(next));
        } catch {
          toast.error("Failed to save goals");
        }
      });
    }, 400);
  }

  function toggle(id: string, on: boolean) {
    commit(items.map((i) => (i.id === id ? { ...i, completed: on } : i)));
  }
  function updateText(id: string, text: string) {
    commit(items.map((i) => (i.id === id ? { ...i, text } : i)));
  }
  function remove(id: string) {
    commit(items.filter((i) => i.id !== id));
  }
  function add() {
    commit([...items, { id: newId(), text: "", completed: false }]);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Goals</CardTitle>
            {items.length > 0 && (
              <CardDescription>
                <span className="font-mono tabular-nums">
                  {completedCount}/{items.length}
                </span>{" "}
                completed
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 group">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(v) => toggle(item.id, v === true)}
                  aria-label="Mark goal complete"
                />
                <Input
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  className={cn(
                    "h-8 border-transparent bg-transparent shadow-none focus-visible:bg-secondary/40 focus-visible:border-input",
                    item.completed && "line-through text-muted-foreground"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete goal"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 mr-1.5" /> Add goal
        </Button>
      </CardContent>
    </Card>
  );
}
