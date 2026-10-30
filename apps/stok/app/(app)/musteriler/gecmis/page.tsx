import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { listActivity } from "@/lib/activity";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { ActivityList, type ActivityRow } from "./activity-list";

export const metadata = { title: "İşlem geçmişi | Artek" };

export default async function ActivityPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "crm.view")) return <NoAccess />;
  const rows: ActivityRow[] = (await listActivity(requestHeaders)).map((r) => ({
    id: r.id,
    entity: r.entity,
    entityId: r.entityId,
    label: r.label,
    action: r.action,
    detail: r.detail,
    who: r.author ?? (r.via === "rutin" ? "Rutin" : r.via === "fatura" ? "Fatura" : "Sistem"),
    at: r.createdAt.toISOString(),
  }));
  return (
    <PanelShell
      title="İşlem geçmişi"
      lede={<>Faturalar, Müşteriler ve Adaylar&apos;da kim neyi ne zaman ekledi, değiştirdi ya da arşivledi. En yenisi en üstte.</>}
    >
      <ActivityList rows={rows} />
    </PanelShell>
  );
}
