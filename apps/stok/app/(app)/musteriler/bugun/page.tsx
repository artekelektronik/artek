import { headers } from "next/headers";
import { connection } from "next/server";
import { and, asc, eq, gte, inArray, or } from "drizzle-orm";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { assistantSuggestion, customer } from "@/db/schema";
import { openSuggestion } from "@/lib/assistant";
import { closeReasons, type CloseReason } from "@/lib/close-reasons";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { emailSignature } from "@/lib/suggestions";
import { istanbulDate, istanbulTimeOn } from "@/lib/time";
import { ApprovalCard, CallCard, EmailCard, FailedCard, PrepareButton, type SuggestionView } from "./suggestion-cards";

export const metadata = { title: "Bugün | Artek Müşteri Paneli" };

const doneText = {
  gonderildi: "E-posta gönderildi",
  yapildi: "Arandı",
  atlandi: "Atlandı",
  yapilamadi: "Yapılamadı",
  ertelendi: "Sonraya bırakıldı",
  onay_bekliyor: "Onay bekleniyor",
} as const;
const closedStatuses = Object.keys(doneText) as (keyof typeof doneText)[];

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
    .where(
      or(
        openSuggestion(today),
        eq(assistantSuggestion.status, "onay_bekliyor"),
        and(inArray(assistantSuggestion.status, closedStatuses), gte(assistantSuggestion.decidedAt, istanbulTimeOn(today))),
      ),
    )
    .orderBy(asc(assistantSuggestion.forDay), asc(assistantSuggestion.createdAt));
  const items: SuggestionView[] = rows.map(({ s, c }) => ({ ...s, customer: c }));
  // Same rule as openSuggestion, for the rows already loaded.
  const isOpen = (s: { status: string; askAgainOn: string | null }) =>
    s.status === "bekliyor" || s.status === "basarisiz" || (s.status === "onay_bekliyor" && (s.askAgainOn ?? "") <= today);
  const open = items.filter(isOpen);
  const earlier = open.filter((s) => s.forDay < today);
  const todays = open.filter((s) => s.forDay === today);
  const calls = todays.filter((s) => s.status === "bekliyor" && s.kind === "arama");
  const emails = todays.filter((s) => s.status === "bekliyor" && s.kind === "eposta");
  const failed = todays.filter((s) => s.status === "basarisiz");
  const waiting = rows.filter((r) => r.s.status === "onay_bekliyor" && r.s.askAgainOn && r.s.askAgainOn > today);
  const done = rows.filter((r) => r.s.decidedAt && r.s.decidedAt >= istanbulTimeOn(today) && !isOpen(r.s));
  const dateText = new Date(`${today}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

  const card = (s: SuggestionView) => {
    if (!canEdit) return <ReadOnly key={s.id} s={s} />;
    if (s.status === "onay_bekliyor") return <ApprovalCard key={s.id} s={s} today={today} />;
    if (s.status === "basarisiz") return <FailedCard key={s.id} s={s} today={today} />;
    return s.kind === "arama" ? <CallCard key={s.id} s={s} today={today} /> : <EmailCard key={s.id} s={s} signature={emailSignature} today={today} />;
  };

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
      {earlier.length > 0 && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <b>{earlier.length} öneri önceki günlerden kapatılmadı.</b> Bunları kapatınca asistan yeni müşteri önerir. Her öneri için yapın, ya da
          neden yapılamadığını, ne zamana bırakıldığını veya neyi beklediğinizi yazın. Takip günü gelen müşteriler yine gelir.
        </p>
      )}

      {canEdit && <PrepareButton />}

      {open.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Bekleyen öneri yok. Müşteri kartlarından takip tarihi verdiğiniz müşteriler, o sabah burada görünür.
        </p>
      )}

      {earlier.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Önceki günlerden kalanlar</h2>
          <div className="grid gap-3 lg:grid-cols-2">{earlier.map(card)}</div>
        </section>
      )}

      {calls.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Aranacaklar</h2>
          <div className="grid gap-3 lg:grid-cols-2">{calls.map(card)}</div>
        </section>
      )}

      {emails.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Gönderilecek e-postalar</h2>
          <div className="grid gap-3 lg:grid-cols-2">{emails.map(card)}</div>
        </section>
      )}

      {failed.length > 0 && canEdit && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">Hazırlanamayanlar</h2>
          <div className="grid gap-3 lg:grid-cols-2">{failed.map(card)}</div>
        </section>
      )}

      {waiting.length > 0 && (
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">Onay bekleyenler ({waiting.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {waiting.map(({ s, c }) => (
              <li key={s.id}>
                {c.name} · <span className="text-muted-foreground">{s.waitingFor}; {s.askAgainOn} günü tekrar sorulacak</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {done.length > 0 && (
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">Bugün kapatılanlar ({done.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {done.map(({ s, c }) => (
              <li key={s.id}>
                {c.name} ·{" "}
                <span className="text-muted-foreground">
                  {doneText[s.status as keyof typeof doneText]}
                  {s.closeReason && `: ${closeReasons[s.closeReason as CloseReason]?.label ?? s.closeReason}`}
                </span>
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
