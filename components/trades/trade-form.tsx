"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TradeActionState } from "@/actions/trades";
import { RulesScorecard } from "./rules-scorecard";
import { ScreenshotField } from "./screenshot-field";

type Account = { id: string; name: string };
type Initial = {
  accountId?: string;
  symbol?: string;
  direction?: "LONG" | "SHORT";
  contracts?: number;
  entryPrice?: number | null;
  exitPrice?: number | null;
  stopPrice?: number | null;
  targetPrice?: number | null;
  pnl?: number;
  result?: "WIN" | "LOSS" | "BREAKEVEN";
  openedAt?: string;
  closedAt?: string;
  notes?: string | null;
  screenshotUrl?: string | null;
  rulesFollowed?: string[];
};

const empty: TradeActionState = { ok: false };

export function TradeForm({
  accounts,
  initial,
  action,
  submitLabel = "Save trade",
  title,
  rulesText,
}: {
  accounts: Account[];
  initial?: Initial;
  action: (prev: TradeActionState, fd: FormData) => Promise<TradeActionState>;
  submitLabel?: string;
  title: string;
  rulesText: string;
}) {
  const [state, formAction, pending] = useActionState(action, empty);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>All fields are required unless noted.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account" error={fe.accountId}>
            <Select
              name="accountId"
              defaultValue={initial?.accountId ?? accounts[0]?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Symbol" error={fe.symbol}>
            <Input
              name="symbol"
              defaultValue={initial?.symbol ?? ""}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </Field>

          <Field label="Direction" error={fe.direction}>
            <Select name="direction" defaultValue={initial?.direction ?? "LONG"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LONG">Long</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Result" error={fe.result}>
            <Select name="result" defaultValue={initial?.result ?? "WIN"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WIN">Win</SelectItem>
                <SelectItem value="LOSS">Loss</SelectItem>
                <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Contracts / size" error={fe.contracts}>
            <Input
              name="contracts"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial?.contracts ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Net P&L ($)" error={fe.pnl}>
            <Input
              name="pnl"
              type="number"
              step="0.01"
              defaultValue={initial?.pnl ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Entry price (optional)" error={fe.entryPrice}>
            <Input
              name="entryPrice"
              type="number"
              step="0.0001"
              defaultValue={initial?.entryPrice ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Exit price (optional)" error={fe.exitPrice}>
            <Input
              name="exitPrice"
              type="number"
              step="0.0001"
              defaultValue={initial?.exitPrice ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Stop price (optional)" error={fe.stopPrice}>
            <Input
              name="stopPrice"
              type="number"
              step="0.0001"
              defaultValue={initial?.stopPrice ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Target price (optional)" error={fe.targetPrice}>
            <Input
              name="targetPrice"
              type="number"
              step="0.0001"
              defaultValue={initial?.targetPrice ?? ""}
              inputMode="decimal"
            />
          </Field>

          <Field label="Opened at" error={fe.openedAt}>
            <Input
              name="openedAt"
              type="datetime-local"
              defaultValue={initial?.openedAt ?? defaultDateTimeLocal()}
            />
          </Field>

          <Field label="Closed at" error={fe.closedAt}>
            <Input
              name="closedAt"
              type="datetime-local"
              defaultValue={initial?.closedAt ?? defaultDateTimeLocal()}
            />
          </Field>

          <Field label="Screenshot (optional)" error={fe.screenshotUrl} className="md:col-span-2">
            <ScreenshotField
              name="screenshotUrl"
              defaultValue={initial?.screenshotUrl ?? ""}
            />
          </Field>

          <Field label="Notes (optional)" error={fe.notes} className="md:col-span-2">
            <Textarea
              name="notes"
              rows={4}
              defaultValue={initial?.notes ?? ""}
            />
          </Field>
          </div>
        </CardContent>
      </Card>

      <RulesScorecard
        initialRulesText={rulesText}
        initialChecked={initial?.rulesFollowed ?? []}
      />

      {state.formError && (
        <p className="text-sm text-destructive">{state.formError}</p>
      )}

      <div className="flex items-center gap-3 justify-end">
        <Button nativeButton={false} render={<Link href="/trades" />} variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string[];
  className?: string;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label htmlFor={id}>{label}</Label>
      <div id={id}>{children}</div>
      {error?.length ? (
        <p className="text-xs text-destructive">{error.join(", ")}</p>
      ) : null}
    </div>
  );
}

function defaultDateTimeLocal() {
  // formatted as YYYY-MM-DDTHH:mm in local time
  const d = new Date();
  d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 16);
}
