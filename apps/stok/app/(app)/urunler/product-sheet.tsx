"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@artek/ui/components/skeleton";
import { FormSheet } from "@/components/form-sheet";
import { createProductAction, getProductForEditAction, updateProductAction } from "./actions";
import { ProductForm, type ProductFormValues } from "./product-form";

type Props = {
  trigger: React.ReactNode;
  lokasyon: { id: string; name: string }[];
  categories: string[];
  readOnly?: boolean;
} & ({ mode: "new" } | { mode: "edit"; id: string; name: string; product?: ProductFormValues });

export function ProductSheet(props: Props) {
  return props.mode === "new" ? (
    <FormSheet trigger={props.trigger} title="Yeni ürün" description="Kod, ad ve kategori yeterli; diğer bilgileri sonra da tamamlayabilirsiniz.">
      <ProductForm action={createProductAction} lokasyon={props.lokasyon} categories={props.categories} submitLabel="Ürünü oluştur" />
    </FormSheet>
  ) : (
    <FormSheet trigger={props.trigger} title={props.name} description={props.readOnly ? "Ürün bilgileri" : "Kaydedince liste güncellenir."}>
      <EditBody {...props} />
    </FormSheet>
  );
}

// Omit `product` to load it when the sheet opens.
function EditBody({ id, product: given, lokasyon, categories, readOnly }: Extract<Props, { mode: "edit" }>) {
  const [product, setProduct] = useState<ProductFormValues | null | undefined>(given);

  useEffect(() => {
    if (given) return;
    let current = true;
    void getProductForEditAction(id).then((found) => current && setProduct(found));
    return () => {
      current = false;
    };
  }, [id, given]);

  if (product === undefined) return <FormSkeleton />;
  if (product === null) return <p className="text-muted-foreground text-sm">Ürün bulunamadı.</p>;
  return (
    <ProductForm
      action={updateProductAction.bind(null, id)}
      product={product}
      lokasyon={lokasyon}
      categories={categories}
      readOnly={readOnly}
      submitLabel="Kaydet"
    />
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
