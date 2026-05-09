"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Save, ListChecks } from "lucide-react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setSettingValue } from "@/actions/settings";
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
    .filter((s) => s.length > 0);
}

export function RulesScorecard({
  initialRulesText,
  initialChecked,
}: {
  initialRulesText: string;
  initialChecked: string[];
}) {
  const [rulesText, setRulesText] = useState(initialRulesText);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(initialChecked ?? [])
  );

  const rules = useMemo(() => parseList(rulesText), [rulesText]);

  // Compute completion stats
  const followed = useMemo(
    () => rules.filter((r) => checked.has(r)).length,
    [rules, checked]
  );

  function toggle(rule: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(rule);
      else next.delete(rule);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="size-4" />
              Rules followed
            </CardTitle>
            {rules.length > 0 && (
              <CardDescription>
                <span className="font-mono tabular-nums">
                  {followed}/{rules.length}
                </span>{" "}
                rules followed for this trade
              </CardDescription>
            )}
          </div>
          <EditRulesDialog value={rulesText} onSave={setRulesText} />
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            You haven&apos;t set up any trading rules yet. Click{" "}
            <span className="font-medium">Edit rules</span> above to add a list
            of rules, or set them up on the{" "}
            <Link
              href="/plan"
              className="text-primary hover:underline"
              target="_blank"
            >
              Trading Plan
            </Link>{" "}
            page. Each line becomes one rule.
          </div>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule, i) => {
              const id = `rule-${i}`;
              const isChecked = checked.has(rule);
              return (
                <li key={`${rule}-${i}`} className="flex items-start gap-2">
                  <Checkbox
                    id={id}
                    name="rulesFollowed"
                    value={rule}
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
        {/* When zero are checked we still need to submit at least one entry of the
            field name so the server action sees an array (even empty). The form
            uses formData.getAll which returns [] when no checkboxes have name. */}
      </CardContent>
    </Card>
  );
}

function EditRulesDialog({
  value,
  onSave,
}: {
  value: string;
  onSave: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startSave] = useTransition();

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function save() {
    startSave(async () => {
      try {
        await setSettingValue("rules", draft);
        onSave(draft);
        toast.success("Rules updated");
        setOpen(false);
      } catch {
        toast.error("Failed to save rules");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5 mr-1.5" /> Edit rules
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit your trading rules</DialogTitle>
          <DialogDescription>
            One rule per line. These also show up on your Trading Plan page.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          className="font-sans text-sm leading-6"
          autoFocus
        />
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancel
          </DialogClose>
          <Button type="button" onClick={save} disabled={pending}>
            <Save className="size-3.5 mr-1.5" />
            {pending ? "Saving…" : "Save rules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
