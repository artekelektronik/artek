import Anthropic from "@anthropic-ai/sdk";
import { and, asc, desc, eq, gt, inArray, isNull, lte, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { assistantSuggestion, closeReason, customer, customerNote, invoice } from "../db/schema";
import { factsFor, redraftFor } from "./assistant";
import { askAgainDays, otherReasonId } from "./close-reasons";
import { resendSender, type EmailSender } from "./email";
import { loadSalesSummary } from "./finance";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { applyEffect, interpretNote } from "./reasons";
import { maxResultReasks, outcomeLabels, resultAfterWorkingDays, type Outcome } from "./outcomes";
import { addDays, addWorkingDays, istanbulDate } from "./time";

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
        resultAskOn: addWorkingDays(istanbulDate(new Date()), resultAfterWorkingDays),
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
      .set({
        status: "yapildi",
        doneOn: calledOn,
        resultAskOn: addWorkingDays(calledOn, resultAfterWorkingDays),
        decidedAt: new Date(),
        decidedBy: actor.userId,
      })
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
    reason: z.string().min(1, { error: "Bir sebep seçin." }),
    note: z.string().trim().max(4000).default(""),
  })
  .refine((v) => v.reason !== otherReasonId || v.note, { error: "\"Diğer\" için kısa bir not yazın.", path: ["note"] });

// Couldn't be done. The reason's effect may close the Müşteri for good or bring it back later. When the reason
// itself does nothing and there's a note, the assistant reads the note and proposes what to do, for a person to accept.
export async function closeUndone(headers: Headers, input: z.input<typeof undoneInput>, client?: Anthropic) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(undoneInput, input);
  const [reason] = await db
    .select()
    .from(closeReason)
    .where(and(eq(closeReason.id, data.reason), isNull(closeReason.archivedAt)));
  if (!reason) throw new UserError("Bir sebep seçin.");
  const s = await closable(data.id);
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ status: "yapilamadi", closeReason: reason.id, closeNote: data.note || null, decidedAt: new Date(), decidedBy: actor.userId })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({
      customerId: s.customerId,
      userId: actor.userId,
      body: `Yapılamadı: ${reason.label}${data.note ? `. ${data.note}` : ""}`,
    });
    await applyEffect(tx, s.customerId, reason);
  });

  if (reason.effect !== "not" || !data.note) return;
  if (!client && !process.env.ANTHROPIC_API_KEY) return;
  try {
    const proposal = await interpretNote(client ?? new Anthropic(), data.note);
    if (proposal.effect === "not" && !proposal.newName) return;
    await db.update(assistantSuggestion).set({ proposal }).where(eq(assistantSuggestion.id, s.id));
  } catch (error) {
    // The close is saved either way; without a reading the note simply stays a note.
    console.error("Not okunamadı:", error);
  }
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

// Done ones whose result hasn't been entered; Bugün asks about them from resultAskOn on.
async function awaitingResult(id: string) {
  const [s] = await db
    .select()
    .from(assistantSuggestion)
    .where(and(eq(assistantSuggestion.id, id), inArray(assistantSuggestion.status, ["gonderildi", "yapildi"]), isNull(assistantSuggestion.outcome)));
  if (!s) throw new UserError("Bu temasın sonucu zaten girildi.");
  return s;
}

const outcomeStatus = { teklif: "teklif_verildi", siparis: "siparis_geldi", ilgilenmiyor: "ilgilenmiyor" } as const;

const resultInput = z.object({
  id: z.uuid(),
  outcome: z.enum(["cevap_geldi", "teklif", "siparis", "cevap_yok", "ilgilenmiyor"], { error: "Ne olduğunu seçin." }),
  note: z.string().trim().max(4000).default(""),
  nextFollowUpOn: day.optional(), // "Cevap yok": when to try again
  followUpChannel: z.enum(["telefon", "eposta"]).optional(),
});

// "Sonuç ne oldu?": recorded on the suggestion and the customer's notes; some answers also move the CRM status.
export async function recordResult(headers: Headers, input: z.input<typeof resultInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(resultInput, input);
  const s = await awaitingResult(data.id);
  const status = outcomeStatus[data.outcome as keyof typeof outcomeStatus];
  const retry = data.outcome === "cevap_yok" && data.nextFollowUpOn;
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ outcome: data.outcome, outcomeNote: data.note || null, outcomeAt: new Date() })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({
      customerId: s.customerId,
      userId: actor.userId,
      body: `Sonuç (${s.doneOn} temasından): ${outcomeLabels[data.outcome]}${data.note ? `. ${data.note}` : ""}`,
    });
    if (status || retry) {
      await tx
        .update(customer)
        .set({
          ...(status && { status }),
          ...(retry && { nextFollowUpOn: data.nextFollowUpOn, ...(data.followUpChannel && { followUpChannel: data.followUpChannel }) }),
          updatedAt: new Date(),
        })
        .where(eq(customer.id, s.customerId));
    }
  });
}

