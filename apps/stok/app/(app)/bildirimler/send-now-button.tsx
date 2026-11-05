"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { FormStatus } from "@/components/form-status";
import { processOutboxAction } from "./actions";

export function SendNowButton() {
  const [state, formAction, pending] = useActionState(processOutboxAction, undefined);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Bekleyenleri şimdi gönder"}
      </Button>
      <FormStatus state={state} saved="Denendi; sonuç aşağıda." />
    </form>
  );
}
