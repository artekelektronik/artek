"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@artek/ui/components/dialog";
import { EditStock } from "@/components/edit-stock";
import { displayQuantity } from "@/lib/labels";
import { updateProductAction } from "../../urunler/actions";
import { ProductForm } from "../../urunler/product-form";
import type { loadProductEditorAction } from "./actions";

export type EditorData = NonNullable<Awaited<ReturnType<typeof loadProductEditorAction>>>;
export type StockPlace = { id: string; name: string; canCorrect: boolean; quantity: string };

// Opens over the price table without leaving it, so prices typed but not yet saved stay where they are.
export function ProductEditor({ data, places, onClose }: { data: EditorData; places: StockPlace[]; onClose: () => void }) {
  const { product } = data;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <section className="flex flex-col gap-1 text-sm">
          <h3 className="text-lg font-semibold">Stok</h3>
          {places.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-b py-1 tabular-nums last:border-0">
              <span>{p.name}</span>
              <span className="flex items-center gap-2">
                {p.canCorrect && <EditStock productId={product.id} lokasyonId={p.id} label={`${product.code} ${p.name}`} current={p.quantity} />}
                {displayQuantity(p.quantity)}
              </span>
            </div>
          ))}
        </section>
        <ProductForm action={updateProductAction.bind(null, product.id)} product={product} lokasyon={data.lokasyon} categories={data.categories} submitLabel="Kaydet" />
      </DialogContent>
    </Dialog>
  );
}
