"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { deleteQuote, saveHourlyRate, saveQuote, saveStandard, type QuoteInput } from "@/lib/quote";

const path = "/finans/fiyat-hesapla";

export async function saveQuoteAction(input: QuoteInput): Promise<ActionState & { id?: string }> {
  let id: string | undefined;
  const state = await runAction(async () => {
    id = await saveQuote(await headers(), input);
  });
  revalidatePath(path);
  return state.saved ? { ...state, id, message: "Çalışma kaydedildi." } : state;
}

export async function deleteQuoteAction(id: string): Promise<ActionState> {
  const state = await runAction(async () => deleteQuote(await headers(), id));
  revalidatePath(path);
  return state;
}

export async function saveHourlyRateAction(rate: string): Promise<ActionState> {
  const state = await runAction(async () => saveHourlyRate(await headers(), rate));
  revalidatePath(path);
  revalidatePath("/finans/trafo");
  return state.saved ? { ...state, message: "Saat ücreti kaydedildi." } : state;
}

export async function saveStandardAction(input: Parameters<typeof saveStandard>[1]): Promise<ActionState> {
  const state = await runAction(async () => saveStandard(await headers(), input));
  revalidatePath(path);
  return state.saved ? { ...state, message: "Bu trafonun reçetesi ve süresi olarak kaydedildi." } : state;
}
