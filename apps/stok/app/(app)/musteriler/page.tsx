import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell, panelLede, panelWarning } from "@/components/panel";
import { formerNames } from "@/lib/customer-changes";
import { financeSummary, shortName } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";
import { ContactImportButton } from "./contact-import-button";
import { NewCustomer } from "./new-customer";
import { ArchivedCustomers } from "./archived-customers";
import { CrmBoard, type CrmRow } from "./crm-board";

export const metadata = { title: "Müşteriler | Artek Müşteri Paneli" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ secili?: string }> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "crm.view")) return <NoAccess />;
  const allowed = { finance: can(actor, "finance.view"), crm: true };
  const [s, { secili }, oldNames] = await Promise.all([financeSummary(requestHeaders, "crm.view"), searchParams, formerNames()]);
  const byId = new Map(s.customerRows.map((c) => [c.id, c]));

  const archived = s.customerRows.filter((c) => c.archivedAt);
  // Müşteriler added by hand have no invoices yet; they get empty purchase figures.
  const withInvoices = new Set(s.customers.map((stats) => stats.customerId));
  const noInvoices = s.customerRows
    .filter((c) => !c.archivedAt && !withInvoices.has(c.id))
    .map((c) => ({
      customerId: c.id,
      sales: 0,
      invoices: 0,
      orderDays: 0,
      firstOn: "",
      lastOn: "",
      groups: [] as string[],
      topProduct: "",
      no: 5 as const,
      talk: "Henüz faturası yok; elle eklendi. İlk görüşmede ihtiyacını ve hangi ürünleri kullandığını sor.",
    }));
  const rows: CrmRow[] = [...s.customers, ...noInvoices].filter((stats) => !byId.get(stats.customerId)?.archivedAt).map((stats) => {
    const c = byId.get(stats.customerId)!;
    return {
      id: c.id,
      name: c.name,
      formerNames: oldNames.get(c.id) ?? [],
      short: shortName(c.name),
      city: c.city,
      district: c.district,
      isPerson: c.taxIdType === "TCKN",
      sales: stats.sales,
      invoices: stats.invoices,
      orderDays: stats.orderDays,
      firstOn: stats.firstOn,
      lastOn: stats.lastOn,
      groups: stats.groups,
      topProduct: stats.topProduct,
      no: stats.no,
      talk: stats.talk,
      phone: c.phone,
      email: c.email,
      website: c.website,
      about: c.about,
      contactSource: c.contactSource,
      status: c.status,
      nextFollowUpOn: c.nextFollowUpOn,
      followUpChannel: c.followUpChannel,
      emailOptOut: Boolean(c.emailOptOutAt),
    };
  });

  return (
    <PanelShell active="crm" allowed={allowed} lede={panelLede(s, allowed.finance)} warning={panelWarning(s.gaps, s.asOf)}>
      {can(actor, "crm.edit") && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">{rows.length > 0 && <ContactImportButton />}</div>
          <NewCustomer />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-muted-foreground">Henüz müşteri yok; faturalar yüklenince burada listelenir.</p>
      ) : (
        <CrmBoard
          rows={rows}
          canEdit={can(actor, "crm.edit")}
          today={istanbulDate(new Date())}
          initialSelected={secili && byId.has(secili) ? secili : undefined}
        />
      )}
      {archived.length > 0 && (
        <ArchivedCustomers
          rows={archived.map((c) => ({ id: c.id, name: c.name, reason: c.archiveReason, at: c.archivedAt!.toISOString() }))}
          canEdit={can(actor, "crm.edit")}
        />
      )}
      <p className="text-muted-foreground text-xs">
        Telefon, e-posta ve web adresleri firmaların kendi sitelerinden veya resmi rehberlerden alındı; kaynağı seçili müşteri kartında. Şahıs
        firmalarının bilgileri araştırılmadı.
      </p>
    </PanelShell>
  );
}
