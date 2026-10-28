import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { chartColors, HBars, Insight, PanelCard, PanelShell, panelLede, panelWarning, StatTile } from "@/components/panel";
import { financeSummary, loyalty, monthLabel, pct, recency, shortName, tl, tlShort } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { SalesChart } from "./sales-chart";

export const metadata = { title: "Finans | Artek Stok" };

export default async function FinancePage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const allowed = { finance: true, crm: can(actor, "crm.view") };
  const s = await financeSummary(requestHeaders, "finance.view");

  if (s.invoiceCount === 0) {
    return (
      <PanelShell active="ozet" allowed={allowed} lede="Henüz satış faturası yok.">
        <p className="text-muted-foreground">
          <Link href="/faturalar" className="text-foreground underline underline-offset-4">
            Faturaları yükleyin
          </Link>
          ; bu sayfa onlardan hesaplanır.
        </p>
      </PanelShell>
    );
  }

  // A gap of several invoices makes the months it spans look smaller than they were.
  const bigGaps = s.gaps.filter((g) => g.to - g.from + 1 >= 5);
  const incomplete = (ym: string) => bigGaps.some((g) => g.after.slice(0, 7) <= ym && ym <= g.before.slice(0, 7));
  const best = [...s.monthly].sort((a, b) => b.sales - a.sales);
  const names = new Map(s.customerRows.map((c) => [c.id, c.name]));
  const segments = (["Sadık", "Tekrar eden", "Tek sefer"] as const).map((k) => {
    const g = s.customers.filter((c) => loyalty(c.orderDays) === k);
    const n = (r: string) => g.filter((c) => recency(c.idle) === r).length;
    return { k, aktif: n("Aktif"), soguyor: n("Soğuyor"), yok: n("Uzun süredir yok"), total: g.length, sales: g.reduce((t, c) => t + c.sales, 0) };
  });
  const istanbul = s.cities.find((c) => c.city === "İSTANBUL")?.count ?? 0;
  const topCities = s.cities.slice(0, 7);
  const otherCities = s.cities.slice(7).reduce((n, c) => n + c.count, 0);
  const hot = (k: string, n: number) => (k !== "Tek sefer" && n ? "text-destructive font-semibold" : "");

  return (
    <PanelShell active="ozet" allowed={allowed} lede={panelLede(s, true)} warning={panelWarning(s.gaps, s.asOf)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Toplam satış (KDV hariç)" value={tlShort(s.total)} note={`${monthLabel(s.firstOn.slice(0, 7))} – ${monthLabel(s.asOf.slice(0, 7))}`} />
        <StatTile label="Satış faturası" value={s.invoiceCount.toLocaleString("tr-TR")} note="Tekrarlar ve iadeler çıkarıldı" />
        <StatTile label="Müşteri" value={s.customerCount.toLocaleString("tr-TR")} note="Farklı firma ve şahıs" />
        <StatTile label="Tekrar gelen müşteri" value={s.repeatCount.toLocaleString("tr-TR")} note="En az iki farklı günde sipariş" />
        <StatTile label="Ortalama fatura" value={tl(s.total / s.invoiceCount)} note="KDV hariç" />
      </div>

      <PanelCard title="Aylık satış" note="KDV hariç, fatura tarihine göre. Soluk çubuklar eksik verisi olan aylar.">
        <SalesChart
          data={s.monthly.map((m) => ({
            month: m.month,
            sales: m.sales,
            invoices: m.invoices,
            customers: m.customers,
            newCustomers: m.newCustomers,
            incomplete: incomplete(m.month),
            best: m.month === best[0].month,
          }))}
        />
        <p className="text-muted-foreground text-xs">
          En güçlü aylar: {best.slice(0, 3).map((m) => monthLabel(m.month)).join(", ")}. Çerçeveli çubuk en yüksek ay.
        </p>
      </PanelCard>

      <PanelCard title="Bu veriler ne söylüyor">
        <ul className="flex flex-col gap-3">
          <Insight todo="Büyük müşterilerle düzenli görüş; biri giderse ciro hızla düşer.">
            Ciro birkaç müşteride toplanıyor: ilk 5 müşteri cironun <b>{pct(s.insights.top5)}</b>’ini, ilk 20 müşteri <b>{pct(s.insights.top20)}</b>’ini
            getiriyor. En büyük müşteri tek başına <b>{pct(s.insights.top1)}</b>.
          </Insight>
          <Insight todo="Her ilk siparişten 4–6 hafta sonra kısa bir takip araması yap.">
            Müşterilerin <b>{pct(s.insights.oneOff)}</b>’i bir kez alıp tekrar gelmedi. Buna karşılık iki ve daha fazla kez alanlar cironun büyük kısmını
            getiriyor.
          </Insight>
          <Insight todo="Önce bunları ara. Müşteriler sekmesinde “Geri kazan” grubunda.">
            <b>{s.insights.lapsedCount}</b> müşteri eskiden birden fazla kez alıyordu ama 3 aydır sipariş vermiyor. Dönem içinde toplam{" "}
            <b>{tl(s.insights.lapsedSales)}</b> almışlardı.
          </Insight>
          <Insight todo="Nüve alan müşterilere hazır sarılı trafo ve bobin teklif et; en kolay ek satış bu.">
            Özel trafo cironun <b>{pct(s.insights.trafoShare)}</b>’ini getiriyor ama yalnızca <b>{s.insights.trafoCustomers}</b> müşteri alıyor. Nüveyi{" "}
            <b>{s.insights.coreCustomers}</b> müşteri alıyor; bunların sadece <b>{pct(s.insights.coreAlsoTrafo)}</b>’i trafo da alıyor.
          </Insight>
          <Insight todo="İstanbul’daki “Geri kazan” müşterilerini ziyaret listesine koy.">
            Müşterilerin <b>{pct(s.customerCount ? istanbul / s.customerCount : 0)}</b>’i İstanbul’da. Kocaeli, Ankara ve İzmir sonra geliyor.
          </Insight>
        </ul>
      </PanelCard>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <PanelCard title="En çok alan 10 müşteri" note="Dönem toplamı, KDV hariç.">
          <HBars
            rows={s.customers.slice(0, 10).map((c, i) => ({
              key: c.customerId,
              label: shortName(names.get(c.customerId) ?? ""),
              value: c.sales,
              display: tlShort(c.sales),
              color: i === 0 ? chartColors[0] : undefined,
              href: allowed.crm ? `/musteriler?secili=${c.customerId}` : undefined,
            }))}
          />
        </PanelCard>

        <PanelCard
          title="Müşteriler ne kadar sık geliyor"
          note="Müşteri sayısı. Aktif: son alım 3 aya kadar. Soğuyor: 3–6 ay. Uzun süredir yok: 6 aydan fazla."
        >
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş sıklığı</TableHead>
                <TableHead className="text-right">Aktif</TableHead>
                <TableHead className="text-right">Soğuyor</TableHead>
                <TableHead className="text-right">Uzun süredir yok</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Satış</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((g) => (
                <TableRow key={g.k}>
                  <TableCell>{g.k}</TableCell>
                  <TableCell className="text-right tabular-nums">{g.aktif}</TableCell>
                  <TableCell className={`text-right tabular-nums ${hot(g.k, g.soguyor)}`}>{g.soguyor}</TableCell>
                  <TableCell className={`text-right tabular-nums ${hot(g.k, g.yok)}`}>{g.yok}</TableCell>
                  <TableCell className="text-right tabular-nums">{g.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{tlShort(g.sales)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground text-xs">
            Sadık: 4 ve üzeri sipariş günü. Tekrar eden: 2–3. Kırmızı hücreler, eskiden düzenli alıp kaybolmaya başlayan müşteriler.
          </p>
        </PanelCard>

        <PanelCard title="Ürün grubuna göre satış" note="Fatura kalemlerinden, KDV hariç.">
          <HBars rows={s.groups.map((g, i) => ({ key: g.group, label: g.group, value: g.sales, display: tlShort(g.sales), color: chartColors[i] }))} />
        </PanelCard>

        <PanelCard title="Müşteriler nerede" note="Faturadaki adrese göre müşteri sayısı.">
          <HBars
            rows={[
              ...topCities.map((c, i) => ({ key: c.city, label: c.city, value: c.count, display: `${c.count} müşteri`, color: i === 0 ? chartColors[0] : undefined })),
              ...(otherCities ? [{ key: "diger", label: "Diğer", value: otherCities, display: `${otherCities} müşteri` }] : []),
            ]}
          />
        </PanelCard>
      </div>
    </PanelShell>
  );
}
