"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { useCloseSheet } from "@/components/form-sheet";
import { toastResult } from "@/components/form-status";
import type { ActionState } from "@/lib/action-result";

// Fresh idempotency key per entry (a double click records once); keeps input on error, clears on success.
export function StockForm({
  action,
  submitLabel,
  savedMessage,
  children,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  savedMessage: string;
  children: React.ReactNode;
}) {
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [entry, setEntry] = useState(0);
  const [pending, setPending] = useState(false);
  const closeSheet = useCloseSheet();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotencyKey", idempotencyKey);
    setPending(true);
    const result = await action(formData);
    setPending(false);
    if (!toastResult(result, savedMessage)) return;
    if (closeSheet) return closeSheet();
    setEntry(entry + 1);
    setIdempotencyKey(crypto.randomUUID());
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-4">
      <div key={entry} className="contents">
        {children}
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor…" : submitLabel}
      </Button>
    </form>
  );
}
