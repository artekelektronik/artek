import { headers } from "next/headers";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell, panelLede, panelWarning } from "@/components/panel";
import { financeSummary, pct, tl } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";

export const metadata = { title: "Ürünler | Artek Müşteri Paneli" };

export default async function ProductSalesPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const s = await financeSummary(requestHeaders, "finance.view");

  return (
    <PanelShell
      active="urun"
      allowed={{ finance: true, crm: can(actor, "crm.view") }}
      lede={panelLede(s, true)}
      warning={panelWarning(s.gaps, s.asOf)}
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
                <TableCell className="text-right tabular-nums">{tl(g.sales)}</TableCell>
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
                  <TableCell className="text-right tabular-nums">{tl(p.sales)}</TableCell>
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
