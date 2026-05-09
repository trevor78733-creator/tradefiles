"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccount, type AccountActionState } from "@/actions/accounts";

const empty: AccountActionState = { ok: false };

export function NewAccountForm() {
  const [state, action, pending] = useActionState(createAccount, empty);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3">
      <div>
        <div className="text-sm font-semibold">New account</div>
        <div className="text-xs text-muted-foreground">
          Trades logged here roll up to "All Accounts" too.
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="acct-name">Name</Label>
        <Input
          id="acct-name"
          name="name"
          autoFocus
          required
          autoComplete="off"
        />
        {fe.name && (
          <p className="text-xs text-destructive">{fe.name.join(", ")}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="acct-broker">Broker (optional)</Label>
        <Input
          id="acct-broker"
          name="broker"
          autoComplete="off"
        />
        {fe.broker && (
          <p className="text-xs text-destructive">{fe.broker.join(", ")}</p>
        )}
      </div>
      {state.formError && (
        <p className="text-xs text-destructive">{state.formError}</p>
      )}
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        <Plus className="size-3.5 mr-1.5" />
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
