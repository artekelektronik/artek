import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { loadActor } from "@/lib/guard";
import { likelyCustomer } from "@/lib/lead-match";
import { listLeads } from "@/lib/leads";
import { can } from "@/lib/permissions";
import { LeadsBoard, type LeadRow } from "./leads-board";

export const metadata = { title: "Adaylar | Artek Müşteri Paneli" };

export default async function LeadsPage() {
  await connection();
  const actor = await loadActor(await headers());
  if (!can(actor, "crm.view")) return <NoAccess />;
  const [leads, customers] = await Promise.all([listLeads(), db.select({ id: customer.id, name: customer.name }).from(customer)]);
  const names = new Map(customers.map((c) => [c.id, c.name]));
  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    website: l.website,
    city: l.city,
    sector: l.sector,
    why: l.why,
    contact: l.contact,
    sources: l.sources,
    status: l.status,
    seenCount: l.seenCount,
    lastSeenAt: l.lastSeenAt.toISOString(),
    customer: l.customerId ? { id: l.customerId, name: names.get(l.customerId) ?? "" } : null,
    // Unlinked ones that look like one of our Müşteriler: a person confirms.
    candidate: l.customerId ? null : likelyCustomer(l.name, customers),
  }));

  return (
    <PanelShell
      active="adaylar"
      allowed={{ finance: can(actor, "finance.view"), crm: true }}
      lede={
        <>
          Henüz fatura kesmediğimiz firmalar. Satış rutinleri (günlük sinyal, haftalık radar, perşembe hedef firma) buldukları firmaları buraya
          ekler; aynı firma tekrar gelirse yeni kayıt açılmaz, <b>tekrar görüldü</b> diye işaretlenir. Bir aday müşteri olunca kartı müşteriye bağlanır.
        </>
      }
    >
      <LeadsBoard rows={rows} canEdit={can(actor, "crm.edit")} />
    </PanelShell>
  );
}
