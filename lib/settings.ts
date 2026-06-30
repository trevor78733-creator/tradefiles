import { db } from "./db";

export const SETTING_KEYS = [
  "strategy",
  "rules",
  "goals",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSetting(userId: string, key: SettingKey): Promise<string> {
  const row = await db.appSetting.findUnique({
    where: { userId_key: { userId, key } },
  });
  return row?.value ?? "";
}

export async function getSettings(userId: string): Promise<Record<SettingKey, string>> {
  const rows = await db.appSetting.findMany({
    where: { userId, key: { in: SETTING_KEYS as unknown as string[] } },
  });
  const out = Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as Record<
    SettingKey,
    string
  >;
  for (const r of rows) {
    if ((SETTING_KEYS as readonly string[]).includes(r.key)) {
      out[r.key as SettingKey] = r.value;
    }
  }
  return out;
}

/**
 * Parse a list-shaped setting (rules, checklist, goals) into trimmed non-empty
 * strings. Handles three storage formats:
 *  - JSON array of strings
 *  - JSON array of {text, completed} (goals)
 *  - Legacy plain text, one item per line
 */
export function parseList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x: unknown) => {
            if (typeof x === "string") return x;
            if (
              x &&
              typeof x === "object" &&
              typeof (x as { text: unknown }).text === "string"
            ) {
              return (x as { text: string }).text;
            }
            return null;
          })
          .filter((s): s is string => !!s && s.trim().length > 0);
      }
    } catch {
      // fall through to text parsing
    }
  }
  return trimmed
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
