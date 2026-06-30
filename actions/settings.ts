"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings";
import { requireUserId } from "@/lib/auth-helpers";

export type SettingActionState = {
  ok: boolean;
  error?: string;
};

function isSettingKey(v: unknown): v is SettingKey {
  return typeof v === "string" && (SETTING_KEYS as readonly string[]).includes(v);
}

export async function updateSetting(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const userId = await requireUserId();
  const key = formData.get("key");
  const value = String(formData.get("value") ?? "");
  if (!isSettingKey(key)) {
    return { ok: false, error: "Invalid setting key" };
  }
  await db.appSetting.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, value },
    update: { value },
  });
  revalidatePath("/plan");
  // Trade form pulls the rules list, so re-render the trade entry views too.
  revalidatePath("/trades/new");
  return { ok: true };
}

/** Direct (non-form-action) update for inline editors that have their own state. */
export async function setSettingValue(key: SettingKey, value: string) {
  const userId = await requireUserId();
  await db.appSetting.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, value },
    update: { value },
  });
  revalidatePath("/plan");
  revalidatePath("/trades/new");
}
