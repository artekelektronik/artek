"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { requirePermission } from "@/lib/guard";
import { processOutbox, setRecipientRoles } from "@/lib/outbox";

export async function setRecipientRolesAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => setRecipientRoles(await headers(), formData.getAll("roles").map(String)));
  revalidatePath("/bildirimler");
  return state;
}

// Sends what is due now, e.g. after fixing the Resend settings, instead of waiting for the next run.
export async function processOutboxAction(): Promise<ActionState> {
  const state = await runAction(async () => {
    await requirePermission(await headers(), "notifications.manage");
    await processOutbox();
  });
  revalidatePath("/bildirimler");
  return state;
}
