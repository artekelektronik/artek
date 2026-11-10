import { headers } from "next/headers";
import { connection } from "next/server";
import { DateRangeForm, type DateRangeParams } from "@/components/date-range-form";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { listActivity } from "@/lib/activity";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { dayRange } from "@/lib/time";
import { ActivityList, type ActivityRow } from "./activity-list";

export const metadata = { title: "İşlem geçmişi | Artek" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<DateRangeParams> }) {
  const params = await searchParams;
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "activity.view")) return <NoAccess />;
  const rows: ActivityRow[] = (await listActivity(requestHeaders, dayRange(params))).map((r) => ({ ...r, at: r.at.toISOString() }));
  return (
    <PanelShell
      title="İşlem geçmişi"
      lede="Sistemde kim neyi ne zaman yaptı: ürünler, fiyatlar, stok, faturalar, müşteriler, adaylar ve kullanıcılar. En yenisi en üstte. Fiyat, fatura ve müşteri kayıtlarını yalnızca o panelin izni olanlar görür."
    >
      <DateRangeForm params={params} />
      <ActivityList key={[params.baslangic, params.bitis].join("|")} rows={rows} />
    </PanelShell>
  );
}
