import { NotebookPen } from "lucide-react";
import { db } from "@/lib/db";
import { ensureDefaultAccount } from "@/actions/trades";
import { getSetting } from "@/lib/settings";
import { NotesList, type NoteListItem } from "@/components/notes/notes-list";
import { NoteDetail } from "@/components/notes/note-detail";
import { requireUserId } from "@/lib/auth-helpers";

export default async function NotesPage(props: PageProps<"/notes">) {
  const userId = await requireUserId();
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const selectedId =
    typeof search.id === "string" ? search.id : undefined;

  const [trades, rulesText] = await Promise.all([
    db.trade.findMany({
      where: { account: { userId } },
      orderBy: { closedAt: "desc" },
    }),
    getSetting(userId, "rules"),
  ]);

  const items: NoteListItem[] = trades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    result: t.result,
    pnl: t.pnl,
    closedAt: t.closedAt.toISOString(),
    hasNotes: !!(t.notes && t.notes.length),
    hasScreenshot: !!t.screenshotUrl,
  }));

  const selected = selectedId
    ? trades.find((t) => t.id === selectedId)
    : trades[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 max-w-[1400px] mx-auto h-[calc(100vh-7rem)] min-h-[600px]">
      <aside className="border border-border rounded-lg bg-card overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Trade Notes</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
            <NotebookPen className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Log a trade to start journaling.
            </p>
          </div>
        ) : (
          <NotesList items={items} />
        )}
      </aside>

      <section className="border border-border rounded-lg bg-card overflow-hidden flex flex-col min-h-0">
        {selected ? (
          <div className="flex-1 overflow-y-auto p-5">
            <NoteDetail
              key={selected.id}
              rulesText={rulesText}
              trade={{
                id: selected.id,
                symbol: selected.symbol,
                direction: selected.direction,
                result: selected.result,
                contracts: selected.contracts,
                entryPrice: selected.entryPrice,
                exitPrice: selected.exitPrice,
                stopPrice: selected.stopPrice,
                targetPrice: selected.targetPrice,
                pnl: selected.pnl,
                openedAt: selected.openedAt.toISOString(),
                closedAt: selected.closedAt.toISOString(),
                notes: selected.notes,
                screenshotUrl: selected.screenshotUrl,
                rulesFollowed: selected.rulesFollowed,
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6 text-sm text-muted-foreground">
            Select a trade on the left to view its notes.
          </div>
        )}
      </section>
    </div>
  );
}
