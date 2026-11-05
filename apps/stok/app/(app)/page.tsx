import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, ArrowLeftRight, ChartColumn, Download, MapPin, Package, Plus, TriangleAlert, Wallet, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@artek/ui/components/alert";
import { Avatar, AvatarFallback } from "@artek/ui/components/avatar";
import { Button } from "@artek/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { ProductImage } from "@/components/product-image";
import { CategoryBadge, MovementTypeBadge } from "@/components/stock-badges";
import { getDashboard, getStockSummary } from "@/lib/dashboard";
import { salesForMonths, tl, tlShort, day } from "@/lib/finance";
import { Forbidden, loadActor } from "@/lib/guard";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels, type Unit } from "@/lib/quantity";
import { getWeekStockOuts, perUnitText } from "@/lib/stock-out-report";
import { addDays, formatIstanbulTime, istanbulDate } from "@/lib/time";
import { MovementChart } from "./movement-chart";

export const metadata = { title: "Ana sayfa | Artek" };

const count = (value: string) => Number(value).toLocaleString("tr-TR");

// Adet and kg can't be added together: "12.300 adet · 40 kg".
function perUnit(lines: { unit: Unit; value: string }[]) {
  const shown = lines.filter((l) => Number(l.value) !== 0).map((l) => `${count(l.value)} ${unitLabels[l.unit]}`);
  return shown.length ? shown.join(" · ") : "—";
}

// A category with no price at all shows no value, not "0 TL".
const value = (amount: number, counted: number) => (counted ? tlShort(amount) : "—");

