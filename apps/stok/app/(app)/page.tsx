import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, ArrowRight, CircleCheck, CircleDashed } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@artek/ui/components/alert";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { getDashboard, getStockSummary } from "@/lib/dashboard";
import { financeSummary, tl, tlShort, day } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels, type Unit } from "@/lib/quantity";
import { getWeekStockOuts, perUnitText } from "@/lib/stock-out-report";
import { addDays, formatIstanbulTime, istanbulDate } from "@/lib/time";

export const metadata = { title: "Ana sayfa | Artek" };

const count = (value: string) => Number(value).toLocaleString("tr-TR");

// Adet and kg can't be added together: "12.300 adet · 40 kg".
function perUnit(lines: { unit: Unit; value: string }[]) {
  const shown = lines.filter((l) => Number(l.value) !== 0).map((l) => `${count(l.value)} ${unitLabels[l.unit]}`);
  return shown.length ? shown.join(" · ") : "—";
}

// A category with no price at all shows no value, not "0 TL".
const value = (amount: number, counted: number) => (counted ? tlShort(amount) : "—");

function StatCard({ label, value: shown, note, href }: { label: string; value: string; note: string; href: string }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{shown}</CardTitle>
      </CardHeader>
      <CardFooter className="text-muted-foreground text-sm">
        <Link href={href} className="hover:text-foreground underline-offset-4 hover:underline">
          {note}
        </Link>
      </CardFooter>
    </Card>
  );
}

