"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { importContactsFile } from "@/lib/contact-import";
import { addCustomer, addCustomerNote, customerHistory, updateCustomer } from "@/lib/crm";
import { addLead } from "@/lib/leads";
import { applyNoteProposal, rejectNoteProposal } from "@/lib/customer-changes";
import { addLink, removeLink } from "@/lib/firm-links";
import { archiveCustomer, restoreCustomer } from "@/lib/archive";
import type { CustomerStatus, FollowUpChannel } from "@/lib/finance-calc";
import { text } from "@/lib/form-data";
import { setEmailOptOut } from "@/lib/suggestions";

export async function customerHistoryAction(id: string) {
  const { invoices, notes, changes, links } = await customerHistory(await headers(), id);
  return {
    invoices: invoices.map((i) => ({ ...i, netAmount: Number(i.netAmount) })),
    notes: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), proposalDecidedAt: n.proposalDecidedAt?.toISOString() ?? null })),
    changes: changes.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    links: links.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
  };
}

export async function updateCustomerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () =>
    updateCustomer(await headers(), {
      id: text(formData, "id"),
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      website: text(formData, "website"),
      about: text(formData, "about"),
      contactSource: text(formData, "contactSource"),
      status: text(formData, "status") as CustomerStatus,
      nextFollowUpOn: text(formData, "nextFollowUpOn"),
      followUpChannel: text(formData, "followUpChannel") as FollowUpChannel,
    }),
  );
  revalidatePath("/musteriler");
  return state;
}

export async function addNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => addCustomerNote(await headers(), { customerId: text(formData, "customerId"), body: text(formData, "body") }));
  revalidatePath("/musteriler");
  return state;
}

export async function setEmailOptOutAction(customerId: string, optOut: boolean): Promise<ActionState> {
  const state = await runAction(async () => setEmailOptOut(await headers(), customerId, optOut));
  revalidatePath("/musteriler");
  return state;
}

export async function importContactsAction(records: unknown): Promise<ActionState & { updated?: number; skipped?: number }> {
  let result = { updated: 0, skipped: 0 };
  const state = await runAction(async () => {
    result = await importContactsFile(await headers(), records);
  });
  revalidatePath("/musteriler");
  return state.saved ? { ...state, ...result } : state;
}

export async function applyNoteProposalAction(noteId: string): Promise<ActionState> {
  const state = await runAction(async () => applyNoteProposal(await headers(), noteId));
  revalidatePath("/musteriler");
  return state;
}

export async function rejectNoteProposalAction(noteId: string): Promise<ActionState> {
  const state = await runAction(async () => rejectNoteProposal(await headers(), noteId));
  revalidatePath("/musteriler");
  return state;
}

export async function addLinkAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () =>
    addLink(await headers(), {
      fromId: text(formData, "fromId"),
      toId: text(formData, "toId"),
      type: text(formData, "type") as "diger",
      note: text(formData, "note"),
    }),
  );
  revalidatePath("/musteriler");
  return state;
}

export async function removeLinkAction(id: string): Promise<ActionState> {
  const state = await runAction(async () => removeLink(await headers(), id));
  revalidatePath("/musteriler");
  return state;
}

export async function archiveCustomerAction(id: string, reason: string): Promise<ActionState> {
  const state = await runAction(async () => archiveCustomer(await headers(), { id, reason }));
  revalidatePath("/musteriler");
  revalidatePath("/musteriler/bugun");
  return state;
}

export async function restoreCustomerAction(id: string): Promise<ActionState> {
  const state = await runAction(async () => restoreCustomer(await headers(), id));
  revalidatePath("/musteriler");
  return state;
}

// "Yeni müşteri": with a VKN it becomes a Müşteri; "Aday olarak kaydet" sends the same fields to Adaylar.
export async function addCustomerAction(_previous: unknown, formData: FormData): Promise<ActionState & { id?: string; as?: "musteri" | "aday" }> {
  let id: string | undefined;
  const asLead = text(formData, "as") === "aday";
  const fields = { name: text(formData, "name"), city: text(formData, "city"), phone: text(formData, "phone"), email: text(formData, "email"), website: text(formData, "website") };
  const state = await runAction(async () => {
    id = asLead ? await addLead(await headers(), fields) : await addCustomer(await headers(), { ...fields, taxId: text(formData, "taxId") });
  });
  revalidatePath(asLead ? "/musteriler/adaylar" : "/musteriler");
  return { ...state, id, as: asLead ? "aday" : "musteri" };
}
