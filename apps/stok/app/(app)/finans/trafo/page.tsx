import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { DateRangeFilter } from "@/components/date-range-filter";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { pct, tl } from "@/lib/finance-calc";
import { trafoProfitability } from "@/lib/gross-profit";
import { loadActor } from "@/lib/guard";
import { displayQuantity } from "@/lib/labels";
import { financePeriod, type PeriodParams } from "@/lib/period";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";
import type { TrafoRow } from "@/lib/trafo-profit-calc";

export const metadata = { title: "Trafo kârlılığı | Artek" };

export default async function TrafoProfitPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const period = financePeriod(await searchParams, istanbulDate(new Date()));
  const r = await trafoProfitability(requestHeaders, period);

  return (
    <PanelShell
      title="Trafo kârlılığı"
      lede="Malzemeden yapılan her trafonun satışı, kullanılan malzemenin ve işçiliğin maliyeti, kalan kâr. Malzeme fatura günündeki kurla, işçilik trafoda kayıtlı tutarla hesaplanır. KDV hariç, TL."
      warning={
        r.uncosted ? (
          <>
            <b>{r.uncosted} trafo satırı</b> burada yok: malzemesinin alış fiyatı girilmemiş. <Link href="/finans/fiyatlar">Alış fiyatlarını gir</Link>
          </>
        ) : undefined
      }
      actions={<DateRangeFilter fallback={period} />}
    >
      {r.byProduct.length ? (
        <>
          <PanelCard title="Trafoya göre" note="En çok kazandıran en üstte. İşçilik 0 görünüyorsa o trafo için Fiyat hesapla’da işçilik kaydedilmemiştir.">
            <Rows rows={r.byProduct} first="Trafo" quantity />
          </PanelCard>
          <PanelCard title="Müşteriye göre">
            <Rows rows={r.byCustomer} first="Müşteri" />
          </PanelCard>
        </>
      ) : (
        <p className="text-muted-foreground">Bu tarihlerde malzemeden yapılmış, maliyeti bilinen trafo satışı yok.</p>
      )}
    </PanelShell>
  );
}

function Rows({ rows, first, quantity = false }: { rows: TrafoRow[]; first: string; quantity?: boolean }) {
  const sum = (k: "sales" | "material" | "labor" | "profit") => rows.reduce((t, r) => t + r[k], 0);
  const cells = (r: Pick<TrafoRow, "sales" | "material" | "labor" | "profit">) => (
    <>
      <TableCell className="text-right tabular-nums">{tl(r.sales)}</TableCell>
      <TableCell className="text-right tabular-nums">{tl(r.material)}</TableCell>
      <TableCell className="text-right tabular-nums">{tl(r.labor)}</TableCell>
      <TableCell className={cn("text-right font-medium tabular-nums", r.profit < 0 && "text-destructive")}>{tl(r.profit)}</TableCell>
      <TableCell className="text-muted-foreground text-right tabular-nums">{r.material + r.labor > 0 ? pct(r.profit / (r.material + r.labor)) : "—"}</TableCell>
    </>
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{first}</TableHead>
          {quantity && <TableHead className="text-right">Adet</TableHead>}
          <TableHead className="text-right">Satış</TableHead>
          <TableHead className="text-right">Malzeme</TableHead>
          <TableHead className="text-right">İşçilik</TableHead>
          <TableHead className="text-right">Kâr</TableHead>
          <TableHead className="text-right">Maliyet üzerine</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.key}>
            <TableCell className="max-w-72 whitespace-normal">{r.label}</TableCell>
            {quantity && <TableCell className="text-right tabular-nums">{displayQuantity(String(r.quantity))}</TableCell>}
            {cells(r)}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Toplam</TableCell>
          {quantity && <TableCell />}
          {cells({ sales: sum("sales"), material: sum("material"), labor: sum("labor"), profit: sum("profit") })}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
