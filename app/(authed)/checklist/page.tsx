import { ListEditor } from "@/components/settings/list-editor";
import { GoalsChecklist } from "@/components/settings/goals-checklist";
import { getSettings } from "@/lib/settings";

export default async function ChecklistPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Checklist & Goals
        </h1>
        <p className="text-sm text-muted-foreground">
          Things to run through before the bell, and the goals you&apos;re
          working toward.
        </p>
      </header>

      <ListEditor
        settingKey="premarket_checklist"
        title="Pre-market checklist"
        description="One item per row — what you do every morning before logging your first trade."
        initialValue={settings.premarket_checklist}
        addLabel="Add checklist item"
      />

      <GoalsChecklist initialValue={settings.goals} />
    </div>
  );
}
