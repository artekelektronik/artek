import { headers } from "next/headers";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { CurrencyToggle } from "@/components/currency-toggle";
import { DateRangeFilter } from "@/components/date-range-filter";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell, panelWarning } from "@/components/panel";
import { financeSummary, pct } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { financePeriod, moneyIn, type PeriodParams } from "@/lib/period";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";

export const metadata = { title: "Ürün satışları | Artek" };

export default async function ProductSalesPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const period = financePeriod(await searchParams, istanbulDate(new Date()));
  const s = await financeSummary(requestHeaders, "finance.view", period);
  const { full } = moneyIn(period.usd);

  return (
    <PanelShell
      title="Ürün satışları"
      lede={`Seçilen tarihlerdeki satış faturalarından, KDV hariç${period.usd ? "; her fatura kendi tarihindeki TCMB kuruyla USD’ye çevrildi" : ""}.`}
      warning={panelWarning(s.gaps)}
      actions={
        <>
          <DateRangeFilter fallback={period} />
          <CurrencyToggle />
        </>
      }
    >
      <PanelCard title="Ürün grupları">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Grup</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead className="text-right">Ciro payı</TableHead>
              <TableHead className="text-right">Fatura</TableHead>
              <TableHead className="text-right">Müşteri</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.groups.map((g) => (
              <TableRow key={g.group}>
                <TableCell className="font-medium">{g.group}</TableCell>
                <TableCell className="text-right tabular-nums">{full(g.sales)}</TableCell>
                <TableCell className="text-right tabular-nums">{pct(g.share)}</TableCell>
                <TableCell className="text-right tabular-nums">{g.invoices}</TableCell>
                <TableCell className="text-right tabular-nums">{g.customers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>

      <PanelCard
        title="En çok satan 30 ürün"
        note="Faturadaki ürün adları sadeleştirildi (ör. FERİT NÜVE ve FERRİTNUVE aynı sayıldı). Çoğu ürün müşteriye özel olduğu için tek müşteriye gidiyor."
      >
        <div className="max-h-[36rem] overflow-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead className="text-right">Satış</TableHead>
                <TableHead className="text-right">Adet</TableHead>
                <TableHead className="text-right">Fatura</TableHead>
                <TableHead className="text-right">Müşteri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.products.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.group}</TableCell>
                  <TableCell className="text-right tabular-nums">{full(p.sales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(p.quantity).toLocaleString("tr-TR")}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.invoices}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.customers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </PanelShell>
  );
}
