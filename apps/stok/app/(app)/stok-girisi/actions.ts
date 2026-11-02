"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, runStockAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { approveStockEntries, saveStockEntry } from "@/lib/stock-entry";

export async function saveStockEntryAction(input: { productId: string; lokasyonId: string; counted: string }): Promise<ActionState> {
  const state = await runAction(async () => saveStockEntry(await headers(), input));
  revalidatePath("/stok-girisi");
  return state;
}

export async function approveStockEntriesAction(lokasyonId: string, formData: FormData): Promise<ActionState> {
  return runStockAction(async () => {
    await approveStockEntries(await headers(), lokasyonId, { idempotencyKey: text(formData, "idempotencyKey") });
  });
}
