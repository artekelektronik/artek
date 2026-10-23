"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { productLinesFrom, text } from "@/lib/form-data";
import { receiveTransfer, sendTransfer, type LossReason } from "@/lib/transfers";

export async function sendTransferAction(formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    await sendTransfer(await headers(), {
      fromLokasyonId: text(formData, "fromLokasyonId"),
      toLokasyonId: text(formData, "toLokasyonId"),
      note: text(formData, "note"),
      lines: productLinesFrom(formData),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
  revalidatePath("/transfer");
  return state ?? { saved: true };
}

export async function receiveTransferAction(transferId: string, formData: FormData): Promise<ActionState> {
  const productIds = formData.getAll("productId").map(String);
  const state = await runAction(async () => {
    await receiveTransfer(await headers(), transferId, {
      lines: productIds.map((productId) => ({
        productId,
        received: text(formData, `received:${productId}`),
        lossReason: (text(formData, `lossReason:${productId}`) || null) as LossReason | null,
      })),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  });
  revalidatePath(`/transfer/${transferId}`);
  return state ?? { saved: true };
}
