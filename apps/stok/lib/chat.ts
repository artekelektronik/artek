import Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { assistantSuggestion, chatMessage, customer, type ChatProposal } from "../db/schema";
import { openSuggestion } from "./assistant";
import { loadSalesSummary, priorities, tl } from "./finance";
import { listLeads } from "./leads";
import { addDays, istanbulDate } from "./time";

// The Bugün chat: a person asks about customers, leads and sales; Claude answers from our records and the web.
// It never changes anything itself: a follow-up it proposes comes back as a button the person clicks.

export const chatModel = "claude-opus-5-5";
// Only the newest messages go to the model: the whole day stays on screen, but a long chat doesn't grow the bill.
const sentMessages = 10;

const instructions = `Sen Artek Elektronik'in satış asistanısın. Artek ferrit nüve, toroid, bobin, filtre ve özel trafo üretip satan küçük bir firma.
Seninle konuşanlar satış ve ofis çalışanları; teknik değiller. Kısa, sade ve sıcak Türkçe yaz; karşındakine hep "siz" de. Tarihleri "1 Eylül 2025" gibi yaz.

- Cevapların kısa olsun: birkaç kısa paragraf ya da "• " ile başlayan maddeler. Başlık, tablo ya da markdown işareti (#, **, |) kullanma.
- Sayıları ve müşteri adlarını aşağıdaki kayıtlardan al; kayıtlarda olmayan bir şeyi biliyormuş gibi yazma. Emin değilsen söyle.
- Bir firma hakkında güncel haber gerekiyorsa internette ara ve bulduğunu kaynağıyla kısaca anlat.
- Birini aramayı ya da ona e-posta yazmayı önerdiğinde takip_oner aracını çağır; bir cevapta en fazla 3 müşteri için, en önemlilerini seç. "Açık takipler" listesinde zaten olan müşteriler için çağırma; onlar için "zaten Takipler'de" de. Bu araç hiçbir şeyi kaydetmez; kullanıcıya bir "Takiplere ekle" butonu gösterir. Araçları önce çağır, cevabı sonra bir kez yaz; butonlardan en fazla bir kısa cümleyle bahset. Kendin bir şey kaydettiğini, gönderdiğini ya da aradığını asla söyleme.
- Tutarlar KDV hariçtir. "Takipler" sekmesi, asistanın her sabah hazırladığı arama ve e-posta listesidir.`;

const proposalTool: Anthropic.Beta.BetaTool = {
  name: "takip_oner",
  description:
    "Kullanıcıya bir müşteri için 'Takiplere ekle' butonu gösterir. Hiçbir şeyi kaydetmez; kullanıcı butona basarsa o gün için takip açılır.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      musteri_id: { type: "string", description: "Kayıtlardaki müşteri id'si" },
      tur: { type: "string", enum: ["arama", "eposta"] },
      gun: { type: "string", description: "Takip günü, YYYY-AA-GG" },
      neden: { type: "string", description: "Tek cümle: neden şimdi" },
    },
    required: ["musteri_id", "tur", "gun", "neden"],
    additionalProperties: false,
  },
};
const proposalInput = z.object({
  musteri_id: z.string(),
  tur: z.enum(["arama", "eposta"]),
  gun: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  neden: z.string(),
});

export type ChatTurn = { role: "user" | "assistant"; text: string; proposals?: ChatProposal[] };
export type FollowUpProposal = ChatProposal;

