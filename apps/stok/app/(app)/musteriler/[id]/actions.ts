"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { addCustomerNote, updateCustomer, type CustomerStatus } from "@/lib/crm";
import { text } from "@/lib/form-data";

export async function updateCustomerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = text(formData, "id");
  const state = await runAction(async () =>
    updateCustomer(await headers(), {
      id,
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      website: text(formData, "website"),
      about: text(formData, "about"),
      contactSource: text(formData, "contactSource"),
      status: text(formData, "status") as CustomerStatus,
      nextFollowUpOn: text(formData, "nextFollowUpOn"),
    }),
  );
  revalidatePath("/musteriler", "layout");
  return state;
}

export async function addNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const customerId = text(formData, "customerId");
  const state = await runAction(async () => addCustomerNote(await headers(), { customerId, body: text(formData, "body") }));
  revalidatePath(`/musteriler/${customerId}`);
  return state;
}
