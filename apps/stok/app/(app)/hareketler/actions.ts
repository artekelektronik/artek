"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { reverseMovement } from "@/lib/ledger";

export async function reverseMovementAction(movementId: string, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    await reverseMovement(await headers(), movementId, {
      reason: text(formData, "reason"),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
  if (!state) revalidatePath("/", "layout");
  return state ?? { saved: true };
}
