"use client";

import { useState } from "react";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { FormSelect } from "@/components/form-select";
import { ProductLines } from "@/components/product-lines";

type Option = { value: string; label: string };

// The chosen Lokasyon decides which stock figures the product picker shows.
export function StockOutFields({
  types,
  lokasyon,
  products,
  availableByLokasyon,
}: {
  types: Option[];
  lokasyon: Option[];
  products: React.ComponentProps<typeof ProductLines>["products"];
  availableByLokasyon: Record<string, Record<string, string>>;
}) {
  const [lokasyonId, setLokasyonId] = useState(lokasyon[0].value);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label className="flex-col items-stretch gap-1">
          Çıkış türü
          <FormSelect name="type" options={types} className="w-full" />
        </Label>
        <Label className="flex-col items-stretch gap-1">
          Lokasyon
          <FormSelect name="lokasyonId" options={lokasyon} onValueChange={setLokasyonId} className="w-full" />
        </Label>
      </div>
      <ProductLines products={products} available={availableByLokasyon[lokasyonId] ?? {}} />
      <Label className="flex-col items-stretch gap-1">
        Neden
        <Textarea name="reason" required rows={3} className="font-normal" placeholder="Örn. müşteri teslimatı, kırık parça" />
      </Label>
      <Label className="flex-col items-stretch gap-1 sm:max-w-sm">
        Referans (isteğe bağlı)
        <Input name="reference" className="font-normal" placeholder="Fatura, iş veya müşteri no" />
      </Label>
    </>
  );
}