// Emails and calls whose "Sonuç ne oldu?" is due, each with the first sales invoice that came after the contact.
export async function resultsDue(today: string) {
  const rows = await db
    .select({ s: assistantSuggestion, c: { id: customer.id, name: customer.name, city: customer.city } })
    .from(assistantSuggestion)
    .innerJoin(customer, eq(customer.id, assistantSuggestion.customerId))
    .where(
      and(inArray(assistantSuggestion.status, ["gonderildi", "yapildi"]), isNull(assistantSuggestion.outcome), lte(assistantSuggestion.resultAskOn, today)),
    )
    .orderBy(asc(assistantSuggestion.resultAskOn));
  return Promise.all(
    rows.map(async ({ s, c }) => {
      const [after] = await db
        .select({ number: invoice.number, issuedOn: invoice.issuedOn })
        .from(invoice)
        .where(and(eq(invoice.customerId, s.customerId), gt(invoice.issuedOn, s.doneOn!), ne(invoice.type, "IADE")))
        .orderBy(asc(invoice.issuedOn))
        .limit(1);
      return { ...s, customer: c, invoiceAfter: after ?? null };
    }),
  );
}

// "Sonra sor": asks again a few working days later; after the last time it is recorded as "girilmedi".
export async function askResultLater(headers: Headers, id: string) {
  await requirePermission(headers, "crm.edit");
  const s = await awaitingResult(id);
  const today = istanbulDate(new Date());
  const changes: { resultAsks: number; resultAskOn?: string; outcome?: Outcome; outcomeAt?: Date } =
    s.resultAsks >= maxResultReasks
      ? { resultAsks: s.resultAsks, outcome: "girilmedi", outcomeAt: new Date() }
      : { resultAsks: s.resultAsks + 1, resultAskOn: addWorkingDays(today, resultAfterWorkingDays) };
  await db.update(assistantSuggestion).set(changes).where(eq(assistantSuggestion.id, s.id));
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

const stepInput = z.object({ id: z.uuid(), index: z.number().int().min(0), done: z.boolean() });

// Ticks or unticks one step of the to-do list, with who and when.
export async function toggleStep(headers: Headers, input: z.input<typeof stepInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(stepInput, input);
  const s = await closable(data.id);
  if (!s.steps[data.index]) throw new UserError("Adım bulunamadı.");
  const steps = s.steps.map((step, i) =>
    i === data.index ? { ...step, doneAt: data.done ? new Date().toISOString() : null, doneBy: data.done ? actor.name : null } : step,
  );
  await db.update(assistantSuggestion).set({ steps }).where(eq(assistantSuggestion.id, s.id));
}

// For each open suggestion, the latest sales invoice uploaded after it was written: its records are out of date.
export async function newerInvoices(suggestions: { id: string; customerId: string; createdAt: Date; refreshedAt: Date | null }[]) {
  const found = new Map<string, { number: string; issuedOn: string }>();
  for (const s of suggestions) {
    const [latest] = await db
      .select({ number: invoice.number, issuedOn: invoice.issuedOn })
      .from(invoice)
      .where(and(eq(invoice.customerId, s.customerId), gt(invoice.uploadedAt, s.refreshedAt ?? s.createdAt), ne(invoice.type, "IADE")))
      .orderBy(desc(invoice.issuedOn))
      .limit(1);
    if (latest) found.set(s.id, latest);
  }
  return found;
}

// "Analizi güncelle": rewrites a waiting suggestion from today's records, keeping the morning's findings. The ticks
// start over, since the steps are new.
export async function refreshSuggestion(headers: Headers, id: string, client?: Anthropic) {
  await requirePermission(headers, "crm.edit");
  const [s] = await db
    .select()
    .from(assistantSuggestion)
    .where(and(eq(assistantSuggestion.id, id), eq(assistantSuggestion.status, "bekliyor")));
  if (!s) throw new UserError("Bu öneri bulunamadı ya da zaten kapatıldı.");
  if (!client && !process.env.ANTHROPIC_API_KEY) throw new UserError("Asistan şu an kullanılamıyor.");
  const { facts } = await factsFor(s.customerId, await loadSalesSummary());
  let result;
  try {
    result = await redraftFor(client ?? new Anthropic(), facts, s.kind, s.findings);
  } catch (error) {
    console.error("Öneri güncellenemedi:", error);
    throw new UserError("Asistan şu an cevap vermedi; birazdan tekrar deneyin.");
  }
  const { draft, model } = result;
  await db
    .update(assistantSuggestion)
    .set({
      reason: `${s.scheduled ? "Takip günü geldi. " : ""}${draft.reason}`,
      analysis: draft.analysis,
      steps: draft.steps.map((text) => ({ text, doneAt: null, doneBy: null })),
      talkingPoints: draft.talking_points,
      subject: s.kind === "eposta" ? draft.email_subject : null,
      body: s.kind === "eposta" ? draft.email_body : null,
      model,
      refreshedAt: new Date(),
    })
    .where(eq(assistantSuggestion.id, s.id));
}

// "Artık gerek yok": a newer invoice shows the customer is buying, so the suggestion is closed without a contact.
export async function closeNotNeeded(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "crm.edit");
  const s = await closable(id);
  const latest = (await newerInvoices([s])).get(s.id);
  const note = latest ? `Yeni fatura geldi: ${latest.number}, ${latest.issuedOn}.` : "Artık gerek yok.";
  await db.transaction(async (tx) => {
    await tx
      .update(assistantSuggestion)
      .set({ status: "atlandi", closeNote: note, decidedAt: new Date(), decidedBy: actor.userId })
      .where(eq(assistantSuggestion.id, s.id));
    await tx.insert(customerNote).values({ customerId: s.customerId, userId: actor.userId, body: `Öneri kapatıldı, gerek kalmadı. ${note}` });
  });
}
