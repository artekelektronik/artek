"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { quickAddProductAction } from "@/app/(app)/urunler/actions";
import { Combobox } from "@/components/combobox";
import { FormSelect } from "@/components/form-select";
import { unitLabels } from "@/lib/quantity";

// Just enough to record a product that isn't in the catalog yet; the rest is filled in later under Ürünler.
export function QuickAddProduct({ categories, onAdded }: { categories: string[]; onAdded?: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState<string>();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Listede olmayan ürün ekle
        </Button>
        {added && <p className="text-muted-foreground text-sm">“{added}” eklendi, listeden seçebilirsiniz.</p>}
      </div>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setPending(true);
        const result = await quickAddProductAction(formData);
        setPending(false);
        if (result?.error) {
          setError(result.error);
          return;
        }
        const name = String(formData.get("name"));
        onAdded?.(name);
        setAdded(name);
        setOpen(false);
        setCategory("");
        setError(undefined);
      }}
    >
      <Label className="flex-col items-stretch gap-1">
        Ürün adı
        <Input name="name" required className="w-56 font-normal" />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        Ürün kodu
        <Input name="code" placeholder="Boşsa otomatik" className="w-36 font-normal" />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        Kategori
        <Combobox
          options={categories.map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={setCategory}
          placeholder="Seçin veya yazın"
          allowNew
          aria-label="Kategori"
          className="w-48"
        />
        <input type="hidden" name="category" value={category} />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        Birim
        <FormSelect name="unit" options={Object.entries(unitLabels).map(([value, label]) => ({ value, label }))} className="w-24" />
      </Label>
      <div className="flex gap-4 pb-2">
        <Label className="font-normal">
          <Checkbox name="isMaterial" defaultChecked /> Malzeme
        </Label>
        <Label className="font-normal">
          <Checkbox name="isTradeGoods" /> Ticari mal
        </Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Ekleniyor…" : "Ekle"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Vazgeç
      </Button>
      <p className="text-muted-foreground w-full text-sm">Bu ürün sitede görünmez. Diğer bilgilerini sonra Ürünler ekranından tamamlayabilirsiniz.</p>
      {error && <p className="text-destructive w-full text-sm">{error}</p>}
    </form>
  );
}
