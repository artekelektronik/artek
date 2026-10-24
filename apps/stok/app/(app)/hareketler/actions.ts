"use server";

import { headers } from "next/headers";
import { runStockAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { reverseMovement } from "@/lib/ledger";

export async function reverseMovementAction(movementId: string, formData: FormData): Promise<ActionState> {
  return runStockAction(async () => {
    await reverseMovement(await headers(), movementId, {
      reason: text(formData, "reason"),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
}
