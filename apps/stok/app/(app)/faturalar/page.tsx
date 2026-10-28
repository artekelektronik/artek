import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { day, tl } from "@/lib/finance";
import { invoiceReminderDays, invoiceReminderTo } from "@/lib/finance-reminders";
import { loadActor } from "@/lib/guard";
import { invoiceList } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { formatIstanbulTime } from "@/lib/time";
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
          QNB Dijital Köprü’den indirilen satış faturaları: <b>{rows.length.toLocaleString("tr-TR")}</b> fatura
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

      <PanelCard title="Yüklenen faturalar" note="Yeniden eskiye. Tutarlar KDV hariç; iade faturaları satışa sayılmaz.">
        <div className="max-h-[36rem] overflow-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz fatura yok. Yukarıdan ilk faturaları yükleyin.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Fatura no</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums">{day(r.issuedOn)}</TableCell>
                    <TableCell className="tabular-nums">{r.number}</TableCell>
                    <TableCell className="max-w-80 truncate">
                      {canSeeCustomers ? (
                        <Link href={`/musteriler?secili=${r.customerId}`} className="underline-offset-4 hover:underline">
                          {r.customer}
                        </Link>
                      ) : (
                        r.customer
                      )}
                    </TableCell>
                    <TableCell>{r.type === "IADE" ? "İade" : r.scenario === "EARSIVFATURA" ? "e-Arşiv" : "e-Fatura"}</TableCell>
                    <TableCell className="text-right tabular-nums">{tl(Number(r.netAmount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </PanelCard>
    </PanelShell>
  );
}
