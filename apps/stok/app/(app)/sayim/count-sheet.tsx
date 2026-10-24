"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import type { ActionState } from "@/lib/action-result";
import { FormStatus } from "@/components/form-status";

// Keeps typed values after saving; the refresh shows balance-at-count and difference.
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
      <FormStatus state={state} saved="Sayılan miktarlar kaydedildi." />
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
