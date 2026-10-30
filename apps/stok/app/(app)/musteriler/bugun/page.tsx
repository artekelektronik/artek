import { headers } from "next/headers";
import { connection } from "next/server";
import { and, asc, eq, gte, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { assistantSuggestion, customer } from "@/db/schema";
import { openSuggestion } from "@/lib/assistant";
import { loadSalesSummary } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listReasons } from "@/lib/reasons";
import { emailSignature, newerInvoices, resultsDue } from "@/lib/suggestions";
import { istanbulDate, istanbulTimeOn } from "@/lib/time";
import { PrepareButton, type SuggestionView } from "./suggestion-cards";
import { TodayBoard, type BoardSection, type Entry } from "./today-board";

export const metadata = { title: "Takipler | Artek" };

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
  const allReasons = await listReasons({ archived: true });
  const reasons = allReasons.filter((r) => !r.archivedAt);
  const reasonLabel = new Map(allReasons.map((r) => [r.id, r.label]));
  const proposals = rows.filter((r) => r.s.proposal && !r.s.proposalDecidedAt);
  const results = await resultsDue(today);
  // Same rule as openSuggestion, for the rows already loaded.
  const isOpen = (s: { status: string; askAgainOn: string | null }) =>
    s.status === "bekliyor" || s.status === "basarisiz" || (s.status === "onay_bekliyor" && (s.askAgainOn ?? "") <= today);
  // Our records and newer invoices are read now, so they are current even when the assistant's text isn't.
  // Waiting ones whose day to ask hasn't come yet: they don't block anything, but can be opened and changed any time.
  const isWaiting = (s: { status: string; askAgainOn: string | null }) => s.status === "onay_bekliyor" && (s.askAgainOn ?? "") > today;
  const shownRows = rows.filter((r) => isOpen(r.s) || isWaiting(r.s));
  const [summary, newer] = shownRows.length ? await Promise.all([loadSalesSummary(), newerInvoices(shownRows.map((r) => r.s))]) : [null, new Map()];
  const shown: SuggestionView[] = shownRows.map(({ s, c }) => {
    const r = summary?.byCustomer.get(c.id);
    return {
      ...s,
      customer: c,
      records: r ? { firstOn: r.firstOn, lastOn: r.lastOn, invoices: r.invoices, orderDays: r.orderDays, groups: r.groups, topProduct: r.topProduct } : null,
      newInvoice: newer.get(s.id) ?? null,
    };
  });
  const open = shown.filter(isOpen);
  const waiting = shown.filter(isWaiting);
  const earlier = open.filter((s) => s.forDay < today);
  const todays = open.filter((s) => s.forDay === today);
  const calls = todays.filter((s) => s.status === "bekliyor" && s.kind === "arama");
  const emails = todays.filter((s) => s.status === "bekliyor" && s.kind === "eposta");
  const failed = todays.filter((s) => s.status === "basarisiz");
  const done = rows.filter((r) => r.s.decidedAt && r.s.decidedAt >= istanbulTimeOn(today) && !isOpen(r.s) && !isWaiting(r.s));
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
    { title: "Onay bekleyenler", entries: waiting.map(entry) },
  ];

  return (
    <PanelShell
      title="Takipler"
      lede={
        <>
          <b>{dateText}</b> · {calls.length} arama, {emails.length} e-posta. Asistan her sabah 08:00’de müşterilerin sitelerini ve haberlerini
          okuyup hazırlar; e-postalar siz “Gönder” demeden gitmez.
        </>
      }
      warning={
        earlier.length > 0 && (
          <>
            <b>{earlier.length} öneri önceki günlerden açık.</b> Yapın, sonraya bırakın ya da neden yapılamadığını yazın; kapattıkça asistan yeni
            müşteri önerir.
          </>
        )
      }
      actions={canEdit && <PrepareButton />}
    >

      {open.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Bekleyen öneri yok. Müşteri kartlarından takip tarihi verdiğiniz müşteriler, o sabah burada görünür.
        </p>
      )}

      <TodayBoard sections={sections} today={today} reasons={reasons} signature={emailSignature} canEdit={canEdit} />

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
