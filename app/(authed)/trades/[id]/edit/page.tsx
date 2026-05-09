import { notFound } from "next/navigation";
import { TradeForm } from "@/components/trades/trade-form";
import { updateTrade } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { db } from "@/lib/db";
import type { TradeActionState } from "@/actions/trades";

export default async function EditTradePage(
  props: PageProps<"/trades/[id]/edit">
) {
  const { id } = await props.params;
  const [trade, accounts, rulesText] = await Promise.all([
    db.trade.findUnique({ where: { id } }),
    listAccounts(),
    getSetting("rules"),
  ]);
  if (!trade) notFound();

  const action = updateTrade.bind(null, id) as (
    prev: TradeActionState,
    fd: FormData
  ) => Promise<TradeActionState>;

  return (
    <div className="max-w-3xl mx-auto">
      <TradeForm
        title="Edit trade"
        submitLabel="Save changes"
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        action={action}
        rulesText={rulesText}
        initial={{
          accountId: trade.accountId,
          symbol: trade.symbol,
          direction: trade.direction,
          contracts: trade.contracts,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopPrice: trade.stopPrice,
          targetPrice: trade.targetPrice,
          pnl: trade.pnl,
          result: trade.result,
          openedAt: toLocalInputValue(trade.openedAt),
          closedAt: toLocalInputValue(trade.closedAt),
          notes: trade.notes,
          screenshotUrl: trade.screenshotUrl,
          rulesFollowed: trade.rulesFollowed,
        }}
      />
    </div>
  );
}

function toLocalInputValue(d: Date) {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 16);
}
