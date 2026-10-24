"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { processOutboxAction } from "./actions";

export function SendNowButton() {
  const [state, formAction, pending] = useActionState(processOutboxAction, undefined);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Bekleyenleri şimdi gönder"}
      </Button>
      {state?.error && (
        <span role="alert" className="text-destructive text-sm">
          {state.error}
        </span>
      )}
      {state?.saved && <span className="text-muted-foreground text-sm">Denendi; sonuç aşağıda.</span>}
    </form>
  );
}
