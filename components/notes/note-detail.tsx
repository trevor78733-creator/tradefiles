"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  updateTradeNotes,
  uploadTradeScreenshot,
  clearTradeScreenshot,
  type NotesActionState,
  type UploadActionState,
} from "@/actions/trades";
import { formatUsd, formatTradeDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NoteRulesCard } from "./note-rules-card";

export type NoteDetailTrade = {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  result: "WIN" | "LOSS" | "BREAKEVEN";
  contracts: number;
  entryPrice: number | null;
  exitPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  pnl: number;
  openedAt: string;
  closedAt: string;
  notes: string | null;
  screenshotUrl: string | null;
  rulesFollowed: string[];
};

const emptyNotes: NotesActionState = { ok: false };
const emptyUpload: UploadActionState = { ok: false };

export function NoteDetail({
  trade,
  rulesText,
}: {
  trade: NoteDetailTrade;
  rulesText: string;
}) {
  const updateAction = updateTradeNotes.bind(null, trade.id) as (
    prev: NotesActionState,
    fd: FormData
  ) => Promise<NotesActionState>;
  const uploadAction = uploadTradeScreenshot.bind(null, trade.id) as (
    prev: UploadActionState,
    fd: FormData
  ) => Promise<UploadActionState>;

  const [notesState, runUpdate, savingNotes] = useActionState(updateAction, emptyNotes);
  const [uploadState, runUpload, uploading] = useActionState(uploadAction, emptyUpload);
  const [pendingClear, startClear] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftNotes, setDraftNotes] = useState(trade.notes ?? "");
  const dirty = draftNotes !== (trade.notes ?? "");

  // Show toast on successful save
  if (notesState.ok && !savingNotes) {
    // toast handled below in form onSubmit pattern
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{trade.symbol}</h2>
            <Badge
              variant="outline"
              style={{
                color:
                  trade.direction === "LONG"
                    ? "var(--chart-positive)"
                    : "var(--chart-neutral)",
                borderColor:
                  trade.direction === "LONG"
                    ? "color-mix(in oklch, var(--chart-positive) 40%, transparent)"
                    : "color-mix(in oklch, var(--chart-neutral) 40%, transparent)",
              }}
            >
              {trade.direction === "LONG" ? "Long" : "Short"}
            </Badge>
            <ResultBadge result={trade.result} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatLocalDate(trade.closedAt)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums tracking-tight",
              trade.pnl > 0 && "text-profit",
              trade.pnl < 0 && "text-loss"
            )}
          >
            {formatUsd(trade.pnl)}
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/trades/${trade.id}/edit`} />}
          >
            <Pencil className="size-3.5 mr-1.5" /> Edit trade
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trade details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <Detail label="Contracts" value={trade.contracts} />
            <Detail
              label="Hold"
              value={formatTradeDuration(
                new Date(trade.openedAt),
                new Date(trade.closedAt)
              )}
            />
            <Detail label="Entry" value={trade.entryPrice ?? "—"} />
            <Detail label="Exit" value={trade.exitPrice ?? "—"} />
            <Detail label="Stop" value={trade.stopPrice ?? "—"} />
            <Detail label="Target" value={trade.targetPrice ?? "—"} />
            <Detail label="Opened" value={formatLocalTime(trade.openedAt)} />
            <Detail label="Closed" value={formatLocalTime(trade.closedAt)} />
          </dl>
        </CardContent>
      </Card>

      <NoteRulesCard
        tradeId={trade.id}
        rulesText={rulesText}
        initialChecked={trade.rulesFollowed}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Journal notes</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => {
              runUpdate(fd);
              toast.success("Notes saved");
            }}
            className="space-y-3"
          >
            <Textarea
              name="notes"
              rows={6}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              {dirty && (
                <span className="text-xs text-muted-foreground">
                  Unsaved changes
                </span>
              )}
              <Button type="submit" disabled={savingNotes || !dirty} size="sm">
                <Save className="size-3.5 mr-1.5" />
                {savingNotes ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span>Trade screenshot</span>
            {trade.screenshotUrl && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingClear}
                onClick={() => {
                  if (!confirm("Remove this screenshot?")) return;
                  startClear(async () => {
                    await clearTradeScreenshot(trade.id);
                    toast.success("Screenshot removed");
                  });
                }}
              >
                <Trash2 className="size-3.5 mr-1.5" /> Remove
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trade.screenshotUrl ? (
            <div className="space-y-3">
              <a
                href={trade.screenshotUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-md overflow-hidden border border-border bg-black/40"
              >
                <Image
                  src={trade.screenshotUrl}
                  alt={`${trade.symbol} screenshot`}
                  width={1200}
                  height={800}
                  unoptimized
                  className="w-full h-auto max-h-[480px] object-contain"
                />
              </a>
              <div className="text-xs text-muted-foreground break-all">
                {trade.screenshotUrl}
              </div>
            </div>
          ) : (
            <form
              action={(fd) => {
                runUpload(fd);
              }}
              className="space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground file:cursor-pointer hover:file:bg-secondary/80"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  PNG, JPEG, WebP, or GIF · max 10 MB
                </p>
                <Button type="submit" size="sm" disabled={uploading}>
                  <Upload className="size-3.5 mr-1.5" />
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </div>
              {uploadState.error && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <X className="size-3" /> {uploadState.error}
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

function ResultBadge({ result }: { result: NoteDetailTrade["result"] }) {
  if (result === "WIN")
    return (
      <Badge className="bg-profit/15 text-profit border-profit/30 hover:bg-profit/15">
        Win
      </Badge>
    );
  if (result === "LOSS")
    return (
      <Badge className="bg-loss/15 text-loss border-loss/30 hover:bg-loss/15">
        Loss
      </Badge>
    );
  return <Badge variant="secondary">BE</Badge>;
}

function formatLocalDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLocalTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
