import { cn } from "@artek/ui/lib/utils";
import type { ActionState } from "@/lib/action-result";

// A form's error, or its saved message once it succeeds.
export function FormStatus({ state, saved, className }: { state: ActionState; saved?: string; className?: string }) {
  if (state?.error) {
    return (
      <p role="alert" className={cn("text-destructive text-sm", className)}>
        {state.error}
      </p>
    );
  }
  return state?.saved && saved ? <p className={cn("text-sm text-green-700 dark:text-green-400", className)}>{saved}</p> : null;
}
