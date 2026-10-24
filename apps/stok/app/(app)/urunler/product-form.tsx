"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import type { ActionState } from "@/lib/action-result";
import { displayQuantity } from "@/lib/labels";
import { formatQuantity, unitLabels } from "@/lib/quantity";
import { selectClassName } from "@/lib/ui";

type Product = {
  code: string;
  name: string;
  category: string;
  isTradeGoods: boolean;
  isMaterial: boolean;
  unit: keyof typeof unitLabels;
  showOnSite: boolean;
  productType: string | null;
  subCategory: string | null;
  manufacturer: string | null;
  manufacturerCode: string | null;
  supplier: string | null;
  supplierCountry: string | null;
  minLevel: string | null;
  description: string | null;
  images: string[];
  datasheets: { label: string; url: string }[];
  shelves: Record<string, string>;
};

const empty: Product = {
  code: "",
  name: "",
  category: "",
  isTradeGoods: true,
  isMaterial: false,
  unit: "adet",
  showOnSite: true,
  productType: null,
  subCategory: null,
  manufacturer: null,
  manufacturerCode: null,
  supplier: null,
  supplierCountry: null,
  minLevel: null,
  description: null,
  images: [],
  datasheets: [],
  shelves: {},
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label className="flex-col items-stretch gap-1">
      {label}
      {children}
    </Label>
  );
}

export function ProductForm({
  action,
  product = empty,
  lokasyon,
  categories,
  readOnly = false,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  product?: Product;
  lokasyon: { id: string; name: string }[];
  categories: string[];
  readOnly?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const input = "font-normal";

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field label="Ürün kodu">
          <Input name="code" defaultValue={product.code} required className={`${input} font-mono`} />
        </Field>
        <Field label="Ürün adı">
          <Input name="name" defaultValue={product.name} required className={input} />
        </Field>
        <Field label="Kategori">
          <Input name="category" defaultValue={product.category} list="kategoriler" required className={input} />
          <datalist id="kategoriler">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="Birim">
          <select name="unit" defaultValue={product.unit} className={`${selectClassName} ${input} w-full`}>
            {Object.entries(unitLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kritik seviye (şirket toplamı, boşsa uyarı yok)">
          <Input
            name="minLevel"
            defaultValue={product.minLevel ? displayQuantity(formatQuantity(product.minLevel)) : ""}
            inputMode="decimal"
            className={input}
          />
        </Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Label className="font-normal">
            <Checkbox name="isTradeGoods" defaultChecked={product.isTradeGoods} /> Ticari mal
          </Label>
          <Label className="font-normal">
            <Checkbox name="isMaterial" defaultChecked={product.isMaterial} /> Malzeme
          </Label>
          <Label className="font-normal">
            <Checkbox name="showOnSite" defaultChecked={product.showOnSite} /> Sitede göster
          </Label>
        </div>
      </fieldset>

      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Sitede görünen bilgiler</legend>
        <Field label="Tip">
          <Input name="productType" defaultValue={product.productType ?? ""} className={input} />
        </Field>
        <Field label="Alt kategori">
          <Input name="subCategory" defaultValue={product.subCategory ?? ""} className={input} />
        </Field>
        <Field label="Üretici">
          <Input name="manufacturer" defaultValue={product.manufacturer ?? ""} className={input} />
        </Field>
        <Field label="Üretici kodu">
          <Input name="manufacturerCode" defaultValue={product.manufacturerCode ?? ""} className={input} />
        </Field>
        <Field label="Tedarikçi">
          <Input name="supplier" defaultValue={product.supplier ?? ""} className={input} />
        </Field>
        <Field label="Tedarikçi ülkesi">
          <Input name="supplierCountry" defaultValue={product.supplierCountry ?? ""} className={input} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Açıklama">
            <Textarea name="description" defaultValue={product.description ?? ""} rows={5} className={input} />
          </Field>
        </div>
        <Field label="Fotoğraflar (her satıra bir adres)">
          <Textarea name="images" defaultValue={product.images.join("\n")} rows={3} className={input} />
        </Field>
        <Field label="Teknik belgeler (her satıra: Etiket | adres)">
          <Textarea
            name="datasheets"
            defaultValue={product.datasheets.map((d) => `${d.label} | ${d.url}`).join("\n")}
            rows={3}
            className={input}
          />
        </Field>
      </fieldset>

      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Raf kodu</legend>
        {lokasyon.map((l) => (
          <Field key={l.id} label={l.name}>
            <Input name={`raf:${l.id}`} defaultValue={product.shelves[l.id] ?? ""} className={input} />
          </Field>
        ))}
      </fieldset>

      {state?.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state?.saved && <p className="text-sm text-green-700">Kaydedildi.</p>}
      {!readOnly && (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
      )}
    </form>
  );
}
