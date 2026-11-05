"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { correctStockAction } from "@/app/(app)/stok-girisi/actions";
import { FormDialog } from "@/components/form-dialog";
import { toastResult } from "@/components/form-status";
import { displayQuantity } from "@/lib/labels";

export function EditStock({ productId, lokasyonId, label, current }: { productId: string; lokasyonId: string; label: string; current: string }) {
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  return (
    <FormDialog
      className="sm:max-w-sm"
      title="Stoğu düzelt"
      description={`${label} · şu an ${displayQuantity(current)}. Doğru miktarı yazın; fark bir düzeltme hareketi olarak kaydedilir.`}
      submitLabel="Kaydet"
      trigger={
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" aria-label={`${label} stoğunu düzenle`}>
          Düzenle
        </Button>
      }
      onSubmit={async (formData) => {
        const result = await correctStockAction({ productId, lokasyonId, quantity: String(formData.get("quantity")), idempotencyKey });
        if (!toastResult(result, `${label} stoğu düzeltildi.`)) return false;
        setIdempotencyKey(crypto.randomUUID());
        return true;
      }}
    >
      <Label className="flex-col items-stretch gap-1">
        Doğru stok
        <Input
          name="quantity"
          defaultValue={displayQuantity(current)}
          inputMode="decimal"
          autoFocus
          onFocus={(e) => e.target.select()}
          className="font-normal tabular-nums"
        />
      </Label>
    </FormDialog>
  );
}
