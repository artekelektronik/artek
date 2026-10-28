"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import { completeCall, sendSuggestionEmail, skipSuggestion } from "@/lib/suggestions";

function done(state: ActionState) {
  revalidatePath("/musteriler/bugun");
  revalidatePath("/musteriler");
  return state;
}

export async function sendEmailAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return done(
    await runAction(async () =>
      sendSuggestionEmail(await headers(), {
        id: text(formData, "id"),
        subject: text(formData, "subject"),
        body: text(formData, "body"),
        nextFollowUpOn: text(formData, "nextFollowUpOn"),
      }),
    ),
  );
}

export async function completeCallAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return done(
    await runAction(async () =>
      completeCall(await headers(), { id: text(formData, "id"), note: text(formData, "note"), nextFollowUpOn: text(formData, "nextFollowUpOn") }),
    ),
  );
}

export async function skipAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => skipSuggestion(await headers(), { id })));
}
