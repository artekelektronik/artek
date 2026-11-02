"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { Pencil, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { FormStatus } from "@/components/form-status";
import { ProductImage } from "@/components/product-image";
import { SortBar, type SortField } from "@/components/sort-bar";
import type { ActionState } from "@/lib/action-result";
import { decodeSorts, encodeSorts, noType, priceStates, stockStates, typeOf, viewPrices, type PriceFacts } from "@/lib/price-view";
import { loadProductEditorAction, savePricesAction } from "./actions";
import { ChoiceFilter, MultiFilter } from "./filter-menu";
import { ProductEditor, type EditorData } from "./product-editor";

export type PriceRow = PriceFacts & {
  id: string;
  image: string | null;
  details: string;
  stock: string;
  where: string;
  physical: Record<string, string>;
  purchasePrice: string;
  purchaseCurrency: string;
  salePrice: string;
  saleCurrency: string;
};
export type PriceLokasyon = { id: string; name: string; canCorrect: boolean };

const currencies = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "TRY", label: "TL" },
];

const sortFields: SortField[] = [
  { id: "stok", label: "Stok adedi", kind: "number" },
  { id: "ad", label: "Ürün adı", kind: "text" },
  { id: "kod", label: "Kod", kind: "text" },
  { id: "kategori", label: "Kategori", kind: "text" },
  { id: "tip", label: "Tip", kind: "text" },
];
const entries = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const distinct = (values: string[]) =>
  [...new Set(values)]
    .sort((a, b) => a.localeCompare(b, "tr"))
    .map((value) => ({ value, label: value }));
const list = parseAsArrayOf(parseAsString).withDefault([]);

