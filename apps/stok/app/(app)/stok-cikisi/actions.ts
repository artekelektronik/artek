"use server";

import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { productLinesFrom, text } from "@/lib/form-data";
import { recordStockOut, type StockOutInput } from "@/lib/stock-out";

export async function recordStockOutAction(formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    await recordStockOut(await headers(), {
      type: text(formData, "type") as StockOutInput["type"],
      lokasyonId: text(formData, "lokasyonId"),
      reason: text(formData, "reason"),
      reference: text(formData, "reference"),
      lines: productLinesFrom(formData),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
  return state ?? { saved: true };
}