// What the assistant knows: today's open Takipler, every customer in one line, and the newest Adaylar.
async function records(today: string) {
  const [summary, leads, open] = await Promise.all([
    loadSalesSummary(),
    listLeads(),
    db
      .select({ customerId: customer.id, name: customer.name, kind: assistantSuggestion.kind, reason: assistantSuggestion.reason, forDay: assistantSuggestion.forDay })
      .from(assistantSuggestion)
      .innerJoin(customer, eq(customer.id, assistantSuggestion.customerId))
      .where(openSuggestion(today)),
  ]);
  const customers = summary.customerRows
    .filter((c) => !c.archivedAt)
    .map((c) => {
      const s = summary.byCustomer.get(c.id);
      return [
        `id:${c.id}`,
        c.name,
        c.city,
        s ? `${tl(s.sales)} satış, ${s.orderDays} sipariş, son alım ${s.lastOn}, ${priorities[s.no - 1]?.label ?? ""}` : "faturası yok",
        s?.groups.length ? `ürünler: ${s.groups.slice(0, 3).join(", ")}` : "",
        s?.topProduct ? `en çok aldığı: ${s.topProduct}` : "",
        `durum: ${c.status}`,
        c.nextFollowUpOn ? `takip: ${c.nextFollowUpOn}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    });
  const newLeads = leads
    .filter((l) => !l.archivedAt)
    .slice(0, 30)
    .map((l) => [l.name, l.city, l.sector, l.why, `durum: ${l.status}`].filter(Boolean).join(" | "));
  const text = [
    `Bugün: ${today}. Faturalardaki son tarih: ${summary.asOf}.`,
    `Açık takipler (${open.length}):\n${open.map((o) => `• ${o.name} — ${o.kind === "arama" ? "arama" : "e-posta"}, ${o.forDay}: ${o.reason}`).join("\n")}`,
    `Müşteriler (${customers.length}):\n${customers.join("\n")}`,
    `Son adaylar (henüz fatura kesilmemiş firmalar):\n${newLeads.join("\n")}`,
  ].join("\n\n");
  return { text, onTakipler: new Set(open.map((o) => o.customerId)) };
}

// Saved answers keep only their text; the buttons they showed are added back, so the assistant knows it already offered them.
const withButtons = (t: ChatTurn) =>
  t.proposals?.length
    ? `${t.text}\n\n[Bu cevabın altında gösterilen "Takiplere ekle" butonları: ${t.proposals.map((p) => `${p.name} (${p.kind}, ${p.on})`).join("; ")}]`
    : t.text;

export async function chat(history: ChatTurn[], client = new Anthropic()): Promise<{ text: string; proposals: FollowUpProposal[] }> {
  const today = istanbulDate(new Date());
  const recent = history.slice(-sentMessages);
  // The conversation sent must start with the person's message.
  const messages: Anthropic.Beta.BetaMessageParam[] = recent.slice(recent.findIndex((t) => t.role === "user")).map((t) => ({ role: t.role, content: withButtons(t) }));
  const proposals: z.infer<typeof proposalInput>[] = [];
  const known = await records(today);
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: instructions },
    { type: "text", text: known.text, cache_control: { type: "ephemeral" } },
  ];
  const parts: string[] = [];
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.beta.messages.create({
      model: chatModel,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, user_location: { type: "approximate", country: "TR" } }, proposalTool],
      messages,
    });
    if (response.stop_reason === "refusal") throw new Error("Asistan bu soruya cevap vermedi; başka türlü sormayı deneyin.");
    if (response.stop_reason === "max_tokens") throw new Error("Cevap yarıda kesildi; soruyu daraltıp tekrar deneyin.");
    const said = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    if (said) parts.push(said);
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "pause_turn") continue;
    const calls = response.content.filter((b) => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || !calls.length) break;
    messages.push({
      role: "user",
      content: calls.map((call) => {
        const parsed = proposalInput.safeParse(call.input);
        if (parsed.success) proposals.push(parsed.data);
        return {
          type: "tool_result" as const,
          tool_use_id: call.id,
          content: parsed.success ? "Buton kullanıcıya gösterildi; kullanıcı isterse ekler." : "Girdi geçersiz; bu öneri gösterilmedi.",
          is_error: !parsed.success,
        };
      }),
    });
  }
  // Only customers we really have and that aren't on Takipler already, at most three; a past day becomes today.
  const ids = [...new Set(proposals.map((p) => p.musteri_id))].filter((id) => z.uuid().safeParse(id).success && !known.onTakipler.has(id));
  const found = ids.length ? await db.select({ id: customer.id, name: customer.name }).from(customer).where(inArray(customer.id, ids)) : [];
  const names = new Map(found.map((c) => [c.id, c.name]));
  return {
    text: parts.join("\n\n"),
    proposals: proposals
      .filter((p, i) => names.has(p.musteri_id) && proposals.findIndex((q) => q.musteri_id === p.musteri_id) === i)
      .slice(0, 3)
      .map((p) => ({ customerId: p.musteri_id, name: names.get(p.musteri_id)!, kind: p.tur, on: p.gun < today ? today : p.gun, why: p.neden })),
  };
}

// A question from Bugün: saved with today's chat, answered from the newest part of it, the answer saved too.
// If the assistant fails, the question is taken back so the person can simply ask again.
export async function askAssistant(userId: string, question: string) {
  const day = istanbulDate(new Date());
  const [asked] = await db.insert(chatMessage).values({ userId, day, role: "user", text: question }).returning();
  try {
    const today = await db.select().from(chatMessage).where(and(eq(chatMessage.userId, userId), eq(chatMessage.day, day))).orderBy(asc(chatMessage.createdAt));
    const answer = await chat(today.map((m) => ({ role: m.role, text: m.text, proposals: m.proposals })));
    const [saved] = await db.insert(chatMessage).values({ userId, day, role: "assistant", text: answer.text, proposals: answer.proposals }).returning();
    return saved;
  } catch (error) {
    await db.delete(chatMessage).where(eq(chatMessage.id, asked.id));
    throw error;
  }
}

// Today's chat in full, and the questions of the past week, for the person who asked them.
export async function chatHistory(userId: string, today: string) {
  const rows = await db
    .select()
    .from(chatMessage)
    .where(and(eq(chatMessage.userId, userId), gte(chatMessage.day, addDays(today, -7))))
    .orderBy(asc(chatMessage.createdAt));
  const earlier = rows.filter((m) => m.day < today);
  return {
    today: rows.filter((m) => m.day === today),
    earlierDays: [...new Set(earlier.map((m) => m.day))].sort().reverse().map((day) => ({ day, messages: earlier.filter((m) => m.day === day) })),
  };
}
