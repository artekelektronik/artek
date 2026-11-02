"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { correctStockAction } from "@/app/(app)/stok-girisi/actions";
import { displayQuantity } from "@/lib/labels";

export function EditStock({ productId, lokasyonId, label, current }: { productId: string; lokasyonId: string; label: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  if (!open) {
    return (
      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" aria-label={`${label} stoğunu düzenle`} onClick={() => setOpen(true)}>
        Düzenle
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col items-end gap-1"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await correctStockAction({
          productId,
          lokasyonId,
          quantity: String(new FormData(event.currentTarget).get("quantity")),
          idempotencyKey,
        });
        setPending(false);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setIdempotencyKey(crypto.randomUUID());
        setError(undefined);
        setOpen(false);
      }}
    >
      <div className="flex items-center gap-1">
        <Input
          name="quantity"
          defaultValue={displayQuantity(current)}
          inputMode="decimal"
          autoFocus
          onFocus={(e) => e.target.select()}
          aria-label={`${label} doğru stok`}
          className="h-8 w-20"
        />
        <Button type="submit" size="sm" disabled={pending}>
          Kaydet
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
      {error && <p className="text-destructive max-w-48 text-xs">{error}</p>}
    </form>
  );
}
