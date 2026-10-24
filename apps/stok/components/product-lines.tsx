"use client";

import { useState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Combobox } from "@/components/combobox";
import { unitLabels, type Unit } from "@/lib/quantity";

type PickableProduct = { id: string; code: string; name: string; unit: Unit };

export function ProductLines({ products, initialRows = 1 }: { products: PickableProduct[]; initialRows?: number }) {
  const [rows, setRows] = useState(() => Array.from({ length: initialRows }, () => crypto.randomUUID()));
  const [picked, setPicked] = useState<Record<string, PickableProduct | undefined>>({});
  const options = products.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={row} className="flex flex-wrap items-center gap-2">
          <Combobox
            options={options}
            value={picked[row]?.id ?? ""}
            onChange={(id) => setPicked((current) => ({ ...current, [row]: products.find((p) => p.id === id) }))}
            placeholder="Ürün kodu veya adı"
            aria-label={`Ürün ${index + 1}`}
            className="w-96"
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
