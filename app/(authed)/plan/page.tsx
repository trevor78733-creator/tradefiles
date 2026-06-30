import { ListEditor } from "@/components/settings/list-editor";
import { GoalsChecklist } from "@/components/settings/goals-checklist";
import { getSettings } from "@/lib/settings";
import { requireUserId } from "@/lib/auth-helpers";

export default async function TradingPlanPage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Trading Plan & Goals
        </h1>
        <p className="text-sm text-muted-foreground">
          Your strategy, rules, and the goals you&apos;re working toward.
          The rules here also drive the rules-followed checklist on the
          trade entry form.
        </p>
      </header>

      <ListEditor
        settingKey="strategy"
        title="Strategy"
        description="One point per item — what you trade, why, and when you skip."
        initialValue={settings.strategy}
        addLabel="Add strategy point"
      />

      <ListEditor
        settingKey="rules"
        title="Rules"
        description="One rule per item. Each one becomes a checkbox on the trade form."
        initialValue={settings.rules}
        addLabel="Add rule"
      />

      <GoalsChecklist initialValue={settings.goals} />
    </div>
  );
}
