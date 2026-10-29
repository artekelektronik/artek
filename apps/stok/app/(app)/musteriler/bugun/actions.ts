"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { runAction, type ActionState } from "@/lib/action-result";
import type { CloseReason } from "@/lib/close-reasons";
import { text } from "@/lib/form-data";
import { approvalArrived, closeUndone, completeCall, postponeSuggestion, sendSuggestionEmail, waitForApproval } from "@/lib/suggestions";

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
      completeCall(await headers(), {
        id: text(formData, "id"),
        note: text(formData, "note"),
        calledOn: text(formData, "calledOn"),
        nextFollowUpOn: text(formData, "nextFollowUpOn"),
      }),
    ),
  );
}

export async function closeUndoneAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return done(
    await runAction(async () =>
      closeUndone(await headers(), { id: text(formData, "id"), reason: text(formData, "reason") as CloseReason, note: text(formData, "note") }),
    ),
  );
}

export async function postponeAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  // "3 gün", "1 hafta"… submit their own day; otherwise the picked one.
  const until = text(formData, "quick") || text(formData, "until");
  return done(await runAction(async () => postponeSuggestion(await headers(), { id: text(formData, "id"), until })));
}

export async function waitForApprovalAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  return done(await runAction(async () => waitForApproval(await headers(), { id: text(formData, "id"), waitingFor: text(formData, "waitingFor") })));
}

export async function approvalArrivedAction(id: string): Promise<ActionState> {
  return done(await runAction(async () => approvalArrived(await headers(), id)));
}
