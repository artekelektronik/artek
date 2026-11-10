import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { CircleCheck, Clock } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { DateRangeFilter } from "@/components/date-range-filter";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { day, tl } from "@/lib/finance-calc";
import { loadActor } from "@/lib/guard";
import { paymentStateLabels, paymentsTrackedFrom } from "@/lib/payment-state";
import { listCollections } from "@/lib/payments";
import { financePeriod, inPeriod, type PeriodParams } from "@/lib/period";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";

export const metadata = { title: "Tahsilat | Artek" };

type Sale = Awaited<ReturnType<typeof listCollections>>[number];

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  // No range: every sale, so nothing owed is hidden; a range narrows the sales by their date.
  const params = await searchParams;
  const picked = Boolean(params.baslangic && params.bitis);
  const period = financePeriod(params, istanbulDate(new Date()));
  const sales = (await listCollections(requestHeaders)).filter((s) => !picked || inPeriod(s.issuedOn, period));
  const sum = (rows: Sale[], f: (s: Sale) => number) => rows.reduce((t, s) => t + f(s), 0);
  const paid = sales.filter((s) => s.state === "odendi");
  const unInvoiced = paid.filter((s) => s.proforma).length;
  const lists = [
    { key: "beklenen", title: "Bekleyen", card: "Bekleyen ödeme", icon: Clock, note: (n: number) => `${n} satış`, amount: (s: Sale) => s.owed, rows: sales.filter((s) => s.state !== "odendi") },
    { key: "odenen", title: "Ödenen", card: "Ödenen", icon: CircleCheck, note: (n: number) => `${n} satış · ${unInvoiced} faturasız`, amount: (s: Sale) => s.total, rows: paid },
  ];

  return (
    <PanelShell
      title="Tahsilat"
      lede={`Satışların ödemeleri, KDV dahil. Ödeme, faturanın ya da proformanın kendi sayfasından girilir. ${day(paymentsTrackedFrom)} öncesi satışlar ödenmiş sayılır.`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lists.map((l) => (
          <StatCard key={l.key} label={l.card} value={tl(sum(l.rows, l.amount))} note={l.note(l.rows.length)} icon={l.icon} />
        ))}
      </div>

      <PanelCard title="Satışlar" note="Proformalar onaylanmadan da burada görünür; ön ödeme alınabilir.">
        <DateRangeFilter />
        <Tabs defaultValue="beklenen" className="gap-3">
          <TabsList>
            {lists.map((l) => (
              <TabsTrigger key={l.key} value={l.key}>
                {l.title} ({l.rows.length})
              </TabsTrigger>
            ))}
          </TabsList>
          {lists.map((l) => (
            <TabsContent key={l.key} value={l.key}>
              <SalesTable rows={l.rows} />
            </TabsContent>
          ))}
        </Tabs>
      </PanelCard>
    </PanelShell>
  );
}

function SalesTable({ rows }: { rows: Sale[] }) {
  if (!rows.length) return <p className="text-muted-foreground text-sm">Bu listede satış yok.</p>;
  const sum = (f: (s: Sale) => number) => rows.reduce((t, s) => t + f(s), 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarih</TableHead>
          <TableHead>Satış</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead className="text-right">Toplam</TableHead>
          <TableHead className="text-right">Ödenen</TableHead>
          <TableHead className="text-right">Kalan</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="tabular-nums">{day(s.issuedOn)}</TableCell>
            <TableCell>
              <Link href={`/faturalar?fatura=${s.id}`} className="flex items-center gap-2 font-mono text-xs underline-offset-4 hover:underline">
                {s.number}
                {s.proforma && <Badge variant="outline">{s.status === "onaylandi" ? "Proforma" : "Proforma, teslim edilmedi"}</Badge>}
              </Link>
            </TableCell>
            <TableCell className="max-w-64 truncate">{s.customer}</TableCell>
            <TableCell className="text-right tabular-nums">{tl(s.total)}</TableCell>
            <TableCell className="text-right tabular-nums">{tl(s.paid)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{tl(s.owed)}</TableCell>
            <TableCell>
              <Badge variant="outline">{paymentStateLabels[s.state]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>{rows.length.toLocaleString("tr-TR")} satış</TableCell>
          <TableCell className="text-right tabular-nums">{tl(sum((s) => s.total))}</TableCell>
          <TableCell className="text-right tabular-nums">{tl(sum((s) => s.paid))}</TableCell>
          <TableCell className="text-right tabular-nums">{tl(sum((s) => s.owed))}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
