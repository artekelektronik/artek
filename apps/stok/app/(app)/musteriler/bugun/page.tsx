import { headers } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { and, asc, eq, gte, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { assistantSuggestion, customer } from "@/db/schema";
import { openSuggestion } from "@/lib/assistant";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listReasons } from "@/lib/reasons";
import { emailSignature, resultsDue } from "@/lib/suggestions";
import { istanbulDate, istanbulTimeOn } from "@/lib/time";
import { PrepareButton, type SuggestionView } from "./suggestion-cards";
import { TodayBoard, type BoardSection, type Entry } from "./today-board";

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
        and(isNotNull(assistantSuggestion.proposal), isNull(assistantSuggestion.proposalDecidedAt)),
      ),
    )
    .orderBy(asc(assistantSuggestion.forDay), asc(assistantSuggestion.createdAt));
  const items: SuggestionView[] = rows.map(({ s, c }) => ({ ...s, customer: c }));
  const allReasons = await listReasons({ archived: true });
  const reasons = allReasons.filter((r) => !r.archivedAt);
  const reasonLabel = new Map(allReasons.map((r) => [r.id, r.label]));
  const proposals = rows.filter((r) => r.s.proposal && !r.s.proposalDecidedAt);
  const results = await resultsDue(today);
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

  const entry = (s: SuggestionView): Entry => ({ key: s.id, type: "suggestion", s });
  const sections: BoardSection[] = [
    {
      title: "Notlardan çıkan öneriler",
      entries: canEdit
        ? proposals.map(({ s, c }) => ({ key: `not-${s.id}`, type: "proposal", p: { id: s.id, customer: c, closeNote: s.closeNote, proposal: s.proposal! } }))
        : [],
    },
    { title: "Sonuç ne oldu?", entries: canEdit ? results.map((r) => ({ key: `sonuc-${r.id}`, type: "result", r })) : [] },
    { title: "Önceki günlerden kalanlar", entries: earlier.map(entry) },
    { title: "Aranacaklar", entries: calls.map(entry) },
    { title: "Gönderilecek e-postalar", entries: emails.map(entry) },
    { title: "Hazırlanamayanlar", entries: canEdit ? failed.map(entry) : [] },
  ];

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

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PrepareButton />
          <Link href="/musteriler/sebepler" className="text-muted-foreground text-xs underline-offset-4 hover:underline">
            Kapatma sebeplerini düzenle
          </Link>
        </div>
      )}

      {open.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Bekleyen öneri yok. Müşteri kartlarından takip tarihi verdiğiniz müşteriler, o sabah burada görünür.
        </p>
      )}

      <TodayBoard sections={sections} today={today} reasons={reasons} signature={emailSignature} canEdit={canEdit} />

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
                  {s.closeReason && `: ${reasonLabel.get(s.closeReason) ?? s.closeReason}`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </PanelShell>
  );
}
