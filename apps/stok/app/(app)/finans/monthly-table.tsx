import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { day, monthLabel, share, tl, tlShort } from "@/lib/finance-calc";
import type { MonthNet, Uncosted, YearNet } from "@/lib/gross-profit-calc";

const Signed = ({ value: v }: { value: number }) => <span className={cn("tabular-nums", v < 0 && "text-destructive")}>{tlShort(v)}</span>;

export function MonthlyTable({ months, years }: { months: MonthNet[]; years: YearNet[] }) {
  const shown = months.slice(-12).reverse();
  const shownYears = years.slice(-2).reverse();
  const totals = new Map<string, number>();
  for (const m of shown) for (const [c, v] of Object.entries(m.byCategory)) totals.set(c, (totals.get(c) ?? 0) + v);
  const categories = [...totals.keys()].sort((a, b) => totals.get(b)! - totals.get(a)!);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aylık tablo</CardTitle>
        <CardDescription>KDV hariç; satış fatura tarihine, gider gider tarihine göre. Oran: brüt kârın maliyeti bilinen satışa oranı.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead className="text-right">Brüt kâr</TableHead>
              <TableHead className="text-right">Oran</TableHead>
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
                <TableCell className="text-right">
                  <Signed value={m.gross} />
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">{share(m.gross, m.costedSales)}</TableCell>
                {categories.map((c) => (
                  <TableCell key={c} className="text-muted-foreground text-right tabular-nums">
                    {m.byCategory[c] ? tlShort(m.byCategory[c]) : "—"}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">{tlShort(m.expenses)}</TableCell>
                <TableCell className="text-right font-medium">
                  <Signed value={m.net} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            {shownYears.map((y) => (
              <TableRow key={y.year}>
                <TableCell>{y.year}</TableCell>
                <TableCell className="text-right tabular-nums">{tlShort(y.sales)}</TableCell>
                <TableCell className="text-right">
                  <Signed value={y.gross} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{share(y.gross, y.costedSales)}</TableCell>
                {categories.map((c) => (
                  <TableCell key={c} className="text-right tabular-nums">
                    {tlShort(y.byCategory[c] ?? 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">{tlShort(y.expenses)}</TableCell>
                <TableCell className="text-right">
                  <Signed value={y.net} />
                </TableCell>
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

// Sold lines with no known cost, newest first: they stay out of Brüt kâr until priced or linked.
export function UncostedLines({ lines }: { lines: Uncosted[] }) {
  if (!lines.length) return null;
  const sorted = lines.toSorted((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.amount - a.amount);
  return (
    <Card id="fiyatsiz-satirlar" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>Maliyeti bilinmeyen satırlar ({sorted.length})</CardTitle>
        <CardDescription>
          Alış fiyatı girilince ya da fatura satırı bir ürüne bağlanınca brüt kâra katılır.{" "}
          <Link href="/finans/fiyatlar" className="text-foreground underline underline-offset-4">
            Alış fiyatlarını gir
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-auto">
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
            {sorted.map((u, i) => (
              <TableRow key={`${u.invoiceId}-${i}`}>
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
      </CardContent>
    </Card>
  );
}
