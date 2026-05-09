"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NewAccountForm } from "./new-account-form";
import { renameAccount, deleteAccount } from "@/actions/accounts";
import { cn } from "@/lib/utils";

const MAX_ACCOUNTS = 10;

type Account = { id: string; name: string; broker: string | null };

export function AccountTabs({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get("account");
  const atCap = accounts.length >= MAX_ACCOUNTS;

  const [renaming, setRenaming] = useState<Account | null>(null);
  const [, startMutation] = useTransition();

  function handleDelete(account: Account) {
    if (
      !confirm(
        `Delete "${account.name}" and all its trades? This cannot be undone.`
      )
    )
      return;
    startMutation(async () => {
      try {
        await deleteAccount(account.id);
        toast.success(`Deleted "${account.name}"`);
        if (selected === account.id) {
          router.push("/");
        }
      } catch {
        toast.error("Failed to delete account");
      }
    });
  }

  return (
    <>
      <div className="flex items-end gap-1 border-b border-border overflow-x-auto -mx-1 px-1">
        <TabLink href="/" label="All Accounts" active={!selected} />
        {accounts.map((a) => (
          <ContextMenu key={a.id}>
            <ContextMenuTrigger
              render={
                <Link
                  href={`/?account=${a.id}`}
                  scroll={false}
                  className={cn(
                    "px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                    selected === a.id
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                />
              }
            >
              {a.name}
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => setRenaming(a)}>
                <Pencil className="size-3.5 mr-2" /> Rename
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onClick={() => handleDelete(a)}
              >
                <Trash2 className="size-3.5 mr-2" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        {atCap ? (
          <span
            className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/50 mb-1.5 ml-0.5 cursor-not-allowed"
            title={`Max of ${MAX_ACCOUNTS} accounts reached`}
            aria-label={`Max of ${MAX_ACCOUNTS} accounts reached`}
          >
            <Plus className="size-4" />
          </span>
        ) : (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label="New account"
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors mb-1.5 ml-0.5"
                />
              }
            >
              <Plus className="size-4" />
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start" sideOffset={8}>
              <NewAccountForm />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <RenameDialog
        account={renaming}
        onClose={() => setRenaming(null)}
      />
    </>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
        active
          ? "border-primary text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function RenameDialog({
  account,
  onClose,
}: {
  account: Account | null;
  onClose: () => void;
}) {
  const [pending, startMutation] = useTransition();
  const [name, setName] = useState("");
  const [broker, setBroker] = useState("");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBroker(account.broker ?? "");
    }
  }, [account]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    startMutation(async () => {
      try {
        await renameAccount(account.id, trimmed, broker);
        toast.success("Account updated");
        setName("");
        setBroker("");
        onClose();
      } catch {
        toast.error("Failed to rename account");
      }
    });
  }

  return (
    <Dialog
      open={!!account}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setBroker("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
          <DialogDescription>
            Update the name or broker for this account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rename-name">Name</Label>
            <Input
              id="rename-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rename-broker">Broker (optional)</Label>
            <Input
              id="rename-broker"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              maxLength={60}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
