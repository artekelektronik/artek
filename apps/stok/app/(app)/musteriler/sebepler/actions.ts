"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { archiveReason, moveReason, saveReason } from "@/lib/reasons";

function done(state: ActionState) {
  revalidatePath("/musteriler/sebepler");
  revalidatePath("/musteriler/bugun");
  return state;
}

export async function saveReasonAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return done(
    await runAction(async () =>
      saveReason(await headers(), {
        id: text(formData, "id"),
        label: text(formData, "label"),
        effect: text(formData, "effect") as "not",
        days: text(formData, "days"),
      }),
    ),
  );
}

export async function moveReasonAction(id: string, direction: "up" | "down"): Promise<ActionState> {
  return done(await runAction(async () => moveReason(await headers(), id, direction)));
}

export async function archiveReasonAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => archiveReason(await headers(), id)));
}
