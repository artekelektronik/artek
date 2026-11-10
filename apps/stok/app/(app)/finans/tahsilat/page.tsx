import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { CircleCheck, Clock, Receipt } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { day, tl } from "@/lib/finance-calc";
import { loadActor } from "@/lib/guard";
import { paymentStateLabels, paymentsTrackedFrom } from "@/lib/payment-state";
import { listCollections } from "@/lib/payments";
import { can } from "@/lib/permissions";

export const metadata = { title: "Tahsilat | Artek" };

type Sale = Awaited<ReturnType<typeof listCollections>>[number];

// The three lists of ADR-0008: what is owed, what is invoiced and paid, what was paid without an invoice.
export default async function CollectionsPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const sales = await listCollections(requestHeaders);
  const lists = [
    { key: "beklenen", title: "Beklenen ödemeler", rows: sales.filter((s) => s.state !== "odendi") },
    { key: "faturali", title: "Faturalı, ödenmiş", rows: sales.filter((s) => s.state === "odendi" && !s.proforma) },
    { key: "faturasiz", title: "Faturasız, ödenmiş", rows: sales.filter((s) => s.state === "odendi" && s.proforma) },
  ];
  const owed = (rows: Sale[]) => rows.reduce((t, s) => t + s.total - s.paid, 0);
  const totalOf = (rows: Sale[]) => rows.reduce((t, s) => t + s.total, 0);

  return (
    <PanelShell
      title="Tahsilat"
      lede={`Satışların ödemeleri, KDV dahil. Ödeme, faturanın ya da proformanın kendi sayfasından girilir. ${day(paymentsTrackedFrom)} öncesi satışlar ödenmiş sayılır.`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Beklenen ödeme" value={tl(owed(lists[0].rows))} note={`${lists[0].rows.length} satış`} icon={Clock} />
        <StatCard label="Faturalı, ödenmiş" value={tl(totalOf(lists[1].rows))} note={`${lists[1].rows.length} fatura`} icon={CircleCheck} />
        <StatCard label="Faturasız, ödenmiş" value={tl(totalOf(lists[2].rows))} note={`${lists[2].rows.length} proforma`} icon={Receipt} />
      </div>

      <PanelCard title="Satışlar" note="Proformalar onaylanmadan da burada görünür; ön ödeme alınabilir.">
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
            <TableCell className="text-right font-medium tabular-nums">{tl(Math.max(0, s.total - s.paid))}</TableCell>
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
          <TableCell className="text-right tabular-nums">{tl(sum((s) => Math.max(0, s.total - s.paid)))}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
