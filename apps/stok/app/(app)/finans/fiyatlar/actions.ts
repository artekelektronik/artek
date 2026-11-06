"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { listLokasyon } from "@/lib/lokasyon";
import { savePrices } from "@/lib/prices";
import { getProduct, listCategories } from "@/lib/products";

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
  // Only the lines the user changed arrive, so a stale screen can't overwrite someone else's newer prices.
  const state = await runAction(async () => savePrices(await headers(), lines));
  revalidatePath("/finans/fiyatlar");
  revalidatePath("/");
  return state.saved ? { ...state, message: `${lines.length} ürünün fiyatı kaydedildi.` } : state;
}

// What the Düzenle window needs; loaded when opened, so the table doesn't carry every product's full card.
export async function loadProductEditorAction(id: string) {
  const requestHeaders = await headers();
  const [product, lokasyon, categories] = await Promise.all([getProduct(requestHeaders, id), listLokasyon(), listCategories(requestHeaders)]);
  return product ? { product, lokasyon, categories } : null;
}
