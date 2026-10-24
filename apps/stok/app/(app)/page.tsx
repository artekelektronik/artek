import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, Package, Truck, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@artek/ui/components/alert";
import { Badge } from "@artek/ui/components/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@artek/ui/components/card";
import { loadActor } from "@/lib/guard";
import { dashboardDays, getDashboard } from "@/lib/dashboard";
import { displayQuantity, formatDateTime, movementTypeLabels } from "@/lib/labels";
import { unitLabels } from "@/lib/quantity";
import { formatIstanbulTime } from "@/lib/time";
import { MovementsChart } from "./movements-chart";

export const metadata = { title: "Ana sayfa | Artek Stok" };

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  note,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  note: string;
  tone?: "warning";
}) {
  return (
    <Card className="@container/card gap-3">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value.toLocaleString("tr-TR")}</CardTitle>
        <CardAction>
          <Icon className={tone === "warning" && value > 0 ? "text-destructive size-5" : "text-muted-foreground size-5"} />
        </CardAction>
      </CardHeader>
      <CardFooter className="text-muted-foreground text-sm">
        <Link href={href} className="hover:text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline">
          {note} <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export default async function HomePage() {
  await connection();
  const requestHeaders = await headers();
  const [actor, d] = await Promise.all([loadActor(requestHeaders), getDashboard(requestHeaders)]);
  const now = new Date();
  const notOpened = d.lokasyon.filter((l) => !l.openedAt);
  const firstName = actor.name.split(" ")[0];

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
            <Link href="/acilis-sayimi" className="text-foreground font-medium underline underline-offset-4">
              Açılış sayımına git
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {d.belowMinimum ? (
          <StatCard
            label="Kritik seviyenin altında"
            value={d.belowMinimum.length}
            href="/stok-durumu?kritik=1"
            icon={AlertTriangle}
            note="Ürünleri göster"
            tone="warning"
          />
        ) : (
          <StatCard label="Ürünler" value={d.productCount} href="/urunler" icon={Package} note="Ürün listesi" />
        )}
        <StatCard label="Bugünkü hareketler" value={d.movementsToday} href="/hareketler" icon={Boxes} note="Stok hareketleri" />
        <StatCard label="Yoldaki transferler" value={d.transfersOnTheWay} href="/transfer" icon={Truck} note="Teslim alınmayı bekliyor" />
        <StatCard label="Açık sayımlar" value={d.openCounts} href="/sayim" icon={ClipboardList} note="Onay bekliyor" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Stok hareketleri</CardTitle>
            <CardDescription>Son {dashboardDays} gün, günlük giriş ve çıkış sayısı</CardDescription>
          </CardHeader>
          <CardContent>
            <MovementsChart data={d.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lokasyonlar</CardTitle>
            <CardDescription>Açılış durumu ve stokta olan ürünler</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {d.lokasyon.map((l) => (
              <Link
                key={l.id}
                href={`/stok-durumu?lokasyon=${l.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{l.name}</span>
                  <span className="text-muted-foreground text-sm">{l.stockedProducts.toLocaleString("tr-TR")} üründe stok var</span>
                </div>
                {l.openedAt ? <Badge variant="secondary">Açık</Badge> : <Badge variant="outline">Açılış bekliyor</Badge>}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son hareketler</CardTitle>
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
                    <span className={`shrink-0 tabular-nums ${m.quantity.startsWith("-") ? "text-destructive" : "text-green-700"}`}>
                      {m.quantity.startsWith("-") ? "" : "+"}
                      {displayQuantity(m.quantity)} {unitLabels[m.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {d.belowMinimum && (
          <Card>
            <CardHeader>
              <CardTitle>Kritik seviyenin altındakiler</CardTitle>
              <CardDescription>Şirket toplamı, ürünün kritik seviyesinin altında</CardDescription>
            </CardHeader>
            <CardContent>
              {d.belowMinimum.length === 0 ? (
                <p className="text-muted-foreground text-sm">Kritik seviyenin altında ürün yok.</p>
              ) : (
                <ul className="divide-y">
                  {d.belowMinimum.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link href={`/urunler/${p.id}`} className="min-w-0 truncate underline-offset-4 hover:underline">
                        <span className="font-mono">{p.code}</span> {p.name}
                      </Link>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        <span className="text-destructive font-medium">{displayQuantity(p.total)}</span> / {displayQuantity(p.minLevel)}{" "}
                        {unitLabels[p.unit]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
