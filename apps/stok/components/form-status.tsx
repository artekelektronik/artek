"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-result";

// Toasts an action's error or saved message; true when it saved.
export function toastResult(state: ActionState, saved?: string) {
  if (state?.error) {
    toast.error(state.error);
    return false;
  }
  const message = state?.message ?? saved;
  if (state?.saved && message) toast.success(message, { classNames: { title: "whitespace-pre-line" } });
  return Boolean(state?.saved);
}

// For useActionState forms that stay mounted: toasts each new state once.
export function FormStatus({ state, saved }: { state: ActionState; saved?: string }) {
  const shown = useRef<ActionState>(undefined);
  useEffect(() => {
    if (!state || shown.current === state) return;
    shown.current = state;
    toastResult(state, saved);
  }, [state, saved]);
  return null;
}
