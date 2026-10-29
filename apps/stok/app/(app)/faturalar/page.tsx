import { headers } from "next/headers";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { day } from "@/lib/finance";
import { invoiceReminderDays, invoiceReminderTo } from "@/lib/finance-reminders";
import { loadActor } from "@/lib/guard";
import { invoiceList } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { formatIstanbulTime, istanbulDate } from "@/lib/time";
import { InvoiceTable } from "./invoice-table";
import { InvoiceUpload } from "./invoice-upload";

export const metadata = { title: "Faturalar | Artek Stok" };

export default async function InvoicesPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const canUpload = can(actor, "finance.edit");
  const canSeeCustomers = can(actor, "crm.view");
  const { rows, lastUpload, gaps } = await invoiceList(requestHeaders);

  return (
    <PanelShell
      active="fatura"
      allowed={{ finance: true, crm: canSeeCustomers }}
      lede={
        <>
          QNB Dijital Köprü’den indirilen satış faturaları: <b>{rows.filter((r) => !r.archivedAt).length.toLocaleString("tr-TR")}</b> fatura
          {lastUpload && <>, son yükleme {formatIstanbulTime(lastUpload)}</>}. {invoiceReminderDays} gün yeni fatura yüklenmezse {invoiceReminderTo}{" "}
          adresine hatırlatma gider.
        </>
      }
    >
      {canUpload && (
        <PanelCard title="Fatura yükle" note="PDF veya zip. Finans ve müşteri paneli yükleme biter bitmez güncellenir.">
          <InvoiceUpload />
        </PanelCard>
      )}

      {gaps.length > 0 && (
        <PanelCard
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

      <PanelCard title="Yüklenen faturalar" note="Tutarlar KDV hariç; iade faturaları satışa sayılmaz. Sıralamak için sütun başlığına tıklayın.">
        <InvoiceTable
          rows={rows.map((r) => ({ ...r, archivedAt: r.archivedAt?.toISOString() ?? null }))}
          today={istanbulDate(new Date())}
          linkCustomers={canSeeCustomers}
          canEdit={canUpload}
        />
      </PanelCard>
    </PanelShell>
  );
}
