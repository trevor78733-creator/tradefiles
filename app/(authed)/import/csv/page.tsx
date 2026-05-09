import { CsvImportFlow } from "@/components/import/csv-import-flow";
import { listAccounts } from "@/lib/queries";
import { ensureDefaultAccount } from "@/actions/trades";
import { BROKER_ADAPTERS } from "@/lib/csv/registry";

export default async function CsvImportPage() {
  await ensureDefaultAccount();
  const accounts = await listAccounts();
  const brokers = BROKER_ADAPTERS.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Import trades</h1>
        <p className="text-sm text-muted-foreground">
          Upload a broker CSV. Duplicate trades (matched by broker fill IDs) are skipped automatically.
        </p>
      </header>

      <CsvImportFlow
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        brokers={brokers}
      />
    </div>
  );
}
