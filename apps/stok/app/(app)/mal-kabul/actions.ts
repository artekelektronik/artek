"use server";

import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { productLinesFrom, text } from "@/lib/form-data";
import { recordReceipt } from "@/lib/receipts";

export async function recordReceiptAction(formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    await recordReceipt(await headers(), {
      lokasyonId: text(formData, "lokasyonId"),
      supplier: text(formData, "supplier"),
      reference: text(formData, "reference"),
      lines: productLinesFrom(formData),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
  return state ?? { saved: true };
}
