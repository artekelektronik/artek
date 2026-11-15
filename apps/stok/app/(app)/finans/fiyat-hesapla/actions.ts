"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { saveLabor } from "@/lib/quote";

export async function saveLaborAction(productId: string, labor: string): Promise<ActionState> {
  const state = await runAction(async () => saveLabor(await headers(), productId, labor));
  revalidatePath("/finans/fiyat-hesapla");
  return state.saved ? { ...state, message: "İşçilik bu ürün için kaydedildi." } : state;
}
