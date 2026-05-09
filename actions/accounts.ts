"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { accountFormSchema } from "@/lib/validators";

const MAX_ACCOUNTS = 10;

export type AccountActionState = {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

export async function createAccount(
  _prev: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const parsed = accountFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, fieldErrors };
  }

  const count = await db.account.count();
  if (count >= MAX_ACCOUNTS) {
    return { ok: false, formError: `You can have at most ${MAX_ACCOUNTS} accounts.` };
  }

  const acct = await db.account.create({
    data: {
      name: parsed.data.name,
      broker: parsed.data.broker ?? null,
    },
  });

  revalidatePath("/");
  redirect(`/?account=${acct.id}`);
}

export async function renameAccount(id: string, name: string, broker?: string | null) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 60) throw new Error("Name is too long");
  await db.account.update({
    where: { id },
    data: {
      name: trimmed,
      broker: broker?.trim() ? broker.trim() : null,
    },
  });
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/notes");
}

export async function deleteAccount(id: string) {
  // Cascade configured on Trade.account → onDelete: Cascade.
  await db.account.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/notes");
}
