import Link from "next/link";
import { Plus, Repeat, TriangleAlert } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { day, share, tl } from "@/lib/finance-calc";
import type { upcomingExpenses } from "@/lib/expenses";
import type { YearNet } from "@/lib/gross-profit-calc";
import type { recentInvoices } from "@/lib/invoices";

type Upcoming = Awaited<ReturnType<typeof upcomingExpenses>>;
type Recent = Awaited<ReturnType<typeof recentInvoices>>;

export function UpcomingCard({ items, canEdit }: { items: Upcoming; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yaklaşan ödemeler</CardTitle>
        <CardDescription>Her ay tekrarlanan giderler</CardDescription>
        {canEdit && (
          <CardAction>
            <Button asChild variant="outline" size="icon" className="size-8">
              <Link href="/finans/giderler?gider=yeni" aria-label="Gider ekle">
                <Plus />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {items.length ? (
          items.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <Repeat className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{e.description || e.category}</span>
                <span className="text-muted-foreground text-xs">
                  {e.description ? `${e.category} · ` : ""}
                  {day(e.dueOn)}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums">{tl(Number(e.netAmount))}</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Her ay tekrarlanan gider yok. Kira, maaş gibi giderleri eklerken “Her ay tekrarla”yı açın.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/finans/giderler">Tüm giderler</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function RecentInvoicesCard({ rows }: { rows: Recent }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Son faturalar</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/faturalar">Tümü</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-64">
                  <Link href={`/faturalar?fatura=${r.id}`} className="flex flex-col hover:underline">
                    <span className="truncate font-medium">{r.customer ?? "—"}</span>
                    <span className="text-muted-foreground font-mono text-xs">{r.number}</span>
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{day(r.issuedOn)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.type === "IADE" ? "−" : ""}
                  {tl(Number(r.netAmount))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1.5">
                    <span className={cn("size-1.5 rounded-full", r.status === "onaylandi" ? "bg-emerald-500" : "bg-amber-500")} />
                    {r.type === "IADE" ? "İade" : r.status === "onaylandi" ? "Onaylı" : "Taslak"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function YearCard({ totals }: { totals: YearNet }) {
  const rows = [
    { label: "Satış", value: tl(totals.sales) },
    { label: "Brüt kâr", value: tl(totals.gross), note: share(totals.gross, totals.costedSales) },
    { label: "Giderler", value: tl(totals.expenses) },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{totals.year} özeti</CardTitle>
        <CardDescription>KDV hariç</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="tabular-nums">
              {r.note && <span className="text-muted-foreground mr-2 text-xs">{r.note}</span>}
              {r.value}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-2 border-t pt-3 font-medium">
          <span>Net</span>
          <span className={cn("text-lg tabular-nums", totals.net < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>{tl(totals.net)}</span>
        </div>
        {totals.uncostedSales > 0 && (
          <Link href="#fiyatsiz-satirlar" className="mt-auto flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {tl(totals.uncostedSales)} satışın maliyeti bilinmiyor; brüt kâra katılmadı. <span className="underline underline-offset-4">Satırları gör</span>
            </span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
