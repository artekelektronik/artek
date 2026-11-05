"use client";

import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@artek/ui/components/sheet";
import { Skeleton } from "@artek/ui/components/skeleton";
import { createProductAction, getProductForEditAction, updateProductAction } from "./actions";
import { ProductForm, type ProductFormValues } from "./product-form";

type Props = {
  trigger: React.ReactNode;
  lokasyon: { id: string; name: string }[];
  categories: string[];
  readOnly?: boolean;
} & (
  | { mode: "new" }
  // `product` when the page already has it; otherwise it's loaded when the sheet opens.
  | { mode: "edit"; id: string; name: string; product?: ProductFormValues }
);

// Adding or editing a product happens in a side sheet, so the list behind it doesn't move.
export function ProductSheet(props: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{props.trigger}</SheetTrigger>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{props.mode === "new" ? "Yeni ürün" : props.name}</SheetTitle>
          <SheetDescription>
            {props.mode === "new"
              ? "Kod, ad ve kategori yeterli; diğer bilgileri sonra da tamamlayabilirsiniz."
              : props.readOnly
                ? "Ürün bilgileri"
                : "Ürün bilgilerini düzenleyin; kaydedince liste güncellenir."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          {open &&
            (props.mode === "new" ? (
              <ProductForm action={createProductAction} lokasyon={props.lokasyon} categories={props.categories} submitLabel="Ürünü oluştur" onSaved={close} />
            ) : (
              <EditBody {...props} onSaved={close} />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditBody({
  id,
  product: given,
  lokasyon,
  categories,
  readOnly,
  onSaved,
}: Extract<Props, { mode: "edit" }> & { onSaved: () => void }) {
  const [product, setProduct] = useState<ProductFormValues | null | undefined>(given);

  useEffect(() => {
    if (given) return;
    let current = true;
    void getProductForEditAction(id).then((found) => {
      if (current) setProduct(found);
    });
    return () => {
      current = false;
    };
  }, [id, given]);

  if (product === undefined) {
    return (
      <div className="grid gap-4 py-2 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (product === null) return <p className="text-muted-foreground py-2 text-sm">Ürün bulunamadı.</p>;

  return (
    <ProductForm
      action={updateProductAction.bind(null, id)}
      product={product}
      lokasyon={lokasyon}
      categories={categories}
      readOnly={readOnly}
      submitLabel="Kaydet"
      onSaved={onSaved}
    />
  );
}
