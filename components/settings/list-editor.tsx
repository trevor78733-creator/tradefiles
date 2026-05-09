"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setSettingValue } from "@/actions/settings";
import type { SettingKey } from "@/lib/settings";

type Item = { id: string; text: string };

/**
 * Reads either:
 *  - JSON array of strings (the new format)
 *  - JSON array of {text, completed} (goals format) — text only is used
 *  - Plain text, one item per line (legacy format)
 */
export function parseListValue(raw: string): string[] {
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
          .filter((s): s is string => !!s);
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

function newId() {
  return `i-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function serialize(items: Item[]): string {
  return JSON.stringify(items.map((i) => i.text));
}

export function ListEditor({
  settingKey,
  title,
  description,
  initialValue,
  addLabel = "Add item",
  emptyText = "Nothing yet. Add one below.",
}: {
  settingKey: SettingKey;
  title: string;
  description?: string;
  initialValue: string;
  addLabel?: string;
  emptyText?: string;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    parseListValue(initialValue).map((text) => ({ id: newId(), text }))
  );
  const [, startSave] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialKeyRef = useRef(initialValue);

  useEffect(() => {
    if (initialValue !== initialKeyRef.current) {
      initialKeyRef.current = initialValue;
      setItems(parseListValue(initialValue).map((text) => ({ id: newId(), text })));
    }
  }, [initialValue]);

  function commit(next: Item[]) {
    setItems(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startSave(async () => {
        try {
          // Drop empty rows from the persisted value.
          const cleaned = next
            .map((i) => ({ ...i, text: i.text }))
            .filter((i) => i.text.trim().length > 0);
          await setSettingValue(settingKey, serialize(cleaned));
        } catch {
          toast.error(`Failed to save ${title.toLowerCase()}`);
        }
      });
    }, 400);
  }

  function updateText(id: string, text: string) {
    commit(items.map((i) => (i.id === id ? { ...i, text } : i)));
  }
  function remove(id: string) {
    commit(items.filter((i) => i.id !== id));
  }
  function add() {
    commit([...items, { id: newId(), text: "" }]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 group">
                <Input
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  className="h-9 border-transparent bg-transparent shadow-none focus-visible:bg-secondary/40 focus-visible:border-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${title.toLowerCase()} item`}
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
          <Plus className="size-3.5 mr-1.5" /> {addLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
