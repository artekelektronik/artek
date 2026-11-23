"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { setRequestStatus } from "@/lib/requests";

export async function setRequestStatusAction(id: string, status: "yeni" | "yanitlandi" | "kapandi"): Promise<ActionState> {
  const state = await runAction(async () => setRequestStatus(await headers(), { id, status }));
  revalidatePath("/musteriler/talepler");
  return state;
}
