import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { day, monthLabel, share, tl } from "@/lib/finance-calc";
import type { MonthNet, Uncosted } from "@/lib/gross-profit-calc";
import { moneyIn } from "@/lib/period";

type Row = Pick<MonthNet, "sales" | "gross" | "costedSales" | "expenses" | "net">;

// Satış → Brüt kâr → Giderler → Net, newest month first, with the period's total under it.
export function MonthlyTable({ months, usd, note }: { months: MonthNet[]; usd: boolean; note: string }) {
  const { short } = moneyIn(usd);
  const sum = (k: keyof Row) => months.reduce((t, m) => t + m[k], 0);
  const total: Row = { sales: sum("sales"), gross: sum("gross"), costedSales: sum("costedSales"), expenses: sum("expenses"), net: sum("net") };
  const cells = (r: Row) => (
    <>
      <TableCell className="text-right tabular-nums">{short(r.sales)}</TableCell>
      <TableCell className={cn("text-right tabular-nums", r.gross < 0 && "text-destructive")}>{short(r.gross)}</TableCell>
      <TableCell className="text-muted-foreground text-right tabular-nums">{share(r.gross, r.costedSales)}</TableCell>
      <TableCell className="text-right tabular-nums">{short(r.expenses)}</TableCell>
      <TableCell className={cn("text-right font-medium tabular-nums", r.net < 0 && "text-destructive")}>{short(r.net)}</TableCell>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aylık tablo</CardTitle>
        <CardDescription>{note} Kategoriler için Giderler’e bakın.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ay</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead className="text-right">Brüt kâr</TableHead>
              <TableHead className="text-right">Oran</TableHead>
              <TableHead className="text-right">Giderler</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.toReversed().map((m) => (
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
                {cells(m)}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Toplam</TableCell>
              {cells(total)}
            </TableRow>
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
