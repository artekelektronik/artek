import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listReasons } from "@/lib/reasons";
import { ReasonForm, ReasonRow } from "./reasons-editor";

export const metadata = { title: "Kapatma sebepleri | Artek Müşteri Paneli" };

export default async function ReasonsPage() {
  await connection();
  const actor = await loadActor(await headers());
  if (!can(actor, "crm.edit")) return <NoAccess />;
  const reasons = await listReasons();

  return (
    <PanelShell
      active="bugun"
      allowed={{ finance: can(actor, "finance.view"), crm: true }}
      lede={
        <>
          Bugün ekranında bir öneriyi <b>Yapılamadı</b> diye kapatırken seçilen sebepler. Her sebebin müşteriye etkisi var: bir daha önerilmez, birkaç
          gün sonra tekrar önerilir ya da sadece not düşülür. Kaldırdığınız bir sebep, onunla kapatılmış önerilerde görünmeye devam eder.
        </>
      }
    >
      <ul className="flex flex-col gap-2">
        {reasons.map((r, i) => (
          <ReasonRow key={r.id} r={r} first={i === 0} last={i === reasons.length - 1} />
        ))}
      </ul>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Yeni sebep</h2>
        <ReasonForm />
      </section>
    </PanelShell>
  );
}
