import { TradeForm } from "@/components/trades/trade-form";
import { createTrade, ensureDefaultAccount } from "@/actions/trades";
import { listAccounts } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { requireUserId } from "@/lib/auth-helpers";

export default async function NewTradePage(props: PageProps<"/trades/new">) {
  const userId = await requireUserId();
  await ensureDefaultAccount();
  const search = await props.searchParams;
  const accountFromUrl =
    typeof search.account === "string" ? search.account : undefined;
  const [accounts, rulesText] = await Promise.all([
    listAccounts(userId),
    getSetting(userId, "rules"),
  ]);
  const validAccountId =
    accountFromUrl && accounts.some((a) => a.id === accountFromUrl)
      ? accountFromUrl
      : undefined;
  return (
    <div className="max-w-3xl mx-auto">
      <TradeForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        action={createTrade}
        submitLabel="Save trade"
        title="Log a trade"
        initial={validAccountId ? { accountId: validAccountId } : undefined}
        rulesText={rulesText}
      />
    </div>
  );
}
