import { headers } from "next/headers";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { assistantSuggestion, customer } from "@/db/schema";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { emailSignature } from "@/lib/suggestions";
import { istanbulDate } from "@/lib/time";
import { CallCard, EmailCard, FailedCard, PrepareButton, type SuggestionView } from "./suggestion-cards";

export const metadata = { title: "Bugün | Artek Müşteri Paneli" };

const doneText = { gonderildi: "E-posta gönderildi", yapildi: "Arandı", atlandi: "Atlandı" } as const;

export default async function TodayPage() {
  await connection();
  const actor = await loadActor(await headers());
  if (!can(actor, "crm.view")) return <NoAccess />;
  const canEdit = can(actor, "crm.edit");
  const today = istanbulDate(new Date());
  const rows = await db
    .select({ s: assistantSuggestion, c: { id: customer.id, name: customer.name, city: customer.city, phone: customer.phone, email: customer.email } })
    .from(assistantSuggestion)
    .innerJoin(customer, eq(customer.id, assistantSuggestion.customerId))
    .where(eq(assistantSuggestion.forDay, today))
    .orderBy(assistantSuggestion.createdAt);
  const items: SuggestionView[] = rows.map(({ s, c }) => ({ ...s, customer: c }));
  const open = items.filter((s) => s.status === "bekliyor");
  const calls = open.filter((s) => s.kind === "arama");
  const emails = open.filter((s) => s.kind === "eposta");
  const failed = items.filter((s) => s.status === "basarisiz");
  const done = items.filter((s) => s.status === "gonderildi" || s.status === "yapildi" || s.status === "atlandi");
  const dateText = new Date(`${today}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

  return (
    <PanelShell
      active="bugun"
      allowed={{ finance: can(actor, "finance.view"), crm: true }}
      lede={
        <>
          <b>{dateText}</b>: {calls.length} arama, {emails.length} e-posta önerisi. Asistan her sabah 08:00’de takip günü gelen müşterilere ve
          uzun süredir almayanlara bakar; sitelerini ve son haberlerini okuyup hazırlar. <b>E-postalar siz “Gönder” demeden gitmez.</b>
        </>
      }
    >
      {canEdit && <PrepareButton />}

      {open.length === 0 && failed.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Bugün için bekleyen öneri yok. Müşteri kartlarından takip tarihi verdiğiniz müşteriler, o sabah burada görünür.
        </p>
      )}

      {calls.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Aranacaklar</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {calls.map((s) => (canEdit ? <CallCard key={s.id} s={s} /> : <ReadOnly key={s.id} s={s} />))}
          </div>
        </section>
      )}

      {emails.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Gönderilecek e-postalar</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {emails.map((s) => (canEdit ? <EmailCard key={s.id} s={s} signature={emailSignature} /> : <ReadOnly key={s.id} s={s} />))}
          </div>
        </section>
      )}

      {failed.length > 0 && canEdit && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">Hazırlanamayanlar</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {failed.map((s) => (
              <FailedCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">Bugün tamamlananlar ({done.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {done.map((s) => (
              <li key={s.id}>
                {s.customer.name} · <span className="text-muted-foreground">{doneText[s.status as keyof typeof doneText]}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </PanelShell>
  );
}

function ReadOnly({ s }: { s: SuggestionView }) {
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border p-4 text-sm">
      <span className="font-medium">{s.customer.name}</span>
      <span className="text-muted-foreground">{s.reason}</span>
      {s.subject && <span>Konu: {s.subject}</span>}
    </article>
  );
}
