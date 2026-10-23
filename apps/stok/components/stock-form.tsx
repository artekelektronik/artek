"use client";

import { useRef, useState } from "react";
import { Button } from "@artek/ui/components/button";
import type { ActionState } from "@/lib/action-result";

// A form for recording stock. It sends a fresh idempotency key per entry, so a double click or a
// retry records once; it keeps what the user typed when the server refuses, and clears after success.
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
  const form = useRef<HTMLFormElement>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [entry, setEntry] = useState(0);
  const [state, setState] = useState<ActionState>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("idempotencyKey", idempotencyKey);
    setPending(true);
    const result = await action(formData);
    setPending(false);
    setState(result);
    if (result?.saved) {
      form.current?.reset();
      setEntry(entry + 1);
      setIdempotencyKey(crypto.randomUUID());
    }
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-4">
      <div key={entry} className="contents">
        {children}
      </div>
      {state?.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state?.saved && <p className="text-sm text-green-700">{savedMessage}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor…" : submitLabel}
      </Button>
    </form>
  );
}
