"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { day, usd } from "@/lib/finance-calc";
import { unitLabels } from "@/lib/quantity";
import type { QuoteOptions } from "@/lib/quote";
import { laborPerUnit, minutesPerUnit, priceAt, profitPctOf, unitCost } from "@/lib/quote-calc";
import { deleteQuoteAction, saveHourlyRateAction, saveQuoteAction, saveStandardAction } from "./actions";

type Saved = QuoteOptions["quotes"][number];
type Material = { key: number; productId: string; quantity: string };
type Props = QuoteOptions & { open: Saved | null; canEdit: boolean };

const money = (v: number) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const typed = (v: number) => v.toLocaleString("tr-TR", { useGrouping: false, maximumFractionDigits: 2 });
const steps = [20, 30, 40, 50, 60];
const path = "/finans/fiyat-hesapla";

export function QuoteForm({ products, recipes, labor: usual, hourlyRate, rates, quotes, open, canEdit }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(open?.title ?? "");
  const [customer, setCustomer] = useState(open?.customer ?? "");
  const [note, setNote] = useState(open?.note ?? "");
  const [trafoId, setTrafoId] = useState(open?.productId ?? "");
  const [materials, setMaterials] = useState<Material[]>(open?.materials.length ? open.materials.map((m, key) => ({ key, ...m })) : [{ key: 0, productId: "", quantity: "" }]);
  const [count, setCount] = useState(open?.quantity ?? "1");
  const [rate, setRate] = useState(hourlyRate ? typed(hourlyRate) : "");
  // Time is typed per unit or for the whole job; the other follows. Same for kâr % and sale price below.
  const [time, setTime] = useState<{ field: "minutes" | "hours"; text: string }>({ field: "minutes", text: open?.laborMinutes ?? "" });
  const [edited, setEdited] = useState<{ field: "pct" | "price"; text: string }>(
    open?.unitPrice ? { field: "price", text: open.unitPrice } : { field: "pct", text: open?.profitPct ?? "40" },
  );
  const [state, setState] = useState<ActionState>();
  const [busy, start] = useTransition();

  const byId = new Map(products.map((p) => [p.id, p]));
  const options = products.map((p) => ({ value: p.id, label: `${p.name} · ${p.code}` }));
  const picked = materials.filter((m) => m.productId);
  const units = Math.max(decimalValue(count) || 0, 0);
  const hourly = decimalValue(rate) || 0;
  const minutes = time.field === "minutes" ? decimalValue(time.text) || 0 : (minutesPerUnit(decimalValue(time.text) || 0, units) ?? 0);
  const cost = unitCost(
    picked.map((m) => ({ quantity: normalizeDecimal(m.quantity) ?? "0", price: byId.get(m.productId)!.price, currency: byId.get(m.productId)!.currency })),
    (minutes / 60) * hourly,
    rates,
  );
  const pct = edited.field === "pct" ? decimalValue(edited.text) : profitPctOf(cost.total, decimalValue(edited.text));
  const price = edited.field === "price" ? decimalValue(edited.text) : priceAt(cost.total, pct ?? NaN);
  const ready = cost.total > 0 && Number.isFinite(price) && pct !== null && Number.isFinite(pct);

  const pickTrafo = (id: string) => {
    setTrafoId(id);
    const recipe = recipes[id];
    if (recipe) setMaterials(recipe.map((r, key) => ({ key, ...r })));
    const known = usual[id];
    // A flat TL saved before minutes existed becomes the minutes that cost as much at today's Saat ücreti.
    const perUnit = known?.minutes != null ? Number(known.minutes) : known && hourly ? (laborPerUnit(known, hourly) / hourly) * 60 : null;
    if (perUnit !== null) setTime({ field: "minutes", text: typed(perUnit) });
  };
  const change = (key: number, patch: Partial<Material>) => setMaterials((list) => list.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const run = (work: () => Promise<ActionState>) => start(async () => setState(await work()));
  const materialsInput = picked.map((m) => ({ productId: m.productId, quantity: m.quantity }));
  const minutesText = minutes ? typed(minutes) : "";

  const save = (asCopy: boolean) =>
    start(async () => {
      const result = await saveQuoteAction({
        id: asCopy ? null : (open?.id ?? null),
        title: asCopy && open && title === open.title ? `${title} (kopya)` : title,
        customer,
        productId: trafoId || null,
        quantity: count,
        materials: materialsInput,
        laborMinutes: minutesText,
        profitPct: edited.field === "pct" ? edited.text : "",
        unitPrice: edited.field === "price" ? edited.text : "",
        note,
      });
      setState(result);
      if (result?.id && result.id !== open?.id) router.push(`${path}?calisma=${result.id}`);
    });

  return (
    <div className="flex flex-col gap-6">
      {quotes.length > 0 && (
        <PanelCard title="Kayıtlı çalışmalar" note="Açıp değiştirin ya da benzer bir iş için kopyalayın.">
          <ul className="flex flex-col divide-y text-sm">
            {quotes.map((q) => (
              <li key={q.id} className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2", q.id === open?.id && "font-medium")}>
                <Link href={`${path}?calisma=${q.id}`} className="underline-offset-4 hover:underline">
                  {q.title}
                </Link>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {[q.customer, `${q.quantity} adet`, day(q.updatedOn)].filter(Boolean).join(" · ")}
                  {q.id === open?.id && " · açık"}
                </span>
              </li>
            ))}
          </ul>
          {open && (
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href={path}>
                <Plus /> Yeni çalışma
              </Link>
            </Button>
          )}
        </PanelCard>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <PanelCard title="1. İş" note="Daha önce yapılmış bir trafoyu seçerseniz reçetesi ve süresi başlangıç olarak gelir; bu iş için istediğiniz gibi değiştirin.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ad">Çalışmanın adı</Label>
                <Input id="ad" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. EF 20 trafo, 12 V" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="musteri">Müşteri</Label>
                <Input id="musteri" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="İsteğe bağlı" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <div className="flex flex-col gap-1.5">
                <Label>Benzer trafo</Label>
                <Combobox options={options} value={trafoId} onChange={pickTrafo} placeholder="Trafo ara (isteğe bağlı)" className="w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adet">Adet</Label>
                <Input id="adet" value={count} onChange={(e) => setCount(e.target.value)} inputMode="decimal" className="tabular-nums" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="not">Not</Label>
              <Input id="not" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Müşterinin özel isteği, tel çapı, sarım sayısı…" />
            </div>
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

          <PanelCard title="3. İşçilik" note="Süreyi 1 adet için dakika ya da tüm iş için saat olarak yazın; diğeri kendiliğinden hesaplanır. İşçilik = süre × saat ücreti. Maaşlar Giderler'de ayrıca durur.">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dakika">1 adet için dakika</Label>
                <Input id="dakika" value={time.field === "minutes" ? time.text : minutesText} onChange={(e) => setTime({ field: "minutes", text: e.target.value })} inputMode="decimal" placeholder="0" className="tabular-nums" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="saat">Tüm iş için saat</Label>
                <Input
                  id="saat"
                  value={time.field === "hours" ? time.text : minutes && units ? typed((minutes * units) / 60) : ""}
                  onChange={(e) => setTime({ field: "hours", text: e.target.value })}
                  inputMode="decimal"
                  placeholder="0"
                  className="tabular-nums"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ucret">Saat ücreti (TL)</Label>
                <div className="flex gap-2">
                  <Input id="ucret" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" placeholder="0" className="tabular-nums" />
                  {canEdit && hourly !== hourlyRate && hourly > 0 && (
                    <Button type="button" variant="outline" size="sm" disabled={busy} className="h-9" title="Herkes ve bütün trafolar için geçerli olur" onClick={() => run(() => saveHourlyRateAction(rate))}>
                      Kaydet
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {!hourly && <p className="text-xs text-amber-700 dark:text-amber-400">Saat ücreti girilmedi; işçilik 0 sayılıyor.</p>}
          </PanelCard>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" disabled={busy} onClick={() => save(false)}>
                {open ? "Değişiklikleri kaydet" : "Çalışmayı kaydet"}
              </Button>
              {open && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => save(true)}>
                  Kopya olarak kaydet
                </Button>
              )}
              {trafoId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  title="Sonraki faturada ve çalışmada bu malzemeler ve süre başlangıç olarak gelir"
                  onClick={() => run(() => saveStandardAction({ productId: trafoId, materials: materialsInput, laborMinutes: minutesText }))}
                >
                  Bu trafonun reçetesi yap
                </Button>
              )}
              {open && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busy}
                  onClick={() =>
                    window.confirm(`“${open.title}” silinsin mi?`) &&
                    start(async () => {
                      await deleteQuoteAction(open.id);
                      router.push(path);
                    })
                  }
                >
                  Sil
                </Button>
              )}
              {state && (
                <span role="status" className={cn("text-xs", state.error ? "text-destructive" : "text-muted-foreground")}>
                  {state.error ?? state.message}
                </span>
              )}
            </div>
          )}
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
              <Input id="kar" value={edited.field === "pct" ? edited.text : ready ? typed(pct!) : ""} onChange={(e) => setEdited({ field: "pct", text: e.target.value })} inputMode="decimal" className="tabular-nums" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fiyat">Satış fiyatı (TL, 1 adet)</Label>
              <Input id="fiyat" value={edited.field === "price" ? edited.text : ready ? typed(price) : ""} onChange={(e) => setEdited({ field: "price", text: e.target.value })} inputMode="decimal" className="tabular-nums" />
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
    </div>
  );
}
