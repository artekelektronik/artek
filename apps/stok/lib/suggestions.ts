import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { assistantSuggestion, customer, customerNote } from "../db/schema";
import { resendSender, type EmailSender } from "./email";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";

// What a person does with a morning suggestion. Every email goes out only from here, after someone pressed Gönder.

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
      .set({ status: "gonderildi", subject: data.subject, body: data.body, decidedAt: new Date(), decidedBy: actor.userId, error: null })
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
  nextFollowUpOn: day,
});

export async function completeCall(headers: Headers, input: z.input<typeof callInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(callInput, input);
  const s = await pending(data.id, "arama");
  await db.transaction(async (tx) => {
    await tx.update(assistantSuggestion).set({ status: "yapildi", decidedAt: new Date(), decidedBy: actor.userId }).where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Arandı: ${data.note}` });
    await tx
      .update(customer)
      .set({ status: "arandi", nextFollowUpOn: data.nextFollowUpOn, updatedAt: new Date() })
      .where(eq(customer.id, s.customerId));
  });
}

// Not today. A scheduled follow-up is cleared so it doesn't come back every morning; give a date to move it.
export async function skipSuggestion(headers: Headers, input: { id: string; nextFollowUpOn?: string }) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(z.object({ id: z.uuid(), nextFollowUpOn: day }), { nextFollowUpOn: "", ...input });
  const [s] = await db.select().from(assistantSuggestion).where(eq(assistantSuggestion.id, data.id));
  if (!s) throw new UserError("Öneri bulunamadı.");
  if (s.status !== "bekliyor" && s.status !== "basarisiz") throw new UserError("Bu öneri zaten işlendi.");
  await db.transaction(async (tx) => {
    await tx.update(assistantSuggestion).set({ status: "atlandi", decidedAt: new Date(), decidedBy: actor.userId }).where(eq(assistantSuggestion.id, s.id));
    await tx.update(customer).set({ nextFollowUpOn: data.nextFollowUpOn, updatedAt: new Date() }).where(eq(customer.id, s.customerId));
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
