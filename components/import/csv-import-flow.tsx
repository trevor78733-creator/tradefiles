"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseCsvPreview,
  importTrades,
  type PreviewResult,
  type PreviewRow,
} from "@/actions/import";
import { formatUsd, formatTradeDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type Account = { id: string; name: string };
type Broker = { id: string; name: string };

const MAX_BYTES = 10 * 1024 * 1024;

export function CsvImportFlow({
  accounts,
  brokers,
}: {
  accounts: Account[];
  brokers: Broker[];
}) {
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [brokerId, setBrokerId] = useState<string>(brokers[0]?.id ?? "");
  const [filename, setFilename] = useState<string>("");
  const [csv, setCsv] = useState<string>("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [parsing, startParse] = useTransition();
  const [importing, startImport] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please upload a .csv file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large (max 10 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setFilename(file.name);
      setCsv(text);
      runPreview(text);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);
  }

  function runPreview(text: string) {
    if (!brokerId) {
      toast.error("Select a broker first");
      return;
    }
    startParse(async () => {
      const res = await parseCsvPreview(brokerId, text);
      setPreview(res);
      if (!res.ok) toast.error(res.error);
    });
  }

  function reset() {
    setFilename("");
    setCsv("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function confirm() {
    if (!preview || !preview.ok) return;
    if (preview.counts.new === 0) {
      toast.info("Nothing to import — all trades already exist");
      return;
    }
    startImport(async () => {
      const res = await importTrades(accountId, brokerId, csv);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Imported ${res.inserted} trade${res.inserted === 1 ? "" : "s"}` +
          (res.skipped > 0 ? ` · ${res.skipped} skipped` : "")
      );
      reset();
    });
  }

  const showPreview = preview !== null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
          <CardDescription>
            Choose the broker format and which account to import into.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Broker</Label>
            <Select
              value={brokerId}
              onValueChange={(v) => {
                if (v === null) return;
                setBrokerId(v);
                if (csv) runPreview(csv);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select
              value={accountId}
              onValueChange={(v) => v !== null && setAccountId(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!showPreview && (
        <Card>
          <CardContent className="pt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "w-full rounded-lg border border-dashed border-border bg-secondary/30 hover:bg-secondary/50 transition-colors px-4 py-12 flex flex-col items-center justify-center gap-3 text-center cursor-pointer",
                dragOver && "border-primary bg-primary/10",
                parsing && "opacity-60 cursor-wait"
              )}
            >
              {parsing ? (
                <Loader2 className="size-6 text-muted-foreground animate-spin" />
              ) : (
                <FileUp className="size-6 text-muted-foreground" />
              )}
              <div className="text-sm">
                <span className="font-medium">Drop or click to upload</span>
                <span className="text-muted-foreground"> a CSV file</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Tradovate Performance export · max 10 MB
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {showPreview && preview?.ok && (
        <PreviewPanel
          filename={filename}
          preview={preview}
          accountName={
            accounts.find((a) => a.id === accountId)?.name ?? "—"
          }
          onBack={reset}
          onConfirm={confirm}
          confirming={importing}
        />
      )}
    </div>
  );
}

function PreviewPanel({
  filename,
  preview,
  accountName,
  onBack,
  onConfirm,
  confirming,
}: {
  filename: string;
  preview: Extract<PreviewResult, { ok: true }>;
  accountName: string;
  onBack: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const { rows, errors, counts } = preview;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{filename}</CardTitle>
            <CardDescription>
              Importing into <span className="text-foreground">{accountName}</span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-3.5 mr-1" />
            Choose another file
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <Stat label="New" value={counts.new} tone="positive" />
            <Stat label="Duplicates" value={counts.duplicate} tone="muted" />
            <Stat label="Errors" value={counts.errors} tone={counts.errors > 0 ? "warn" : "muted"} />
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parse errors</CardTitle>
            <CardDescription>
              These rows will be skipped.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-xs font-mono">
            {errors.slice(0, 10).map((e, i) => (
              <div key={i} className="text-muted-foreground">
                <span className="text-loss">Line {e.line}:</span> {e.message}
              </div>
            ))}
            {errors.length > 10 && (
              <div className="text-muted-foreground">
                …and {errors.length - 10} more
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Hold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <PreviewTableRow key={i} row={r} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={confirming || counts.new === 0}
        >
          {confirming ? (
            <>
              <Loader2 className="size-3.5 mr-2 animate-spin" />
              Importing…
            </>
          ) : counts.new === 0 ? (
            "Nothing new to import"
          ) : (
            <>
              <Upload className="size-3.5 mr-2" />
              Import {counts.new} trade{counts.new === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PreviewTableRow({ row }: { row: PreviewRow }) {
  return (
    <TableRow className={cn(row.isDuplicate && "opacity-50")}>
      <TableCell>
        {row.isDuplicate ? (
          <Badge variant="secondary" className="text-[10px]">
            Duplicate
          </Badge>
        ) : (
          <Badge
            className="text-[10px]"
            style={{
              color: "var(--chart-positive)",
              borderColor: "color-mix(in oklch, var(--chart-positive) 40%, transparent)",
              background: "color-mix(in oklch, var(--chart-positive) 12%, transparent)",
            }}
          >
            New
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatLocalDate(row.closedAt)}
      </TableCell>
      <TableCell className="font-medium">{row.symbol}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          style={{
            color:
              row.direction === "LONG"
                ? "var(--chart-positive)"
                : "var(--chart-neutral)",
            borderColor:
              row.direction === "LONG"
                ? "color-mix(in oklch, var(--chart-positive) 40%, transparent)"
                : "color-mix(in oklch, var(--chart-neutral) 40%, transparent)",
          }}
        >
          {row.direction === "LONG" ? "Long" : "Short"}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {row.contracts}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {row.entryPrice ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {row.exitPrice ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-mono tabular-nums font-medium",
          row.pnl > 0 && "text-profit",
          row.pnl < 0 && "text-loss"
        )}
      >
        {formatUsd(row.pnl)}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
        {formatTradeDuration(new Date(row.openedAt), new Date(row.closedAt))}
      </TableCell>
    </TableRow>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "muted" | "warn";
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={cn(
          "font-mono tabular-nums text-lg font-semibold",
          tone === "positive" && "text-foreground",
          tone === "warn" && value > 0 && "text-loss"
        )}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function formatLocalDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
