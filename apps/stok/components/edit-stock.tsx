"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@artek/ui/components/dialog";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { correctStockAction } from "@/app/(app)/stok-girisi/actions";
import { displayQuantity } from "@/lib/labels";

// Corrects one Lokasyon's stock in a dialog, so the table it sits in never changes shape.
export function EditStock({ productId, lokasyonId, label, current }: { productId: string; lokasyonId: string; label: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" aria-label={`${label} stoğunu düzenle`}>
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form
          className="flex flex-col gap-4"
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
              toast.error(result.error);
              return;
            }
            setIdempotencyKey(crypto.randomUUID());
            toast.success(`${label} stoğu düzeltildi.`);
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Stoğu düzelt</DialogTitle>
            <DialogDescription>
              {label} · şu an {displayQuantity(current)}. Doğru miktarı yazın; fark bir düzeltme hareketi olarak kaydedilir.
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
