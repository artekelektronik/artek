"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { FormStatus } from "@/components/form-status";
import type { ActionState } from "@/lib/action-result";
import { savePricesAction } from "./actions";

export type PriceRow = {
  id: string;
  code: string;
  name: string;
  stock: string;
  purchasePrice: string;
  purchaseCurrency: string;
  salePrice: string;
  saleCurrency: string;
};

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

export function PricesForm({ rows, readOnly }: { rows: PriceRow[]; readOnly: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePricesAction, undefined);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("tr");
  const matches = (row: PriceRow) => !query || `${row.code} ${row.name}`.toLocaleLowerCase("tr").includes(query);

  return (
    // Not <form action>: React would clear what was typed when a line has an error.
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kod veya ürün adı ara" aria-label="Ürün ara" className="max-w-xs font-normal" />
        {!readOnly && (
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        )}
        <FormStatus state={state} saved="Kaydedildi." />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ürün</TableHead>
            <TableHead className="text-right">Stok</TableHead>
            <TableHead>Alış fiyatı</TableHead>
            <TableHead>Satış fiyatı</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            // Hidden, not removed: a search must not drop what was typed in other rows.
            <TableRow key={row.id} className={matches(row) ? undefined : "hidden"}>
              <TableCell className="max-w-72 truncate">
                <input type="hidden" name="productId" value={row.id} />
                <span className="font-mono">{row.code}</span> {row.name}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.stock}</TableCell>
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
    </form>
  );
}
