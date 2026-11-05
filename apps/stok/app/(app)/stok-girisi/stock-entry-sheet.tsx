"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { EditStock } from "@/components/edit-stock";
import { FormSelect } from "@/components/form-select";
import { ProductImage } from "@/components/product-image";
import { QuickAddProduct } from "@/components/quick-add-product";
import { SortBar, type SortField } from "@/components/sort-bar";
import { displayQuantity, lokasyonPurpose } from "@/lib/labels";
import { addQuantities, unitLabels } from "@/lib/quantity";
import { sortRows, type Sort } from "@/lib/sorting";
import type { StockEntrySheet as Sheet } from "@/lib/stock-entry";
import { saveStockEntryAction } from "./actions";

type Row = Sheet["rows"][number];

const sortFields: SortField[] = [
  { id: "ad", label: "Ürün adı", kind: "text" },
  { id: "kod", label: "Kod", kind: "text" },
  { id: "kategori", label: "Kategori", kind: "text" },
  { id: "stok", label: "Stok", kind: "number" },
];

const types = [
  { value: "malzeme", label: "Malzeme" },
  { value: "ticari", label: "Ticari mal" },
];

export function StockEntrySheet({
  sheet,
  categories,
  initialQuery,
  canAddProduct,
}: {
  sheet: Sheet;
  categories: string[];
  initialQuery: string;
  canAddProduct: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [onlyFilled, setOnlyFilled] = useState(false);
  const [sorts, setSorts] = useState<Sort[]>([]);

  const search = query.trim().toLocaleLowerCase("tr");
  const filtered = sheet.rows.filter(
    (r) =>
      (!search || `${r.code} ${r.name} ${r.manufacturerCode ?? ""}`.toLocaleLowerCase("tr").includes(search)) &&
      (!type || (type === "malzeme" ? r.isMaterial : r.isTradeGoods)) &&
      (!category || r.category === category) &&
      (!onlyFilled || Object.values(r.cells).some((c) => c.entered !== null || c.current !== "0")),
  );
  const rows = sortRows(filtered, sorts, (r, id) =>
    id === "stok" ? Object.values(r.cells).reduce((sum, c) => sum + Number(c.current), 0) : id === "ad" ? r.name : id === "kod" ? r.code : r.category,
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı veya kodu" className="w-64" aria-label="Ürün ara" />
        <FormSelect name="tur" options={types} empty="Tüm türler" onValueChange={setType} aria-label="Tür" />
        <FormSelect name="kategori" options={categories.map((c) => ({ value: c, label: c }))} empty="Tüm kategoriler" onValueChange={setCategory} aria-label="Kategori" />
        <Label className="font-normal">
          <Checkbox checked={onlyFilled} onCheckedChange={(checked) => setOnlyFilled(checked === true)} />
          Yalnızca stoku veya girişi olanlar
        </Label>
        <span className="text-muted-foreground text-sm">{rows.length} ürün</span>
      </div>
      <SortBar fields={sortFields} sorts={sorts} onChange={setSorts} />

      {canAddProduct && <QuickAddProduct categories={categories} onAdded={setQuery} />}

      <div className="max-h-[70vh] overflow-auto rounded-lg border [&_[data-slot=table-container]]:overflow-visible">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            <TableRow>
              <TableHead>Ürün</TableHead>
              {sheet.lokasyon.map((l) => (
                <TableHead key={l.id} className="h-auto py-2">
                  <div>{l.name}</div>
                  <div className="text-muted-foreground text-xs font-normal">{lokasyonPurpose[l.name]}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <ProductImage path={row.images[0]} alt={row.name} className="size-14" />
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {[row.manufacturerCode, row.category, row.code, unitLabels[row.unit]].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {sheet.lokasyon.map((l) => (
                  <TableCell key={l.id} className="align-top">
                    <EntryCell key={l.round} row={row} lokasyon={l} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// Saves when the cursor leaves the cell; Enter moves down the column, like a spreadsheet.
function EntryCell({ row, lokasyon }: { row: Row; lokasyon: Sheet["lokasyon"][number] }) {
  const { current, entered } = row.cells[lokasyon.id];
  const initial = entered === null ? "" : displayQuantity(entered);
  const lastSaved = useRef(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string>();

  async function save(value: string) {
    if (value.trim() === lastSaved.current) return;
    setStatus("saving");
    setError(undefined);
    const result = await saveStockEntryAction({ productId: row.id, lokasyonId: lokasyon.id, counted: value });
    if (result?.error) {
      setStatus("idle");
      setError(result.error);
      toast.error(`${row.code} ${lokasyon.name}: ${result.error}`);
      return;
    }
    lastSaved.current = value.trim();
    setStatus("saved");
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          defaultValue={initial}
          placeholder={current !== "0" ? "+ ekle" : undefined}
          inputMode="decimal"
          data-column={lokasyon.id}
          aria-label={`${row.code} ${lokasyon.name} miktarı`}
          aria-invalid={error ? true : undefined}
          className="h-8 w-24"
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const column = [...document.querySelectorAll<HTMLInputElement>(`input[data-column="${lokasyon.id}"]`)];
            const next = column[column.indexOf(e.currentTarget) + 1];
            if (next) next.focus();
            else e.currentTarget.blur();
          }}
        />
        {status === "saved" && <Check className="text-muted-foreground size-4" aria-label="Kaydedildi" />}
        {status === "saving" && <span className="text-muted-foreground text-xs">…</span>}
      </div>
      {(current !== "0" || lokasyon.canCorrect) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Stokta: {displayQuantity(current)}</span>
          {lokasyon.canCorrect && <EditStock productId={row.id} lokasyonId={lokasyon.id} label={`${row.code} ${lokasyon.name}`} current={current} />}
        </div>
      )}
      {entered !== null && (
        <span className="text-xs font-medium">
          {current !== "0"
            ? `Onaylanınca ${displayQuantity(current)} + ${displayQuantity(entered)} = ${displayQuantity(addQuantities(current, entered))}`
            : "Onay bekliyor"}
        </span>
      )}
    </div>
  );
}
