"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { accountFormSchema } from "@/lib/validators";
import { requireUserId } from "@/lib/auth-helpers";

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
  const userId = await requireUserId();
  const parsed = accountFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, fieldErrors };
  }

  const count = await db.account.count({ where: { userId } });
  if (count >= MAX_ACCOUNTS) {
    return { ok: false, formError: `You can have at most ${MAX_ACCOUNTS} accounts.` };
  }

  const acct = await db.account.create({
    data: {
      name: parsed.data.name,
      broker: parsed.data.broker ?? null,
      user: { connect: { id: userId } },
    },
  });

  revalidatePath("/");
  redirect(`/?account=${acct.id}`);
}

export async function renameAccount(id: string, name: string, broker?: string | null) {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 60) throw new Error("Name is too long");
  const result = await db.account.updateMany({
    where: { id, userId },
    data: {
      name: trimmed,
      broker: broker?.trim() ? broker.trim() : null,
    },
  });
  if (result.count === 0) throw new Error("Account not found");
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/notes");
}

export async function deleteAccount(id: string) {
  const userId = await requireUserId();
  // Cascade configured on Trade.account → onDelete: Cascade.
  const result = await db.account.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Account not found");
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/notes");
}
