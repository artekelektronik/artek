"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { FormControl, FormField, FormItem, FormMessage } from "@artek/ui/components/form";
import { Input } from "@artek/ui/components/input";
import { Combobox } from "@/components/combobox";
import { productOption } from "./options";

// Both invoice forms keep a line's materials at lines[i].components.
type WithMaterials = { lines: { components: { productId: string; quantity: string }[] }[] };

// The materials an Özel trafo line was built from; saved as the product's reçete on confirm.
export function Materials({ index, products }: { index: number; products: Parameters<typeof productOption>[0][] }) {
  const { control, formState } = useFormContext<WithMaterials>();
  const { fields, append, remove } = useFieldArray({ control, name: `lines.${index}.components` });
  const options = useMemo(() => products.map(productOption), [products]);
  const disabled = formState.disabled;
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
                <FormControl>
                  <Input {...field} inputMode="decimal" placeholder="Miktar" className="tabular-nums" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!disabled && (
            <Button type="button" variant="ghost" size="icon" aria-label="Malzemeyi çıkar" onClick={() => remove(j)}>
              <X />
            </Button>
          )}
        </div>
      ))}
      <FormField control={control} name={`lines.${index}.components`} render={() => <FormMessage />} />
      {!disabled && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append({ productId: "", quantity: "" })}>
          <Plus /> Malzeme ekle
        </Button>
      )}
    </div>
  );
}
