import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { assistantSuggestion, customer, customerNote } from "../db/schema";
import { askAgainDays, closeReasons, type CloseReason } from "./close-reasons";
import { resendSender, type EmailSender } from "./email";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { addDays, istanbulDate } from "./time";

// What a person does with a morning suggestion. Every email goes out only from here, after someone pressed Gönder.
// Each one is closed one of four ways: done, couldn't be done (with a reason), postponed to a day, or waiting for approval.

export const customerEmailFrom = "Artek Elektronik <artek@ferritnuve.com>";
export const customerEmailReplyTo = "artek@ferritnuve.com";
export const emailSignature = `Saygılarımızla,
Artek Elektronik
Kemankeş Mah. Erişteci Sok. Abed Han No:7, Karaköy / İstanbul
www.ferritnuve.com · artek@ferritnuve.com

Bu tür e-postaları almak istemiyorsanız bu e-postayı "istemiyorum" diye yanıtlamanız yeterli.`;

const day = z
  .string()
  .trim()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: "Tarih geçersiz." })
  .transform((v) => v || null);

async function pending(id: string, kind: "arama" | "eposta") {
  const [s] = await db
    .select()
    .from(assistantSuggestion)
    .where(and(eq(assistantSuggestion.id, id), eq(assistantSuggestion.kind, kind)));
  if (!s) throw new UserError("Öneri bulunamadı.");
  if (s.status !== "bekliyor") throw new UserError("Bu öneri zaten işlendi.");
  return s;
}

const sendInput = z.object({
  id: z.uuid(),
  subject: z.string().trim().min(1, { error: "Konu boş olamaz." }).max(200),
  body: z.string().trim().min(1, { error: "E-posta metni boş olamaz." }).max(5000),
  nextFollowUpOn: day,
});

export async function sendSuggestionEmail(headers: Headers, input: z.input<typeof sendInput>, send: EmailSender = resendSender) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(sendInput, input);
  const s = await pending(data.id, "eposta");
  const [c] = await db.select().from(customer).where(eq(customer.id, s.customerId));
  if (!c.email) throw new UserError("Müşterinin e-posta adresi yok.");
  if (c.emailOptOutAt) throw new UserError("Bu müşteri e-posta almak istemediğini bildirdi.");

  // The suggestion id is Resend's idempotency key, so a double click sends one email.
  await send({
    to: [c.email],
    from: customerEmailFrom,
    replyTo: customerEmailReplyTo,
    subject: data.subject,
    text: `${data.body}\n\n${emailSignature}`,
    idempotencyKey: s.id,
  });
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({
        status: "gonderildi",
        subject: data.subject,
        body: data.body,
        doneOn: istanbulDate(new Date()),
        decidedAt: new Date(),
        decidedBy: actor.userId,
        error: null,
      })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({
      customerId: c.id,
      userId: actor.userId,
      body: `E-posta gönderildi (${c.email}): ${data.subject}\n\n${data.body}`,
    });
    await tx.update(customer).set({ nextFollowUpOn: data.nextFollowUpOn, updatedAt: new Date() }).where(eq(customer.id, c.id));
  });
}

const callInput = z.object({
  id: z.uuid(),
  note: z.string().trim().min(1, { error: "Görüşmeden kısa bir not yazın." }).max(4000),
  calledOn: day.optional(), // empty means today
  nextFollowUpOn: day,
});

