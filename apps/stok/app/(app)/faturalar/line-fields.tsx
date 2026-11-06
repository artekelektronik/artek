"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Combobox } from "@/components/combobox";
import type { Mode } from "./options";

type WithLines = { lines: { mode: Mode; components: { productId: string; quantity: string }[] }[] };
type Option = { value: string; label: string; keywords?: string[] };

export function ModeField({ index, isReturn, disabled }: { index: number; isReturn: boolean; disabled: boolean }) {
  const { control } = useFormContext<WithLines>();
  return (
    <FormField
      control={control}
      name={`lines.${index}.mode`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">Stok</FormLabel>
          <Select value={field.value} onValueChange={field.onChange} disabled={field.disabled || disabled}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="stok">{isReturn ? "Stoğa geri al" : "Stoktan düş"}</SelectItem>
              {!isReturn && <SelectItem value="uretim">Malzemeden üret</SelectItem>}
              <SelectItem value="yok">Stoğa dokunma</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

// The materials a built line uses; saved as the product's reçete on confirm.
export function Materials({ index, options }: { index: number; options: Option[] }) {
  const { control, formState } = useFormContext<WithLines>();
  const { fields, append, remove } = useFieldArray({ control, name: `lines.${index}.components` });
  return (
    <div className="bg-muted/40 flex flex-col gap-2 rounded-md p-3">
      <p className="text-muted-foreground text-xs">Malzemeler (üretim tüketimi olarak düşer; onaylayınca bu ürünün reçetesi olarak saklanır)</p>
      {fields.map((f, j) => (
        <div key={f.id} className="grid grid-cols-[1fr_7rem_auto] items-start gap-2">
          <FormField
            control={control}
            name={`lines.${index}.components.${j}.productId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Malzeme {j + 1}</FormLabel>
                <FormControl>
                  <Combobox options={options} value={field.value} onChange={field.onChange} disabled={field.disabled} placeholder="Malzeme ara" className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`lines.${index}.components.${j}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Malzeme {j + 1} miktarı</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" placeholder="Miktar" className="tabular-nums" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!formState.disabled && (
            <Button type="button" variant="ghost" size="icon" aria-label="Malzemeyi çıkar" onClick={() => remove(j)}>
              <X />
            </Button>
          )}
        </div>
      ))}
      <FormField control={control} name={`lines.${index}.components`} render={() => <FormMessage />} />
      {!formState.disabled && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append({ productId: "", quantity: "" })}>
          <Plus /> Malzeme ekle
        </Button>
      )}
    </div>
  );
}
