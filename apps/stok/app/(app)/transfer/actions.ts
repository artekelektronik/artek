"use server";

import { headers } from "next/headers";
import { runStockAction, type ActionState } from "@/lib/action-result";
import { productLinesFrom, text } from "@/lib/form-data";
import { receiveTransfer, sendTransfer, type LossReason } from "@/lib/transfers";

export async function sendTransferAction(formData: FormData): Promise<ActionState> {
  return runStockAction(async () => {
    await sendTransfer(await headers(), {
      fromLokasyonId: text(formData, "fromLokasyonId"),
      toLokasyonId: text(formData, "toLokasyonId"),
      note: text(formData, "note"),
      lines: productLinesFrom(formData),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
}

export async function receiveTransferAction(transferId: string, formData: FormData): Promise<ActionState> {
  const productIds = formData.getAll("productId").map(String);
  return runStockAction(async () => {
    await receiveTransfer(await headers(), transferId, {
      lines: productIds.map((productId) => ({
        productId,
        received: text(formData, `received:${productId}`),
        lossReason: (text(formData, `lossReason:${productId}`) || null) as LossReason | null,
      })),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
}
