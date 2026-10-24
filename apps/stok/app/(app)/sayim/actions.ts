"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runAction, type ActionState } from "@/lib/action-result";
import { sendNotificationsSoon } from "@/lib/send-soon";
import { approveCount, cancelCount, openCount, recordCountLines, type CountKind } from "@/lib/counts";
import { text } from "@/lib/form-data";

export async function openCountAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let countId = "";
  const state = await runAction(async () => {
    ({ countId } = await openCount(await headers(), {
      lokasyonId: text(formData, "lokasyonId"),
      kind: text(formData, "kind") as CountKind,
      category: text(formData, "category") || null,
    }));
  });
  if (state) return state;
  redirect(`/sayim/${countId}`);
}

export async function saveCountLinesAction(countId: string, formData: FormData): Promise<ActionState> {
  const entries = [...formData.entries()]
    .filter(([name]) => name.startsWith("counted:"))
    .map(([name, value]) => ({ productId: name.slice("counted:".length), counted: String(value) }));
  const state = await runAction(async () => recordCountLines(await headers(), countId, entries));
  revalidatePath(`/sayim/${countId}`);
  return state ?? { saved: true };
}

export async function approveCountAction(countId: string, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => {
    await approveCount(await headers(), countId, { idempotencyKey: text(formData, "idempotencyKey") });
  });
  revalidatePath(`/sayim/${countId}`);
  if (!state) sendNotificationsSoon();
  return state ?? { saved: true };
}

export async function cancelCountAction(countId: string): Promise<ActionState> {
  const state = await runAction(async () => cancelCount(await headers(), countId));
  revalidatePath(`/sayim/${countId}`);
  return state ?? { saved: true };
}
