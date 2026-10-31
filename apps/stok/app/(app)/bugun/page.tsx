import { headers } from "next/headers";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { db } from "@/db";
import { assistantSuggestion, customer, type ChatProposal } from "@/db/schema";
import { openSuggestion } from "@/lib/assistant";
import { chatHistory } from "@/lib/chat";
import { loadSalesSummary, shortName, tlShort } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { listLeads } from "@/lib/leads";
import { can } from "@/lib/permissions";
import { addDays, istanbulDate } from "@/lib/time";
import { AssistantChat, type BriefItem } from "./assistant-chat";

export const metadata = { title: "Bugün | Artek" };

const dayText = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

const toView = (m: { id: string; role: "user" | "assistant"; text: string; proposals: ChatProposal[] }) => ({
  id: m.id,
  role: m.role,
  text: m.text,
  proposals: m.proposals,
});

// The assistant's page: what changed and what deserves attention today, then a conversation about it.
// The work itself (calls, e-mails) is on Takipler.
export default async function TodayPage() {
  await connection();
  const actor = await loadActor(await headers());
  if (!can(actor, "crm.view")) return <NoAccess />;
  const today = istanbulDate(new Date());
  const weekAgo = addDays(today, -7);
  const [open, summary, leads, history] = await Promise.all([
    db
      .select({ forDay: assistantSuggestion.forDay, name: customer.name })
      .from(assistantSuggestion)
      .innerJoin(customer, eq(customer.id, assistantSuggestion.customerId))
      .where(openSuggestion(today))
      .orderBy(asc(assistantSuggestion.forDay)),
    loadSalesSummary(),
    listLeads(),
    chatHistory(actor.userId, today),
  ]);

  const late = open.filter((o) => o.forDay < today).length;
  const names = new Map(summary.customerRows.map((c) => [c.id, c.name]));
  const winBack = summary.customers.filter((c) => c.no === 1 && !summary.customerRows.find((r) => r.id === c.customerId)?.archivedAt);
  const newLeads = leads.filter((l) => !l.archivedAt && l.lastSeenAt.toISOString().slice(0, 10) >= weekAgo);

  const items: BriefItem[] = [
    {
      tone: "green",
      icon: "takip",
      text: open.length
        ? `Takipler’de ${open.length} iş var${late ? `; ${late} tanesi önceki günlerden kaldı` : ""}. İlk sırada ${shortName(open[0].name)}.`
        : "Takipler’de bekleyen iş yok.",
      href: "/musteriler/bugun",
      action: "Takipler’e git",
    },
    {
      tone: "amber",
      icon: "geri",
      text: winBack.length
        ? `${winBack.length} müşteri eskiden düzenli alıyordu ama 3 aydır sipariş vermiyor. En büyüğü ${shortName(names.get(winBack[0].customerId) ?? "")}: toplam ${tlShort(winBack[0].sales)}, son alım ${dayText(winBack[0].lastOn)}.`
        : "Geri kazanılacak müşteri görünmüyor.",
      href: "/musteriler",
      action: "Müşterilere git",
    },
    {
      tone: "sky",
      icon: "aday",
      text: newLeads.length
        ? `Bu hafta Adaylar’a ${newLeads.length} firma düştü: ${newLeads
            .slice(0, 3)
            .map((l) => l.name)
            .join(", ")}${newLeads.length > 3 ? " ve diğerleri" : ""}.`
        : "Bu hafta yeni aday gelmedi.",
      href: "/musteriler/adaylar",
      action: "Adaylara git",
    },
    {
      tone: "violet",
      icon: "fatura",
      text: `Yüklenen en son fatura ${dayText(summary.asOf)} tarihli. Rakamlar ona göre hesaplanıyor.`,
      href: can(actor, "finance.view") ? "/faturalar" : undefined,
      action: "Faturalar",
    },
  ];

  const dateText = new Date(`${today}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
  return (
    <PanelShell title="Bugün" lede={<>{dateText} · Asistan kayıtlarımıza ve internete bakarak cevap verir; siz onaylamadan hiçbir şeyi değiştirmez.</>}>
      <AssistantChat
        brief={items}
        canEdit={can(actor, "crm.edit")}
        today={today}
        initial={history.today.map(toView)}
        earlierDays={history.earlierDays.map((d) => ({ day: d.day, messages: d.messages.map(toView) }))}
        // A button already pressed shows as added after a reload: the customer's follow-up day matches it.
        followUps={Object.fromEntries(summary.customerRows.filter((c) => c.nextFollowUpOn).map((c) => [c.id, c.nextFollowUpOn!]))}
      />
    </PanelShell>
  );
}
