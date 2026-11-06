"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { quickAddProductAction } from "@/app/(app)/urunler/actions";
import { Combobox } from "@/components/combobox";
import { FormDialog } from "@/components/form-dialog";
import { FormSelect } from "@/components/form-select";
import { toastResult } from "@/components/form-status";
import { unitLabels, type Unit } from "@/lib/quantity";

type Defaults = { name?: string; code?: string; category?: string; unit?: Unit; isMaterial?: boolean; isTradeGoods?: boolean };

// Just enough to record a product that isn't in the catalog yet; the rest is filled in later under Ürünler.
export function QuickAddProduct({
  categories,
  onAdded,
  defaults = {},
  trigger,
}: {
  categories: string[];
  onAdded?: (product: { id: string; name: string }) => void;
  defaults?: Defaults;
  trigger?: React.ReactNode;
}) {
  return (
    <FormDialog
      title="Listede olmayan ürün ekle"
      description="Bu ürün sitede görünmez. Diğer bilgilerini sonra Ürünler ekranından tamamlayabilirsiniz."
      submitLabel="Ekle"
      pendingLabel="Ekleniyor…"
      trigger={
        trigger ?? (
          <Button type="button" variant="outline" className="self-start">
            <Plus /> Listede olmayan ürün ekle
          </Button>
        )
      }
      onSubmit={async (formData) => {
        const name = String(formData.get("name"));
        const result = await quickAddProductAction(formData);
        if (!toastResult(result, `“${name}” eklendi.`) || !result.id) return false;
        onAdded?.({ id: result.id, name });
        return true;
      }}
    >
      <Fields categories={categories} defaults={defaults} />
    </FormDialog>
  );
}

function Fields({ categories, defaults }: { categories: string[]; defaults: Defaults }) {
  const [category, setCategory] = useState(defaults.category ?? "");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Label className="flex-col items-stretch gap-1 sm:col-span-2">
        Ürün adı
        <Input name="name" required autoFocus defaultValue={defaults.name} className="font-normal" />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        Ürün kodu
        <Input name="code" placeholder="Boşsa otomatik" defaultValue={defaults.code} className="font-normal" />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        Birim
        <FormSelect name="unit" options={Object.entries(unitLabels).map(([value, label]) => ({ value, label }))} defaultValue={defaults.unit} className="w-full" />
      </Label>
      <Label className="flex-col items-stretch gap-1 sm:col-span-2">
        Kategori
        <Combobox
          options={[...new Set([...categories, ...(defaults.category ? [defaults.category] : [])])].map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={setCategory}
          placeholder="Seçin veya yazın"
          allowNew
          aria-label="Kategori"
        />
        <input type="hidden" name="category" value={category} />
      </Label>
      <div className="flex gap-4 sm:col-span-2">
        <Label className="font-normal">
          <Checkbox name="isMaterial" defaultChecked={defaults.isMaterial ?? true} /> Malzeme
        </Label>
        <Label className="font-normal">
          <Checkbox name="isTradeGoods" defaultChecked={defaults.isTradeGoods} /> Ticari mal
        </Label>
      </div>
    </div>
  );
}
