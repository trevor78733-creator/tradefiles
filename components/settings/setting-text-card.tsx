"use client";

import { useEffect, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { setSettingValue } from "@/actions/settings";
import type { SettingKey } from "@/lib/settings";

export function SettingTextCard({
  settingKey,
  title,
  description,
  placeholder,
  initialValue,
  rows = 8,
}: {
  settingKey: SettingKey;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [pending, startSave] = useTransition();

  useEffect(() => {
    setValue(initialValue);
    setSavedValue(initialValue);
  }, [initialValue]);

  const dirty = value !== savedValue;

  function save() {
    startSave(async () => {
      try {
        await setSettingValue(settingKey, value);
        setSavedValue(value);
        toast.success(`${title} saved`);
      } catch {
        toast.error(`Failed to save ${title.toLowerCase()}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-sans text-sm leading-6"
        />
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <span className="text-xs text-muted-foreground">
              Unsaved changes
            </span>
          )}
          <Button size="sm" onClick={save} disabled={!dirty || pending}>
            <Save className="size-3.5 mr-1.5" />
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
