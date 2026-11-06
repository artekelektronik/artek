import { headers } from "next/headers";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { day } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { invoiceList, invoiceReview } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { formatIstanbulTime } from "@/lib/time";
import { InvoiceSheet } from "./invoice-sheet";
import { InvoiceTable } from "./invoice-table";
import { InvoiceUpload } from "./invoice-upload";

export const metadata = { title: "Faturalar | Artek" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ fatura?: string }> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const canUpload = can(actor, "finance.edit");
  const canSeeCustomers = can(actor, "crm.view");
  const { fatura } = await searchParams;
  const [{ rows, lastUpload, gaps }, review] = await Promise.all([
    invoiceList(requestHeaders),
    fatura ? invoiceReview(requestHeaders, fatura) : null,
  ]);
  const waiting = rows.filter((r) => r.status === "taslak" && !r.archivedAt).length;

  return (
    <PanelShell
      title="Faturalar"
      warning={
        gaps.length > 0 && (
          <>
            <b>{gaps.reduce((n, g) => n + g.to - g.from + 1, 0)} fatura numarası eksik.</b> Yüklenmedi ya da iptal edildi.{" "}
            <a href="#eksik">Listeyi gör</a>
          </>
        )
      }
      lede={
        <>
          QNB Dijital Köprü’den indirilen satış faturaları{lastUpload && <>, son yükleme {formatIstanbulTime(lastUpload)}</>}.
          {waiting > 0 && (
            <>
              {" "}
              <b>{waiting.toLocaleString("tr-TR")}</b> fatura onay bekliyor; onaylanınca stoktan düşer ve Finans’a eklenir.
            </>
          )}
        </>
      }
      actions={canUpload && <InvoiceUpload />}
    >
      <PanelCard title="Faturalar" note="Tutarlar KDV hariç; iade faturaları satışa sayılmaz.">
        <InvoiceTable
          rows={rows.map((r) => ({ ...r, archivedAt: r.archivedAt?.toISOString() ?? null }))}
          linkCustomers={canSeeCustomers}
          canEdit={canUpload}
        />
      </PanelCard>

      <InvoiceSheet
        review={review}
        canEdit={canUpload}
      />

      {gaps.length > 0 && (
        <PanelCard
          id="eksik"
          title="Eksik fatura numaraları"
          note="Numara sırasında boşluk var: bu faturalar henüz yüklenmedi ya da iptal edildi. İptal değilse PDF’lerini yükleyin."
        >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seri</TableHead>
                  <TableHead>Eksik numaralar</TableHead>
                  <TableHead>Bu tarihler arasında</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((g) => (
                  <TableRow key={`${g.series}-${g.from}`}>
                    <TableCell>{g.series}</TableCell>
                    <TableCell className="tabular-nums">
                      {g.from === g.to ? g.from : `${g.from}–${g.to} (${g.to - g.from + 1} fatura)`}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {day(g.after)} – {day(g.before)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </PanelCard>
      )}
    </PanelShell>
  );
}