function StatCard({ label, value: shown, note, href, icon: Icon }: { label: string; value: string; note: string; href: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="bg-card hover:bg-muted/40 flex overflow-hidden rounded-xl border transition-colors">
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="truncate text-3xl font-semibold tracking-tight tabular-nums">{shown}</span>
        <span className="text-muted-foreground truncate text-xs">{note}</span>
      </div>
      <div className="flex items-center border-l px-4">
        <span className="bg-background flex size-12 items-center justify-center rounded-lg border shadow-xs">
          <Icon className="size-5" />
        </span>
      </div>
    </Link>
  );
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");

export default async function HomePage() {
  await connection();
  const requestHeaders = await headers();
  const now = new Date();
  const thisMonth = istanbulDate(now).slice(0, 7);
  const lastMonth = addDays(`${thisMonth}-01`, -1).slice(0, 7);
  const [actor, d, s, week, sales] = await Promise.all([
    loadActor(requestHeaders),
    getDashboard(requestHeaders),
    getStockSummary(requestHeaders),
    getWeekStockOuts(requestHeaders),
    // null without finance.view
    salesForMonths(requestHeaders, thisMonth, lastMonth).catch((error) => {
      if (error instanceof Forbidden) return null;
      throw error;
    }),
  ]);
  const notOpened = d.lokasyon.filter((l) => !l.openedAt);
  const firstName = actor.name.split(" ")[0];


  const o = s.overall;
  const hasTransit = o.units.some((u) => Number(u.inTransit) !== 0);
  // Each Lokasyon's share of the company's stock, in its main unit.
  const mainUnit = o.units.find((u) => u.unit === "adet") ?? o.units[0];
  const share = (id: string) => (mainUnit && Number(mainUnit.total) > 0 ? Math.round((Number(mainUnit.physical[id] ?? 0) / Number(mainUnit.total)) * 100) : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Hoş geldiniz{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="text-muted-foreground">Stokta bugün neler oluyor · <time dateTime={now.toISOString()}>{formatIstanbulTime(now)}</time></p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/stok-durumu/csv">
              <Download /> Dışa aktar
            </a>
          </Button>
          <Button asChild>
            <Link href="/stok-girisi">
              <Plus /> Stok gir
            </Link>
          </Button>
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Stoktaki ürün"
          value={o.products.toLocaleString("tr-TR")}
          note={perUnit(o.units.map((u) => ({ unit: u.unit, value: u.total })))}
          href="/stok-durumu"
        />
        {d.belowMinimum ? (
          <StatCard
            icon={TriangleAlert}
            label="Kritik seviyenin altında"
            value={String(d.belowMinimum.length)}
            note={d.noMinimumCount ? `${d.noMinimumCount} üründe sınır girilmemiş` : "Tüm ürünlerde sınır var"}
            href="/stok-durumu?kritik=1"
          />
        ) : (
          <StatCard icon={ArrowLeftRight} label="Bugünkü hareket" value={String(d.movementsToday)} note={`${d.openCounts} açık sayım`} href="/hareketler" />
        )}
        {s.finance ? (
          <>
            <StatCard
              icon={Wallet}
              label="Stok değeri (satış)"
              value={value(o.sale, o.saleCounted)}
              note={`Alış: ${value(o.purchase, o.purchaseCounted)}${o.marginCounted ? ` · Beklenen kâr ${tlShort(o.margin)}` : ""}`}
              href="/finans/fiyatlar"
            />
            <StatCard
              icon={ChartColumn}
              label="Bu ay satış"
              value={tlShort(sales?.thisMonth ?? 0)}
              note={`Geçen ay: ${tlShort(sales?.lastMonth ?? 0)}${sales?.asOf ? ` · Son fatura ${day(sales.asOf)}` : ""}`}
              href="/finans"
            />
          </>
        ) : (
          <>
            <StatCard icon={ArrowLeftRight} label="Yoldaki transfer" value={String(d.transfersOnTheWay)} note="Teslim alınmayı bekliyor" href="/transfer" />
            <StatCard icon={ChartColumn} label="Açık sayım" value={String(d.openCounts)} note={`Bugün ${d.movementsToday} hareket`} href="/sayim" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Stok hareketleri</CardTitle>
            <CardDescription>Son 6 ay, aylık giriş ve çıkış kaydı</CardDescription>
          </CardHeader>
          <CardContent>
            <MovementChart thisMonth={thisMonth} data={d.monthly} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Son hareketler</CardTitle>
            <CardDescription>
              Bugün {d.movementsToday} hareket · {d.transfersOnTheWay} yoldaki transfer · {d.openCounts} açık sayım
            </CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/hareketler">Tümü</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz hareket yok.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Kim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.recent.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link href={`/urunler/${m.productId}`} className="flex items-center gap-3 underline-offset-4 hover:underline">
                          <ProductImage path={m.productImage} alt={m.productName} className="size-9" />
                          <span className="max-w-48 truncate font-medium">{m.productName}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <MovementTypeBadge type={m.type} />
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${m.quantity.startsWith("-") ? "text-destructive" : "text-green-700 dark:text-green-400"}`}>
                        {m.quantity.startsWith("-") ? "" : "+"}
                        {displayQuantity(m.quantity)} {unitLabels[m.unit]}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Avatar className="ml-auto size-8" title={m.userName ?? undefined}>
                          <AvatarFallback className="text-xs">{initials(m.userName ?? "?")}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lokasyonlar</CardTitle>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/stok-durumu">Tümü</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.lokasyon.map((l) => (
            <Link key={l.id} href={`/stok-durumu?lokasyon=${l.id}`} className="hover:bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
              <div className="flex items-center gap-2">
                <span className="bg-muted flex size-8 items-center justify-center rounded-md">
                  <MapPin className="size-4" />
                </span>
                <span className="font-medium">{l.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${share(l.id)}%` }} />
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">%{share(l.id)}</span>
              </div>
              <div className="flex divide-x text-sm">
                {o.units.map((u) => (
                  <div key={u.unit} className="flex flex-col px-3 first:pl-0">
                    <span className="text-muted-foreground text-xs">{unitLabels[u.unit]}</span>
                    <span className="text-lg font-medium tabular-nums">{count(u.physical[l.id] ?? "0")}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

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
            <Button asChild variant="outline" size="sm">
              <Link href="/stok-durumu">Tüm ürünler</Link>
            </Button>
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

      <div className={`grid grid-cols-1 gap-4 ${d.belowMinimum?.length ? "xl:grid-cols-2" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle>Bu hafta çıkışlar</CardTitle>
            <CardDescription>
              {day(week.from)} pazartesiden beri {week.summary.exits.length} kayıt
              {week.summary.corrections.length > 0 && ` · düzeltme veya sayımla azalan ${week.summary.corrections.length} kayıt ayrıca`}
            </CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/stok-cikisi">Tümü</Link>
              </Button>
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
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/urunler/${r.productId}`} className="truncate font-medium underline-offset-4 hover:underline">
                          {r.productName}
                        </Link>
                        <CategoryBadge category={r.productCategory} />
                        <MovementTypeBadge type={r.type} />
                      </span>
                      <span className="text-muted-foreground text-xs">
                        <span className="font-mono">{r.productCode}</span> · {r.reason} · {r.userName} · {r.lokasyonName} · {formatDateTime(r.createdAt)}
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

      </div>
    </div>
  );
}
