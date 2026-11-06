import Link from "next/link";
import { CircleDollarSign, Percent, TriangleAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { PanelCard } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { day, monthLabel, share, tl, tlShort } from "@/lib/finance";
import type { grossProfit } from "@/lib/gross-profit";
import { GrossProfitChart } from "./gross-profit-chart";

type GrossProfit = Awaited<ReturnType<typeof grossProfit>>;

// Brüt kâr: confirmed sales minus what the sold Ürünler cost (Alış fiyatı at the invoice date's rate).
export function GrossProfitSection({ data }: { data: GrossProfit }) {
  const { months, uncosted } = data;
  if (!months.length) return null;
  const last = months.at(-1)!;
  const year = last.month.slice(0, 4);
  const thisYear = months.filter((m) => m.month.startsWith(year));
  const sum = (key: "sales" | "cost" | "gross" | "costedSales" | "uncostedSales") => thisYear.reduce((s, m) => s + m[key], 0);
  const missing = uncosted.toSorted((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.amount - a.amount);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={`${monthLabel(last.month)} brüt kâr`} value={tl(last.gross)} note={`Maliyeti bilinen satışın ${share(last.gross, last.costedSales)}’i`} icon={CircleDollarSign} tone={last.gross < 0 ? "bad" : undefined} />
        <StatCard label={`${year} brüt kâr oranı`} value={share(sum("gross"), sum("costedSales"))} note={`${tl(sum("gross"))} brüt kâr`} icon={Percent} />
        <StatCard
          label="Maliyeti bilinmeyen satış"
          value={tlShort(sum("uncostedSales"))}
          note={`${year}: ${share(sum("uncostedSales"), sum("sales"))} · alış fiyatı ya da ürün eksik`}
          icon={TriangleAlert}
          href={missing.length ? "#fiyatsiz-satirlar" : "/finans/fiyatlar"}
          tone={sum("uncostedSales") > 0 ? "bad" : undefined}
        />
      </div>

      <PanelCard title="Aylık brüt kâr" note="KDV hariç, fatura tarihine göre. Maliyet: ürünün alış fiyatı, fatura günündeki TCMB kuruyla; malzemeden üretilen satırlarda malzemeler. Fiyatsız satış kâra katılmaz.">
        <GrossProfitChart data={months} />
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead className="text-right">Maliyet</TableHead>
              <TableHead className="text-right">Brüt kâr</TableHead>
              <TableHead className="text-right">Oran</TableHead>
              <TableHead className="text-right">Fiyatsız satış</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months
              .slice(-12)
              .reverse()
              .map((m) => (
                <TableRow key={m.month}>
                  <TableCell>{monthLabel(m.month)}</TableCell>
                  <TableCell className="text-right tabular-nums">{tlShort(m.sales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{tlShort(m.cost)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{tlShort(m.gross)}</TableCell>
                  <TableCell className="text-right tabular-nums">{share(m.gross, m.costedSales)}</TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">{m.uncostedLines ? `${tlShort(m.uncostedSales)} · ${m.uncostedLines} satır` : "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>{year}</TableCell>
              <TableCell className="text-right tabular-nums">{tlShort(sum("sales"))}</TableCell>
              <TableCell className="text-right tabular-nums">{tlShort(sum("cost"))}</TableCell>
              <TableCell className="text-right tabular-nums">{tlShort(sum("gross"))}</TableCell>
              <TableCell className="text-right tabular-nums">{share(sum("gross"), sum("costedSales"))}</TableCell>
              <TableCell className="text-right tabular-nums">{tlShort(sum("uncostedSales"))}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </PanelCard>

      {missing.length > 0 && (
        <PanelCard
          id="fiyatsiz-satirlar"
          title={`Maliyeti bilinmeyen satırlar (${missing.length})`}
          note="Bunlara alış fiyatı girilince ya da fatura satırı bir ürüne bağlanınca brüt kâra katılır. Yeniler üstte."
        >
          <div className="max-h-96 overflow-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Satır</TableHead>
                  <TableHead>Neden</TableHead>
                  <TableHead className="text-right">Satış</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missing.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Link href={`/faturalar?fatura=${u.invoiceId}`} className="font-mono underline-offset-4 hover:underline">
                        {u.number}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{day(u.issuedOn)}</TableCell>
                    <TableCell className="max-w-72 truncate">{u.description}</TableCell>
                    <TableCell>{u.reason}</TableCell>
                    <TableCell className="text-right tabular-nums">{tl(u.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Link href="/finans/fiyatlar" className="text-sm underline underline-offset-4">
            Alış fiyatlarını gir
          </Link>
        </PanelCard>
      )}
    </>
  );
}