// A plain select, not FormSelect: two per row, and Tab must move straight through a long table.
function CurrencySelect({ name, defaultValue, disabled, label }: { name: string; defaultValue: string; disabled: boolean; label: string }) {
  return (
    <select name={name} defaultValue={defaultValue} disabled={disabled} aria-label={label} className="border-input bg-background h-9 rounded-md border px-2 text-sm">
      {currencies.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

export function PricesForm({ rows, lokasyon, readOnly, canEditProducts }: { rows: PriceRow[]; lokasyon: PriceLokasyon[]; readOnly: boolean; canEditProducts: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePricesAction, undefined);
  const [q, setQ] = useQueryState("ara", parseAsString.withDefault(""));
  // First view: what still needs a price and is actually in stock, most stock first.
  const [price, setPrice] = useQueryState("fiyat", parseAsStringLiteral(Object.keys(priceStates) as (keyof typeof priceStates)[]).withDefault("eksik"));
  const [stock, setStock] = useQueryState("stok", parseAsStringLiteral(Object.keys(stockStates) as (keyof typeof stockStates)[]).withDefault("stokta"));
  const [categories, setCategories] = useQueryState("kategori", list);
  const [types, setTypes] = useQueryState("tip", list);
  const [places, setPlaces] = useQueryState("lokasyon", list);
  const [sortText, setSortText] = useQueryState("sirala", parseAsString.withDefault("stok.azalan"));
  const sorts = decodeSorts(sortText);

  const [editor, setEditor] = useState<EditorData | null>(null);
  const [opening, startOpening] = useTransition();

  const shown = viewPrices(rows, { price, stock, categories, types, lokasyon: places, q }, sorts);
  const shownIds = new Set(shown.map((r) => r.id));
  const filtered = price !== "tumu" || stock !== "tumu" || categories.length > 0 || types.length > 0 || places.length > 0 || q !== "";
  const editing = editor && rows.find((r) => r.id === editor.product.id);

  function clearFilters() {
    void setPrice("tumu");
    void setStock("tumu");
    void setCategories([]);
    void setTypes([]);
    void setPlaces([]);
    void setQ("");
  }

  return (
    <>
      {/* Not <form action>: React would clear what was typed when a line has an error. */}
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Input value={q} onChange={(e) => void setQ(e.target.value)} placeholder="Kod veya ürün adı ara" aria-label="Ürün ara" className="max-w-xs font-normal" />
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          )}
          <FormStatus state={state} saved="Kaydedildi." />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ChoiceFilter label="Fiyat" options={entries(priceStates)} value={price} onChange={(v) => void setPrice(v as keyof typeof priceStates)} />
          <ChoiceFilter label="Stok" options={entries(stockStates)} value={stock} onChange={(v) => void setStock(v as keyof typeof stockStates)} />
          <MultiFilter label="Kategori" options={distinct(rows.map((r) => r.category))} value={categories} onChange={(v) => void setCategories(v)} />
          <MultiFilter label="Tip" options={distinct(rows.map(typeOf))} value={types} onChange={(v) => void setTypes(v)} />
          <MultiFilter label="Lokasyon" options={lokasyon.map((l) => ({ value: l.id, label: l.name }))} value={places} onChange={(v) => void setPlaces(v)} />
          {filtered && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <X /> Filtreleri temizle
            </Button>
          )}
          <span className="text-muted-foreground ml-1 text-xs tabular-nums">
            {shown.length} / {rows.length} ürün
          </span>
        </div>
        <SortBar fields={sortFields} sorts={sorts} onChange={(next) => void setSortText(encodeSorts(next))} />
        <div className="max-h-[70vh] overflow-auto rounded-lg border [&_[data-slot=table-container]]:overflow-visible">
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Kategori / tip</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead>Nerede</TableHead>
                <TableHead>Alış fiyatı</TableHead>
                <TableHead>Satış fiyatı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                    Bu filtreye uyan ürün yok.
                  </TableCell>
                </TableRow>
              )}
              {/* Rows outside the view stay in the page, hidden: changing a filter must not drop what was typed in them. */}
              {[...shown, ...rows.filter((r) => !shownIds.has(r.id))].map((row) => (
                <TableRow key={row.id} className={shownIds.has(row.id) ? undefined : "hidden"}>
                  <TableCell className="min-w-64 whitespace-normal">
                    <input type="hidden" name="productId" value={row.id} />
                    <div className="flex items-center gap-3">
                      <ProductImage path={row.image} alt={row.name} className="size-14" />
                      <div className="flex min-w-0 flex-col items-start">
                        <span className="font-medium">{row.name}</span>
                        <span className="text-muted-foreground text-xs">{row.details}</span>
                        {canEditProducts && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto gap-1 p-0 text-xs"
                            disabled={opening}
                            aria-label={`${row.code} ürününü düzenle`}
                            onClick={() =>
                              startOpening(async () => {
                                setEditor(await loadProductEditorAction(row.id));
                              })
                            }
                          >
                            <Pencil className="size-3" /> Düzenle
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col text-sm">
                      <span>{row.category}</span>
                      <span className="text-muted-foreground text-xs">{row.productType ?? noType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">{row.stock}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-normal">{row.where}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Input name={`alis:${row.id}`} defaultValue={row.purchasePrice} disabled={readOnly} inputMode="decimal" aria-label={`${row.code} alış fiyatı`} className="w-24 font-normal" />
                      <CurrencySelect name={`alisPara:${row.id}`} defaultValue={row.purchaseCurrency} disabled={readOnly} label={`${row.code} alış para birimi`} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Input name={`satis:${row.id}`} defaultValue={row.salePrice} disabled={readOnly} inputMode="decimal" aria-label={`${row.code} satış fiyatı`} className="w-24 font-normal" />
                      <CurrencySelect name={`satisPara:${row.id}`} defaultValue={row.saleCurrency} disabled={readOnly} label={`${row.code} satış para birimi`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </form>
      {/* Outside the form: a submit in the editor would otherwise bubble through React and save the prices too. */}
      {editing && editor && (
        <ProductEditor
          data={editor}
          places={lokasyon.map((l) => ({ ...l, quantity: editing.physical[l.id] ?? "0" }))}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
