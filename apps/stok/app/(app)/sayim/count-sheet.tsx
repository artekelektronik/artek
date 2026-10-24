"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import type { ActionState } from "@/lib/action-result";

// Counted quantities for an open session. Saving keeps what was typed and shows the server's
// balance-at-count and difference once the page refreshes.
export function CountSheetForm({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await action(new FormData(event.currentTarget));
        setPending(false);
        setState(result);
        if (result?.saved) router.refresh();
      }}
    >
      {children}
      {state?.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state?.saved && <p className="text-sm text-green-700">Sayılan miktarlar kaydedildi.</p>}
      <Button type="submit" disabled={pending} className="self-start print:hidden">
        {pending ? "Kaydediliyor…" : "Sayılanları kaydet"}
      </Button>
    </form>
  );
}

export function CountedInput({ productId, code, defaultValue }: { productId: string; code: string; defaultValue: string }) {
  return (
    <Input
      name={`counted:${productId}`}
      defaultValue={defaultValue}
      inputMode="decimal"
      aria-label={`${code} sayılan`}
      className="h-8 w-24 print:hidden"
    />
  );
}
