"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Combobox } from "@/components/combobox";
import type { InvoiceReview } from "@/lib/invoices";
import { unitLabels } from "@/lib/quantity";
import { correctMaterialsAction } from "./actions";
import { decimal } from "./options";

type Row = { key: number; productId: string; quantity: string };

// On a confirmed sale: the materials and hours really used on a line, changed after the fact. Stock follows the change.
export function MaterialsCorrection({ review, line, options }: { review: InvoiceReview; line: InvoiceReview["lines"][number]; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => (line.components ?? []).map((c, key) => ({ key, productId: c.productId, quantity: decimal(c.quantity) })));
  const [hours, setHours] = useState(line.laborHours ? decimal(line.laborHours) : "");
  const [lokasyonId, setLokasyonId] = useState(review.materialsLokasyonId ?? (review.lokasyon.find((l) => /imalat/i.test(l.name)) ?? review.lokasyon[0])?.id ?? "");
  const [error, setError] = useState<string>();
  const [saving, start] = useTransition();
  const unitOf = (id: string) => review.products.find((p) => p.id === id)?.unit;
  const change = (key: number, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <Pencil /> Malzemeleri ve saati düzelt
      </Button>
    );
  }

  const save = () =>
    start(async () => {
      const result = await correctMaterialsAction({
        id: review.id,
        materialsLokasyonId: lokasyonId || null,
        lines: [{ seq: line.seq, components: rows.filter((r) => r.productId).map((r) => ({ productId: r.productId, quantity: r.quantity })), laborHours: hours }],
      });
      if (result?.error) return setError(result.error);
      setOpen(false);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
      <p className="text-muted-foreground text-xs">
        Bu satırın tamamı ({decimal(line.quantity)} {line.unit}) için gerçekte kullanılan malzemeler. Eklenen malzeme stoktan düşer, çıkarılan geri gelir; değişmeyen satıra dokunulmaz.
      </p>
      {rows.map((r, i) => (
        <div key={r.key} className="grid grid-cols-[1fr_7rem_3rem_auto] items-center gap-2">
          <Combobox options={options} value={r.productId} onChange={(productId) => change(r.key, { productId })} placeholder="Malzeme ara" aria-label={`Malzeme ${i + 1}`} className="w-full min-w-0" />
          <Input value={r.quantity} onChange={(e) => change(r.key, { quantity: e.target.value })} inputMode="decimal" placeholder="Miktar" aria-label={`Malzeme ${i + 1} miktarı`} className="tabular-nums" />
          <span className="text-muted-foreground text-xs">{unitOf(r.productId) ? unitLabels[unitOf(r.productId)!] : ""}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Malzemeyi çıkar" onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))}>
            <X />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setRows((list) => [...list, { key: Math.max(-1, ...list.map((r) => r.key)) + 1, productId: "", quantity: "" }])}>
        <Plus /> Malzeme ekle
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`saat-${line.seq}`}>Bu iş için çalışılan saat</Label>
          <Input id={`saat-${line.seq}`} value={hours} onChange={(e) => setHours(e.target.value)} inputMode="decimal" placeholder="Bilinmiyorsa boş bırakın" className="tabular-nums" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Malzemelerin çıktığı Lokasyon</Label>
          <Select value={lokasyonId} onValueChange={setLokasyonId} disabled={Boolean(review.materialsLokasyonId)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lokasyon seçin" />
            </SelectTrigger>
            <SelectContent>
              {review.lokasyon.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={save}>
          Düzeltmeyi kaydet
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
