"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { archiveInvoice, restoreInvoice } from "@/lib/archive";

function done(state: ActionState) {
  revalidatePath("/faturalar");
  revalidatePath("/finans");
  revalidatePath("/musteriler");
  return state;
}

export async function archiveInvoiceAction(id: string, reason: string): Promise<ActionState> {
  return done(await runAction(async () => archiveInvoice(await headers(), { id, reason })));
}

export async function restoreInvoiceAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => restoreInvoice(await headers(), id)));
}
