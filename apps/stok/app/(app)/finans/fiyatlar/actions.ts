"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { savePrices } from "@/lib/prices";

export async function savePricesAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const lines = formData.getAll("productId").map((value) => {
    const productId = String(value);
    return {
      productId,
      purchasePrice: text(formData, `alis:${productId}`),
      purchaseCurrency: text(formData, `alisPara:${productId}`) as "TRY" | "USD" | "EUR",
      salePrice: text(formData, `satis:${productId}`),
      saleCurrency: text(formData, `satisPara:${productId}`) as "TRY" | "USD" | "EUR",
    };
  });
  const state = await runAction(async () => savePrices(await headers(), lines));
  revalidatePath("/finans/fiyatlar");
  revalidatePath("/");
  return state;
}
