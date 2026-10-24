"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import type { ActionState } from "@/lib/action-result";

// Ters kayıt: asks for a reason, then records the opposite movement once.
export function ReverseButton({ action }: { action: (formData: FormData) => Promise<ActionState> }) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<ActionState>();
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Ters kayıt
      </Button>
    );
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("idempotencyKey", idempotencyKey);
        setPending(true);
        setState(await action(formData));
        setPending(false);
      }}
    >
      <Input name="reason" placeholder="Neden" aria-label="Ters kayıt nedeni" className="h-8 w-40" required />
      <Button type="submit" size="sm" disabled={pending}>
        Onayla
      </Button>
      {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
    </form>
  );
}
