"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Slider } from "@artek/ui/components/slider";
import { cn } from "@artek/ui/lib/utils";
import { Combobox } from "@/components/combobox";
import { PanelCard } from "@/components/panel";
import type { ActionState } from "@/lib/action-result";
import { decimalValue, normalizeDecimal } from "@/lib/decimal";
import type { Rates } from "@/lib/exchange-rates";
import { usd } from "@/lib/finance-calc";
import { unitLabels, type Unit } from "@/lib/quantity";
import { priceAt, profitPctOf, unitCost } from "@/lib/quote-calc";
import type { Currency } from "@/lib/stock-value";
import { saveLaborAction } from "./actions";

type Product = { id: string; code: string; name: string; unit: Unit; price: string | null; currency: Currency | null };
type Material = { key: number; productId: string; quantity: string };
type Props = { products: Product[]; recipes: Record<string, { productId: string; quantity: string }[]>; labor: Record<string, string>; rates: Rates | null; canEdit: boolean };

const money = (v: number) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const typed = (v: number) => v.toLocaleString("tr-TR", { useGrouping: false, maximumFractionDigits: 2 });
const steps = [20, 30, 40, 50, 60];

export function QuoteForm({ products, recipes, labor: savedLabor, rates, canEdit }: Props) {
  const [trafoId, setTrafoId] = useState("");
  const [materials, setMaterials] = useState<Material[]>([{ key: 0, productId: "", quantity: "" }]);
  const [labor, setLabor] = useState("");
  const [count, setCount] = useState("1");
  // The field typed last is kept as typed; the other one follows from it. %40 is only where it starts.
  const [edited, setEdited] = useState<{ field: "pct" | "price"; text: string }>({ field: "pct", text: "40" });
  const [state, setState] = useState<ActionState>();
  const [saving, startSaving] = useTransition();

  const byId = new Map(products.map((p) => [p.id, p]));
  const options = products.map((p) => ({ value: p.id, label: `${p.name} · ${p.code}` }));
  const picked = materials.filter((m) => m.productId);
  const cost = unitCost(
    picked.map((m) => ({ quantity: normalizeDecimal(m.quantity) ?? "0", price: byId.get(m.productId)!.price, currency: byId.get(m.productId)!.currency })),
    decimalValue(labor) || 0,
    rates,
  );
  const pct = edited.field === "pct" ? decimalValue(edited.text) : profitPctOf(cost.total, decimalValue(edited.text));
  const price = edited.field === "price" ? decimalValue(edited.text) : priceAt(cost.total, pct ?? NaN);
  const ready = cost.total > 0 && Number.isFinite(price) && pct !== null && Number.isFinite(pct);
  const units = Math.max(decimalValue(count) || 0, 0);

  const pickTrafo = (id: string) => {
    setTrafoId(id);
    setState(undefined);
    setLabor(savedLabor[id] ?? "");
    const recipe = recipes[id];
    if (recipe) setMaterials(recipe.map((r, key) => ({ key, ...r })));
  };
  const change = (key: number, patch: Partial<Material>) => setMaterials((list) => list.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-6">
        <PanelCard title="1. Trafo" note="Daha önce yapılmış bir trafoyu seçerseniz reçetesi ve işçiliği kendiliğinden gelir. Yeni bir trafoysa boş bırakıp malzemeleri elle ekleyin.">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="flex flex-col gap-1.5">
              <Label>Ürün</Label>
              <Combobox options={options} value={trafoId} onChange={pickTrafo} placeholder="Trafo ara (isteğe bağlı)" className="w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adet">Adet</Label>
              <Input id="adet" value={count} onChange={(e) => setCount(e.target.value)} inputMode="decimal" className="tabular-nums" />
            </div>
          </div>
          {trafoId && !recipes[trafoId] && <p className="text-muted-foreground text-xs">Bu ürünün kayıtlı reçetesi yok; malzemeleri aşağıya ekleyin.</p>}
        </PanelCard>

        <PanelCard title="2. Malzemeler (1 adet için)" note="Bakır tel gibi kg ile tutulan malzemede miktarı kg yazın: 15 gram = 0,015.">
          {materials.map((m, i) => {
            const p = byId.get(m.productId);
            const line = p ? cost.costs[picked.indexOf(m)] : undefined;
            return (
              <div key={m.key} className="grid grid-cols-[1fr_6rem_auto] items-center gap-2 md:grid-cols-[1fr_6rem_3rem_7rem_auto]">
                <Combobox options={options} value={m.productId} onChange={(productId) => change(m.key, { productId })} placeholder="Malzeme ara" aria-label={`Malzeme ${i + 1}`} className="w-full min-w-0" />
                <Input value={m.quantity} onChange={(e) => change(m.key, { quantity: e.target.value })} inputMode="decimal" placeholder="Miktar" aria-label={`Malzeme ${i + 1} miktarı`} className="tabular-nums" />
                <span className="text-muted-foreground hidden text-xs md:block">{p ? unitLabels[p.unit] : ""}</span>
                <span className={cn("hidden text-right text-sm tabular-nums md:block", line === null && "text-amber-700 dark:text-amber-400")}>
                  {line === undefined ? "" : line === null ? "Fiyat yok" : money(line)}
                </span>
                <Button type="button" variant="ghost" size="icon" aria-label="Malzemeyi çıkar" onClick={() => setMaterials((list) => list.filter((x) => x.key !== m.key))}>
                  <X />
                </Button>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setMaterials((list) => [...list, { key: Math.max(-1, ...list.map((m) => m.key)) + 1, productId: "", quantity: "" }])}
          >
            <Plus /> Malzeme ekle
          </Button>
          {cost.missing > 0 && (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
              {cost.missing} malzemenin alış fiyatı {rates ? "yok" : "yok ya da kur alınamadı"}; maliyete katılmadı, sonuç eksik.{" "}
              <Link href="/finans/fiyatlar" className="underline underline-offset-4">
                Fiyatlar
              </Link>
            </p>
          )}
        </PanelCard>

        <PanelCard title="3. İşçilik (1 adet için, TL)" note="Kaba hesap: üretimdeki kişinin aylık maliyeti ÷ ayda sarılan trafo sayısı. Maaşlar Giderler'de ayrıca durur; bu tutar yalnızca fiyat verirken kullanılır.">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={labor} onChange={(e) => setLabor(e.target.value)} inputMode="decimal" placeholder="0" aria-label="İşçilik" className="w-32 tabular-nums" />
            {canEdit && trafoId && (
              <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => startSaving(async () => setState(await saveLaborAction(trafoId, labor)))}>
                Bu trafo için kaydet
              </Button>
            )}
            {state && (
              <span role="status" className={cn("text-xs", state.error ? "text-destructive" : "text-muted-foreground")}>
                {state.error ?? state.message}
              </span>
            )}
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Fiyat ve kâr" className="xl:sticky xl:top-6" note="Kâr oranını ya da satış fiyatını değiştirin; diğeri kendiliğinden hesaplanır.">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
          <dt className="text-muted-foreground">Malzeme</dt>
          <dd className="text-right">{money(cost.material)}</dd>
          <dt className="text-muted-foreground">İşçilik</dt>
          <dd className="text-right">{money(cost.labor)}</dd>
          <dt className="font-medium">1 adet maliyet</dt>
          <dd className="text-right font-medium">{money(cost.total)}</dd>
        </dl>

        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kar">Kâr (%)</Label>
            <Input
              id="kar"
              value={edited.field === "pct" ? edited.text : ready ? typed(pct!) : ""}
              onChange={(e) => setEdited({ field: "pct", text: e.target.value })}
              inputMode="decimal"
              className="tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fiyat">Satış fiyatı (TL, 1 adet)</Label>
            <Input
              id="fiyat"
              value={edited.field === "price" ? edited.text : ready ? typed(price) : ""}
              onChange={(e) => setEdited({ field: "price", text: e.target.value })}
              inputMode="decimal"
              className="tabular-nums"
            />
          </div>
        </div>
        <Slider aria-label="Kâr oranı" min={0} max={150} step={1} value={[ready ? Math.min(Math.max(pct!, 0), 150) : 0]} onValueChange={([v]) => setEdited({ field: "pct", text: String(v) })} />

        {ready ? (
          <>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t pt-3 text-sm tabular-nums">
              <dt className="text-muted-foreground">1 adet satış</dt>
              <dd className="text-right">
                {money(price)}
                {rates && <span className="text-muted-foreground"> · {usd(price / rates.USD)}</span>}
              </dd>
              <dt className="text-muted-foreground">1 adet kâr</dt>
              <dd className={cn("text-right", price < cost.total && "text-destructive")}>{money(price - cost.total)}</dd>
              <dt className="text-muted-foreground">Toplam satış ({typed(units)} adet)</dt>
              <dd className="text-right">{money(price * units)}</dd>
              <dt className="text-muted-foreground">Toplam maliyet</dt>
              <dd className="text-right">{money(cost.total * units)}</dd>
              <dt className="font-medium">Toplam kâr</dt>
              <dd className={cn("text-right text-lg font-semibold", price < cost.total && "text-destructive")}>{money((price - cost.total) * units)}</dd>
            </dl>
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-1 text-xs">Karşılaştır (tıklayınca seçilir)</p>
              <table className="w-full text-sm tabular-nums">
                <thead className="text-muted-foreground text-xs">
                  <tr>
                    <th className="py-1 text-left font-normal">Kâr</th>
                    <th className="py-1 text-right font-normal">1 adet fiyat</th>
                    <th className="py-1 text-right font-normal">Toplam kâr</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s) => (
                    <tr key={s} onClick={() => setEdited({ field: "pct", text: String(s) })} className={cn("hover:bg-muted/60 cursor-pointer border-t", Math.round(pct!) === s && "bg-muted font-medium")}>
                      <td className="py-1.5">%{s}</td>
                      <td className="py-1.5 text-right">{money(priceAt(cost.total, s))}</td>
                      <td className="py-1.5 text-right">{money((priceAt(cost.total, s) - cost.total) * units)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground border-t pt-3 text-sm">Malzeme ya da işçilik girince fiyat burada görünür.</p>
        )}
        <p className="text-muted-foreground text-xs">
          KDV hariç. {rates ? `Kur: 1 USD = ${rates.USD.toLocaleString("tr-TR")} TL (TCMB, ${rates.date}).` : "TCMB kuru alınamadı; yalnızca TL fiyatlı malzemeler sayıldı."}
        </p>
      </PanelCard>
    </div>
  );
}