function Warning({ tone, text, href, action }: { tone: "danger" | "quiet"; text: string; href: string; action: string }) {
  const Icon = tone === "danger" ? AlertTriangle : CircleDashed;
  return (
    <li className="flex items-start gap-3 py-2.5 text-sm">
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone === "danger" ? "text-destructive" : "text-muted-foreground"}`} />
      <span className="min-w-0 flex-1">{text}</span>
      <Link href={href} className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 underline-offset-4 hover:underline">
        {action} <ArrowRight className="size-3.5" />
      </Link>
    </li>
  );
}

export default async function HomePage() {
  await connection();
  const requestHeaders = await headers();
  const [actor, d, s, week] = await Promise.all([
    loadActor(requestHeaders),
    getDashboard(requestHeaders),
    getStockSummary(requestHeaders),
    getWeekStockOuts(requestHeaders),
  ]);
  const sales = s.finance ? await financeSummary(requestHeaders, "finance.view") : null;
  const now = new Date();
  const notOpened = d.lokasyon.filter((l) => !l.openedAt);
  const firstName = actor.name.split(" ")[0];

  const thisMonth = istanbulDate(now).slice(0, 7);
  const lastMonth = addDays(`${thisMonth}-01`, -1).slice(0, 7);
  const salesIn = (month: string) => sales?.monthly.find((m) => m.month === month)?.sales ?? 0;

  const o = s.overall;
  const worst = d.belowMinimum?.[0];
  const hasWarnings = Boolean(worst || d.noMinimumCount);
  const hasTransit = o.units.some((u) => Number(u.inTransit) !== 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Hoş geldiniz{firstName ? `, ${firstName}` : ""}</h1>
        <p className="text-muted-foreground text-sm">
          <time dateTime={now.toISOString()}>{formatIstanbulTime(now)}</time> · İstanbul
        </p>
      </div>

      {notOpened.length > 0 && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Açılış sayımı bekleniyor</AlertTitle>
          <AlertDescription>
            <p>
              {notOpened.map((l) => l.name).join(" ve ")} henüz açılmadı; açılış sayımı onaylanana kadar bu Lokasyonda stok hareketi
              kaydedilemez.
            </p>
            <Link href="/stok-girisi" className="text-foreground font-medium underline underline-offset-4">
              Stok girişine git
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {d.belowMinimum && (
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>Bugün bakılacaklar</CardTitle>
          </CardHeader>
          <CardContent>
            {hasWarnings ? (
              <ul className="divide-y">
                {worst && (
                  <Warning
                    tone="danger"
                    text={`${d.belowMinimum.length} ürün kritik seviyenin altında. En acili: ${worst.code} ${worst.name}, ${displayQuantity(worst.total)} ${unitLabels[worst.unit]} kaldı (sınır ${displayQuantity(worst.minLevel)}).`}
                    href="/stok-durumu?kritik=1"
                    action="Listeye git"
                  />
                )}
                {Boolean(d.noMinimumCount) && (
                  <Warning
                    tone="quiet"
                    text={`${d.noMinimumCount} üründe kritik seviye girilmemiş; bu ürünler azalınca uyarı gelmez.`}
                    href="/stok-durumu?kritik=yok"
                    action="Ürünleri göster"
                  />
                )}
              </ul>
            ) : (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <CircleCheck className="size-4 text-green-700 dark:text-green-400" /> Bakılacak bir uyarı yok.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s.finance && (
          <>
            <StatCard label="Stok değeri (alış fiyatıyla)" value={value(o.purchase, o.purchaseCounted)} note={`${o.purchaseCounted} / ${o.products} ürünün fiyatı girili`} href="/finans/fiyatlar" />
            <StatCard
              label="Stok değeri (satış fiyatıyla)"
              value={value(o.sale, o.saleCounted)}
              note={o.marginCounted ? `Beklenen kâr: ${tlShort(o.margin)} (${o.marginCounted} ürün)` : `${o.saleCounted} / ${o.products} ürünün fiyatı girili`}
              href="/finans/fiyatlar"
            />
            <StatCard
              label="Bu ay satış"
              value={tlShort(salesIn(thisMonth))}
              note={`Geçen ay: ${tlShort(salesIn(lastMonth))}${sales?.asOf ? ` · Son fatura ${day(sales.asOf)}` : ""}`}
              href="/finans"
            />
          </>
        )}
        <StatCard
          label="Stoktaki ürün"
          value={`${o.products.toLocaleString("tr-TR")} çeşit`}
          note={perUnit(o.units.map((u) => ({ unit: u.unit, value: u.total })))}
          href="/stok-durumu"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok özeti</CardTitle>
          {s.finance && (
            <CardDescription>
              {s.rates
                ? `Kur: 1 USD = ${s.rates.USD.toLocaleString("tr-TR")} TL, 1 EUR = ${s.rates.EUR.toLocaleString("tr-TR")} TL (TCMB döviz satış, ${s.rates.date})`
                : "TCMB kuru şu an alınamadı; değerlerde yalnızca TL fiyatlı ürünler sayıldı."}
            </CardDescription>
          )}
          <CardAction>
            <Link href="/stok-durumu" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
              Tüm ürünler
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {s.categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz stok yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Çeşit</TableHead>
                  {s.lokasyon.map((l) => (
                    <TableHead key={l.id} className="text-right">
                      {l.name}
                    </TableHead>
                  ))}
                  {hasTransit && <TableHead className="text-right">Yolda</TableHead>}
                  {s.finance && <TableHead className="text-right">Alış değeri</TableHead>}
                  {s.finance && <TableHead className="text-right">Satış değeri</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.categories.map((c) => (
                  <TableRow key={c.category}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.products}</TableCell>
                    {s.lokasyon.map((l) => (
                      <TableCell key={l.id} className="text-right tabular-nums">
                        {perUnit(c.units.map((u) => ({ unit: u.unit, value: u.physical[l.id] })))}
                      </TableCell>
                    ))}
                    {hasTransit && <TableCell className="text-right tabular-nums">{perUnit(c.units.map((u) => ({ unit: u.unit, value: u.inTransit })))}</TableCell>}
                    {s.finance && <TableCell className="text-right tabular-nums">{value(c.purchase, c.purchaseCounted)}</TableCell>}
                    {s.finance && <TableCell className="text-right tabular-nums">{value(c.sale, c.saleCounted)}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Toplam</TableCell>
                  <TableCell className="text-right tabular-nums">{o.products}</TableCell>
                  {s.lokasyon.map((l) => (
                    <TableCell key={l.id} className="text-right tabular-nums">
                      {perUnit(o.units.map((u) => ({ unit: u.unit, value: u.physical[l.id] })))}
                    </TableCell>
                  ))}
                  {hasTransit && <TableCell className="text-right tabular-nums">{perUnit(o.units.map((u) => ({ unit: u.unit, value: u.inTransit })))}</TableCell>}
                  {s.finance && <TableCell className="text-right tabular-nums">{value(o.purchase, o.purchaseCounted)}</TableCell>}
                  {s.finance && <TableCell className="text-right tabular-nums">{value(o.sale, o.saleCounted)}</TableCell>}
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bu hafta çıkışlar</CardTitle>
          <CardDescription>
            {day(week.from)} pazartesiden beri {week.summary.exits.length} kayıt
            {week.summary.corrections.length > 0 && ` · düzeltme veya sayımla azalan ${week.summary.corrections.length} kayıt ayrıca`}
          </CardDescription>
          <CardAction>
            <Link href="/stok-cikisi" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
              Tümü
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {week.summary.byType.map((t) => (
              <div key={t.type} className="rounded-lg border p-3">
                <p className="text-muted-foreground text-sm">{movementTypeLabels[t.type]}</p>
                <p className="font-medium tabular-nums">{perUnitText(t.units)}</p>
                {week.finance && t.type !== "fire" && (
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {t.value === null ? "—" : tl(t.value)}
                    {t.unpriced > 0 && ` · ${t.unpriced} kayıtta fiyat yok`}
                  </p>
                )}
              </div>
            ))}
          </div>
          {week.summary.exits.length === 0 ? (
            <p className="text-muted-foreground text-sm">Bu hafta stok çıkışı yok.</p>
          ) : (
            <ul className="divide-y">
              {week.summary.exits.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      <Link href={`/urunler/${r.productId}`} className="font-mono underline-offset-4 hover:underline">
                        {r.productCode}
                      </Link>{" "}
                      {r.productName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {movementTypeLabels[r.type]} · {r.reason} · {r.userName} · {r.lokasyonName} · {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                  <span className="flex shrink-0 flex-col text-right tabular-nums">
                    <span>
                      {displayQuantity(r.quantity)} {unitLabels[r.unit]}
                    </span>
                    {r.value !== null && <span className="text-muted-foreground text-xs">{tl(r.value)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {d.belowMinimum && d.belowMinimum.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kritik seviyenin altındakiler</CardTitle>
              <CardDescription>En acilden başlayarak, şirket toplamı / kritik seviye</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {d.belowMinimum.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link href={`/urunler/${p.id}`} className="min-w-0 truncate underline-offset-4 hover:underline">
                      <span className="font-mono">{p.code}</span> {p.name}
                    </Link>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      <span className="text-destructive font-medium">{displayQuantity(p.total)}</span> / {displayQuantity(p.minLevel)} {unitLabels[p.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Son hareketler</CardTitle>
            <CardDescription>
              Bugün {d.movementsToday} hareket ·{" "}
              <Link href="/transfer" className="underline-offset-4 hover:underline">
                {d.transfersOnTheWay} yoldaki transfer
              </Link>{" "}
              ·{" "}
              <Link href="/sayim" className="underline-offset-4 hover:underline">
                {d.openCounts} açık sayım
              </Link>
            </CardDescription>
            <CardAction>
              <Link href="/hareketler" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
                Tümü
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz hareket yok.</p>
            ) : (
              <ul className="divide-y">
                {d.recent.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">
                        <Link href={`/urunler/${m.productId}`} className="font-mono underline-offset-4 hover:underline">
                          {m.productCode}
                        </Link>{" "}
                        {m.productName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {movementTypeLabels[m.type]} · {m.lokasyonName ?? "Yolda"} · {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                    <span className={`shrink-0 tabular-nums ${m.quantity.startsWith("-") ? "text-destructive" : "text-green-700 dark:text-green-400"}`}>
                      {m.quantity.startsWith("-") ? "" : "+"}
                      {displayQuantity(m.quantity)} {unitLabels[m.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
