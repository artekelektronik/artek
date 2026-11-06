import Link from "next/link";
import { Receipt, Scale, TrendingUp, TriangleAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { PanelCard } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { monthLabel, tl, tlShort } from "@/lib/finance";
import type { monthlyNet } from "@/lib/gross-profit-calc";
import { NetChart } from "./net-chart";

type Net = ReturnType<typeof monthlyNet>;

const money = (v: number) => <span className={cn("tabular-nums", v < 0 && "text-destructive")}>{tlShort(v)}</span>;

// How each month ended: Satış → Brüt kâr → Giderler → Net, KDV hariç.
export function NetSection({ data }: { data: Net }) {
  const { months, years } = data;
  if (!months.length) return null;
  const last = months.at(-1)!;
  const year = years.at(-1)!;
  const shown = months.slice(-12).reverse();
  const shownYears = years.slice(-2).reverse();
  // Every category in the shown months, the biggest first, one column each.
  const totals = new Map<string, number>();
  for (const m of shown) for (const [c, v] of Object.entries(m.byCategory)) totals.set(c, (totals.get(c) ?? 0) + v);
  const categories = [...totals.keys()].sort((a, b) => totals.get(b)! - totals.get(a)!);
  const yearCategory = (y: string, c: string) => months.filter((m) => m.month.startsWith(y)).reduce((s, m) => s + (m.byCategory[c] ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={`${monthLabel(last.month)} net`} value={tl(last.net)} note={last.incomplete ? "Maliyeti bilinmeyen satış var; net eksik" : "Brüt kâr − giderler"} icon={Scale} tone={last.net < 0 ? "bad" : "good"} />
        <StatCard label={`${year.year} net`} value={tl(year.net)} note={`${tl(year.gross)} brüt kâr`} icon={TrendingUp} tone={year.net < 0 ? "bad" : "good"} />
        <StatCard label={`${year.year} giderler`} value={tl(year.expenses)} note="KDV hariç" icon={Receipt} href="/finans/giderler" />
      </div>

      <PanelCard title="Aylık net" note="Satış → brüt kâr → giderler (kategoriye göre) → net, KDV hariç; satış fatura tarihine, gider gider tarihine göre. Uyarılı aylarda bazı satışların maliyeti bilinmiyor.">
        <NetChart data={months} />
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead className="text-right">Brüt kâr</TableHead>
              {categories.map((c) => (
                <TableHead key={c} className="text-muted-foreground text-right font-normal">
                  {c}
                </TableHead>
              ))}
              <TableHead className="text-right">Giderler</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((m) => (
              <TableRow key={m.month}>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    {monthLabel(m.month)}
                    {m.incomplete && (
                      <span title="Maliyeti bilinmeyen satış var">
                        <TriangleAlert className="size-3.5 text-amber-600" />
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{tlShort(m.sales)}</TableCell>
                <TableCell className="text-right">{money(m.gross)}</TableCell>
                {categories.map((c) => (
                  <TableCell key={c} className="text-muted-foreground text-right tabular-nums">
                    {m.byCategory[c] ? tlShort(m.byCategory[c]) : "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">{tlShort(m.expenses)}</TableCell>
                <TableCell className="text-right font-medium">{money(m.net)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            {shownYears.map((y) => (
              <TableRow key={y.year}>
                <TableCell>{y.year}</TableCell>
                <TableCell className="text-right tabular-nums">{tlShort(y.sales)}</TableCell>
                <TableCell className="text-right">{money(y.gross)}</TableCell>
                {categories.map((c) => (
                  <TableCell key={c} className="text-right tabular-nums">
                    {tlShort(yearCategory(y.year, c))}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">{tlShort(y.expenses)}</TableCell>
                <TableCell className="text-right">{money(y.net)}</TableCell>
              </TableRow>
            ))}
          </TableFooter>
        </Table>
        <Link href="/finans/giderler" className="text-sm underline underline-offset-4">
          Giderlere git
        </Link>
      </PanelCard>
    </>
  );
}
