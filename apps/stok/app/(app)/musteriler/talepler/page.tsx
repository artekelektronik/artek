import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listRequests } from "@/lib/requests";
import { formatIstanbulTime } from "@/lib/time";
import { RequestsBoard } from "./requests-board";

export const metadata = { title: "Talepler | Artek" };

export default async function RequestsPage() {
  await connection();
  const actor = await loadActor(await headers());
  if (!can(actor, "crm.view")) return <NoAccess />;
  const rows = (await listRequests()).map((r) => ({
    ...r,
    createdAt: formatIstanbulTime(r.createdAt),
    statusAt: r.statusAt ? formatIstanbulTime(r.statusAt) : null,
  }));
  return (
    <PanelShell title="Talepler" lede="Sitedeki teklif formundan gelen talepler. Her talep ayrıca şirket e-postasına da düşer; yanıtlayınca burada işaretleyin.">
      <RequestsBoard rows={rows} canEdit={can(actor, "crm.edit")} />
    </PanelShell>
  );
}
