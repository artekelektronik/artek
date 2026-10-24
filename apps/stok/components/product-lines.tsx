"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { unitLabels, type Unit } from "@/lib/quantity";

type PickableProduct = { id: string; code: string; name: string; unit: Unit };

// Imported names hide odd spaces (e.g. NNBSP in "6 A"), so matching ignores spacing and case.
const normalize = (text: string) => text.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("tr");

export function ProductLines({ products, initialRows = 1 }: { products: PickableProduct[]; initialRows?: number }) {
  const [rows, setRows] = useState(() => Array.from({ length: initialRows }, () => crypto.randomUUID()));
  const [picked, setPicked] = useState<Record<string, PickableProduct | undefined>>({});
  // A row matches the full "code — name" from the list, or just the product code.
  const byText = new Map(
    products.flatMap((p) => [
      [normalize(`${p.code} — ${p.name}`), p],
      [normalize(p.code), p],
    ]),
  );

  return (
    <div className="flex flex-col gap-2">
      <datalist id="urun-listesi">
        {products.map((p) => (
          <option key={p.id} value={`${p.code} — ${p.name}`} />
        ))}
      </datalist>
      {rows.map((row, index) => (
        <div key={row} className="flex flex-wrap items-center gap-2">
          <Input
            list="urun-listesi"
            placeholder="Ürün kodu veya adı"
            aria-label={`Ürün ${index + 1}`}
            className="w-96"
            onChange={(event) => {
              const match = byText.get(normalize(event.target.value));
              setPicked((current) => ({ ...current, [row]: match }));
            }}
            required
          />
          <input type="hidden" name="productId" value={picked[row]?.id ?? ""} />
          <Input name="quantity" inputMode="decimal" placeholder="Miktar" aria-label={`Miktar ${index + 1}`} className="w-28" required />
          <span className="text-muted-foreground w-12 text-sm">{picked[row] ? unitLabels[picked[row].unit] : ""}</span>
          {rows.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRows(rows.filter((r) => r !== row))}>
              Kaldır
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setRows([...rows, crypto.randomUUID()])}>
        Satır ekle
      </Button>
    </div>
  );
}