export async function completeCall(headers: Headers, input: z.input<typeof callInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(callInput, input);
  const today = istanbulDate(new Date());
  const calledOn = data.calledOn ?? today;
  if (calledOn > today) throw new UserError("Arama günü ileri bir tarih olamaz.");
  const s = await pending(data.id, "arama");
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ status: "yapildi", doneOn: calledOn, decidedAt: new Date(), decidedBy: actor.userId })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Arandı (${calledOn}): ${data.note}` });
    await tx
      .update(customer)
      .set({ status: "arandi", nextFollowUpOn: data.nextFollowUpOn, updatedAt: new Date() })
      .where(eq(customer.id, s.customerId));
  });
}

// Not done, failed, or back from waiting: what the other three ways of closing start from.
async function closable(id: string) {
  const [s] = await db
    .select()
    .from(assistantSuggestion)
    .where(and(eq(assistantSuggestion.id, id), inArray(assistantSuggestion.status, ["bekliyor", "basarisiz", "onay_bekliyor"])));
  if (!s) throw new UserError("Bu öneri bulunamadı ya da zaten kapatıldı.");
  return s;
}

const undoneInput = z
  .object({
    id: z.uuid(),
    reason: z.enum(Object.keys(closeReasons) as [CloseReason, ...CloseReason[]], { error: "Bir sebep seçin." }),
    note: z.string().trim().max(4000).default(""),
  })
  .refine((v) => v.reason !== "diger" || v.note, { error: "\"Diğer\" için kısa bir not yazın.", path: ["note"] });

// Couldn't be done. The reason may close the Müşteri for good ("Şirket kapanmış", "İlgilenmiyor").
export async function closeUndone(headers: Headers, input: z.input<typeof undoneInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(undoneInput, input);
  const s = await closable(data.id);
  const reason = closeReasons[data.reason];
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ status: "yapilamadi", closeReason: data.reason, closeNote: data.note || null, decidedAt: new Date(), decidedBy: actor.userId })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({
      customerId: s.customerId,
      userId: actor.userId,
      body: `Yapılamadı: ${reason.label}${data.note ? `. ${data.note}` : ""}`,
    });
    await tx
      .update(customer)
      .set({ ...(reason.status && { status: reason.status }), nextFollowUpOn: null, updatedAt: new Date() })
      .where(eq(customer.id, s.customerId));
  });
}

// Later: the day becomes the Müşteri's Takip date, so a fresh suggestion is prepared that morning.
export async function postponeSuggestion(headers: Headers, input: { id: string; until: string }) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(z.object({ id: z.uuid(), until: day }), input);
  if (!data.until) throw new UserError("Hangi güne bırakılacağını seçin.");
  if (data.until <= istanbulDate(new Date())) throw new UserError("Bugünden sonraki bir gün seçin.");
  const s = await closable(data.id);
  await db.transaction(async (tx) => {
    await tx.update(assistantSuggestion).set({ status: "ertelendi", decidedAt: new Date(), decidedBy: actor.userId }).where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Sonraya bırakıldı: ${data.until}` });
    await tx.update(customer).set({ nextFollowUpOn: data.until, updatedAt: new Date() }).where(eq(customer.id, s.customerId));
  });
}

const waitInput = z.object({ id: z.uuid(), waitingFor: z.string().trim().min(1, { error: "Neyi beklediğinizi kısaca yazın." }).max(500) });

// Waiting for an approval or missing information; Bugün asks "Onaylandı mı?" every few days until it is answered.
export async function waitForApproval(headers: Headers, input: z.input<typeof waitInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(waitInput, input);
  const s = await closable(data.id);
  const askAgainOn = addDays(istanbulDate(new Date()), askAgainDays);
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ status: "onay_bekliyor", waitingFor: data.waitingFor, askAgainOn, decidedAt: new Date(), decidedBy: actor.userId })
      .where(eq(assistantSuggestion.id, s.id));
    if (s.status !== "onay_bekliyor" || s.waitingFor !== data.waitingFor) {
      await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Onay bekleniyor: ${data.waitingFor}` });
    }
    await tx.update(customer).set({ nextFollowUpOn: null, updatedAt: new Date() }).where(eq(customer.id, s.customerId));
  });
}

// "Onaylandı": the suggestion is open again, to send or call now.
export async function approvalArrived(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "crm.edit");
  const s = await closable(id);
  if (s.status !== "onay_bekliyor") throw new UserError("Bu öneri onay beklemiyor.");
  await db.transaction(async (tx) => {
    await tx.update(assistantSuggestion).set({ status: "bekliyor", askAgainOn: null, decidedAt: null, decidedBy: null }).where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Onay geldi: ${s.waitingFor}` });
  });
}

// "İstemiyorum": no more email drafts for this customer; calls are still suggested.
export async function setEmailOptOut(headers: Headers, customerId: string, optOut: boolean) {
  await requirePermission(headers, "crm.edit");
  const updated = await db
    .update(customer)
    .set({ emailOptOutAt: optOut ? new Date() : null, updatedAt: new Date() })
    .where(eq(customer.id, customerId))
    .returning({ id: customer.id });
  if (!updated.length) throw new UserError("Müşteri bulunamadı.");
}
