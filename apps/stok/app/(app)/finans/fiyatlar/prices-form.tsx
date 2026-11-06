"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { Check, Pencil, Sparkles, X } from "lucide-react";
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
import { suggest, TierBadge, TierLegend, tiers } from "./sale-tiers";

export type PriceRow = PriceFacts & {
  id: string;
  image: string | null;
  details: string;
  stock: string;
  where: string;
  physical: Record<string, string>;
  purchasePrice: string;
  purchaseCurrency: string;
  salePriceA: string;
  salePrice: string;
  salePriceC: string;
  saleCurrency: string;
};
export type PriceLokasyon = { id: string; name: string; canCorrect: boolean };

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

const currencies = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "TRY", label: "TL" },
];

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

const fields = ["alis", "alisPara", "satisA", "satis", "satisC", "satisPara"];
const fieldOf = (name: string) => /^([a-zA-Z]+):(.+)$/.exec(name);
const saved = (row: PriceRow) => ({ satisA: row.salePriceA, satis: row.salePrice, satisC: row.salePriceC });

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

  // Rows typed in since the last save; only these are sent.
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [lastSave, setLastSave] = useState<{ at: string; count: number } | null>(null);
  const sent = useRef<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  // What is typed in the price fields right now, for the live suggestions; a row not yet touched reads its saved values.
  const [typed, setTyped] = useState<Record<string, Record<string, string>>>({});
  useEffect(() => {
    if (!state?.saved) return;
    setDirty((d) => new Set([...d].filter((id) => !sent.current.includes(id))));
    setLastSave({ at: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }), count: sent.current.length });
  }, [state]);
  useEffect(() => {
    if (dirty.size === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const shown = viewPrices(rows, { price, stock, categories, types, lokasyon: places, q }, sorts);
  const shownIds = new Set(shown.map((r) => r.id));
  const filtered = price !== "tumu" || stock !== "tumu" || categories.length > 0 || types.length > 0 || places.length > 0 || q !== "";
  const editing = editor && rows.find((r) => r.id === editor.product.id);

  // Suggestions show only when alış and satış are in the same currency; there is no rate to convert with here.
  function suggestions(row: PriceRow) {
    const now = { alis: row.purchasePrice, alisPara: row.purchaseCurrency, satisPara: row.saleCurrency, ...saved(row), ...typed[row.id] };
    const same = now.alisPara === now.satisPara;
    return { now, hints: tiers.map((tier) => (same ? suggest(now.alis, tier) : "")) };
  }

  // Writes the suggestion into every empty A/B/C field of the row; the user still saves with Kaydet.
  function fillSuggestions(row: PriceRow) {
    const { now, hints } = suggestions(row);
    const next: Record<string, string> = {};
    tiers.forEach((tier, i) => {
      const input = formRef.current?.elements.namedItem(`${tier.field}:${row.id}`) as HTMLInputElement | null;
      if (input && !input.value.trim() && hints[i]) input.value = next[tier.field] = hints[i];
    });
    setTyped((t) => ({ ...t, [row.id]: { ...now, ...next } }));
    setDirty((d) => new Set(d).add(row.id));
  }

  function saleCell(row: PriceRow) {
    const { now, hints } = suggestions(row);
    const fillable = !readOnly && tiers.some((tier, i) => hints[i] && !now[tier.field].trim());
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5">
          {tiers.map((tier, i) => (
            <label key={tier.key} className="flex items-center gap-1">
              <TierBadge tier={tier} />
              <Input
                name={`${tier.field}:${row.id}`}
                defaultValue={saved(row)[tier.field]}
                placeholder={hints[i]}
                disabled={readOnly}
                inputMode="decimal"
                aria-label={`${row.code} satış fiyatı ${tier.key} (${tier.name})`}
                className="placeholder:text-muted-foreground/60 w-20 font-normal placeholder:italic"
              />
            </label>
          ))}
          <CurrencySelect name={`satisPara:${row.id}`} defaultValue={row.saleCurrency} disabled={readOnly} label={`${row.code} satış para birimi`} />
        </div>
        {fillable && (
          <Button type="button" variant="link" size="sm" className="h-auto gap-1 p-0 text-xs" onClick={() => fillSuggestions(row)}>
            <Sparkles className="size-3" /> Önerileri yaz
          </Button>
        )}
      </div>
    );
  }

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
        ref={formRef}
        className="flex flex-col gap-3"
        onChange={(event) => {
          const target = event.target as EventTarget & { name?: string; value?: string };
          const match = fieldOf(target.name ?? "");
          if (!match || !fields.includes(match[1])) return;
          const [, field, id] = match;
          setTyped((t) => ({ ...t, [id]: { ...t[id], [field]: target.value ?? "" } }));
          if (!dirty.has(id)) setDirty(new Set(dirty).add(id));
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty.size === 0) return;
          const all = new FormData(event.currentTarget);
          const data = new FormData();
          sent.current = [...dirty];
          for (const id of sent.current) {
            data.append("productId", id);
            for (const field of fields) data.append(`${field}:${id}`, all.get(`${field}:${id}`) ?? "");
          }
          startTransition(() => formAction(data));
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Input value={q} onChange={(e) => void setQ(e.target.value)} placeholder="Kod veya ürün adı ara" aria-label="Ürün ara" className="max-w-xs font-normal" />
          {!readOnly && (
            <Button type="submit" disabled={pending || dirty.size === 0}>
              {pending ? "Kaydediliyor…" : dirty.size > 0 ? `Kaydet (${dirty.size})` : "Kaydet"}
            </Button>
          )}
          {!readOnly && (
            <span role="status" className="text-sm">
              {pending ? null : state?.error && dirty.size > 0 ? (
                <span className="text-destructive">Kaydedilmedi: {state.error}</span>
              ) : dirty.size > 0 ? (
                <span className="text-amber-600">{dirty.size} üründe kaydedilmemiş değişiklik var</span>
              ) : lastSave ? (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <Check className="size-4" /> {lastSave.count} ürün kaydedildi · {lastSave.at}
                </span>
              ) : null}
            </span>
          )}
          <FormStatus state={state} />
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
        <TierLegend />
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
                <TableHead>Satış fiyatı · A / B / C</TableHead>
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
                <TableRow key={row.id} className={shownIds.has(row.id) ? (dirty.has(row.id) ? "bg-amber-50 dark:bg-amber-950/30" : undefined) : "hidden"}>
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
                  <TableCell>{saleCell(row)}</TableCell>
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
