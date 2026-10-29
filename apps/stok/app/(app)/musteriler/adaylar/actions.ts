"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { archiveLead, restoreLead } from "@/lib/archive";
import { importLeadsFile, leadEvents, linkLeadToCustomer, updateLead } from "@/lib/leads";

export async function leadEventsAction(id: string) {
  return (await leadEvents(await headers(), id)).map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }));
}

export async function updateLeadAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () =>
    updateLead(await headers(), { id: text(formData, "id"), status: text(formData, "status") as "yeni", note: text(formData, "note") }),
  );
  revalidatePath("/musteriler/adaylar");
  return state;
}

export async function linkLeadAction(leadId: string, customerId: string): Promise<ActionState> {
  const state = await runAction(async () => linkLeadToCustomer(await headers(), leadId, customerId));
  revalidatePath("/musteriler/adaylar");
  return state;
}

export async function importLeadsAction(records: unknown): Promise<ActionState & { added?: number; seen?: number; customers?: number }> {
  let result = { added: 0, seen: 0, customers: 0, skipped: 0 };
  const state = await runAction(async () => {
    result = await importLeadsFile(await headers(), records);
  });
  revalidatePath("/musteriler/adaylar");
  return state.saved ? { ...state, ...result } : state;
}

export async function archiveLeadAction(id: string, reason: string): Promise<ActionState> {
  const state = await runAction(async () => archiveLead(await headers(), { id, reason }));
  revalidatePath("/musteriler/adaylar");
  return state;
}

export async function restoreLeadAction(id: string): Promise<ActionState> {
  const state = await runAction(async () => restoreLead(await headers(), id));
  revalidatePath("/musteriler/adaylar");
  return state;
}
