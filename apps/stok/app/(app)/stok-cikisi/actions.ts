"use server";

import { headers } from "next/headers";
import { runStockAction, type ActionState } from "@/lib/action-result";
import { productLinesFrom, text } from "@/lib/form-data";
import { recordStockOut, stockOutLineText, type StockOutInput } from "@/lib/stock-out";

export async function recordStockOutAction(formData: FormData): Promise<ActionState> {
  let message: string | undefined;
  const state = await runStockAction(async () => {
    const { lines } = await recordStockOut(await headers(), {
      type: text(formData, "type") as StockOutInput["type"],
      lokasyonId: text(formData, "lokasyonId"),
      reason: text(formData, "reason"),
      reference: text(formData, "reference"),
      lines: productLinesFrom(formData),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
    message = `Stok çıkışı kaydedildi.\n${lines.map(stockOutLineText).join("\n")}`;
  });
  return { ...state, message };
}
