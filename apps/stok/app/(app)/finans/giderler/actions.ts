"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { createExpense, deleteExpense, updateExpense, type ExpenseInput } from "@/lib/expenses";

function done<T extends ActionState>(state: T) {
  revalidatePath("/finans/giderler");
  revalidatePath("/finans");
  return state;
}

export async function saveExpenseAction(id: string | null, input: ExpenseInput): Promise<ActionState & { id?: string }> {
  let saved = id ?? undefined;
  const state = await runAction(async () => {
    if (id) await updateExpense(await headers(), id, input);
    else saved = (await createExpense(await headers(), input)).id;
  });
  return done({ ...state, id: saved });
}

export async function deleteExpenseAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => deleteExpense(await headers(), id)));
}
