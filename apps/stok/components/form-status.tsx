"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-result";

// Shows a form's error, or its saved message once it succeeds, as a toast. Renders nothing in place.
export function FormStatus({ state, saved }: { state: ActionState; saved?: string; className?: string }) {
  const shown = useRef<ActionState>(undefined);
  useEffect(() => {
    // Each submit returns a new state object; show each one once.
    if (!state || shown.current === state) return;
    shown.current = state;
    if (state.error) toast.error(state.error);
    else if (state.saved && (state.message ?? saved)) toast.success(state.message ?? saved, { classNames: { title: "whitespace-pre-line" } });
  }, [state, saved]);
  return null;
}
