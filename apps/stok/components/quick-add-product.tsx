"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
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
import { quickAddProductAction } from "@/app/(app)/urunler/actions";
import { Combobox } from "@/components/combobox";
import { FormSelect } from "@/components/form-select";
import { unitLabels } from "@/lib/quantity";

// Just enough to record a product that isn't in the catalog yet; the rest is filled in later under Ürünler.
export function QuickAddProduct({ categories, onAdded }: { categories: string[]; onAdded?: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCategory("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="self-start">
          <Plus /> Listede olmayan ürün ekle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setPending(true);
            const result = await quickAddProductAction(formData);
            setPending(false);
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            const name = String(formData.get("name"));
            onAdded?.(name);
            toast.success(`“${name}” eklendi, listeden seçebilirsiniz.`);
            setOpen(false);
            setCategory("");
          }}
        >
          <DialogHeader>
            <DialogTitle>Listede olmayan ürün ekle</DialogTitle>
            <DialogDescription>Bu ürün sitede görünmez. Diğer bilgilerini sonra Ürünler ekranından tamamlayabilirsiniz.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="flex-col items-stretch gap-1 sm:col-span-2">
              Ürün adı
              <Input name="name" required autoFocus className="font-normal" />
            </Label>
            <Label className="flex-col items-stretch gap-1">
              Ürün kodu
              <Input name="code" placeholder="Boşsa otomatik" className="font-normal" />
            </Label>
            <Label className="flex-col items-stretch gap-1">
              Birim
              <FormSelect name="unit" options={Object.entries(unitLabels).map(([value, label]) => ({ value, label }))} className="w-full" />
            </Label>
            <Label className="flex-col items-stretch gap-1 sm:col-span-2">
              Kategori
              <Combobox
                options={categories.map((c) => ({ value: c, label: c }))}
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
                <Checkbox name="isMaterial" defaultChecked /> Malzeme
              </Label>
              <Label className="font-normal">
                <Checkbox name="isTradeGoods" /> Ticari mal
              </Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Ekleniyor…" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
