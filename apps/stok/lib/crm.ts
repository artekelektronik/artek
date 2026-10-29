import Anthropic from "@anthropic-ai/sdk";
import { asc, desc, eq, and, lte, isNotNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customer, customerNote, customerStatus, followUpChannel, invoice, user } from "../db/schema";
import { customerChanges, interpretCardNote, matchFirm, recordChanges } from "./customer-changes";
import { isUuid, parseInput, UserError } from "./errors";
import { linksFor } from "./firm-links";
import { requirePermission } from "./guard";

export { customerStatusLabels, type CustomerStatus } from "./finance-calc";

export async function customerCard(headers: Headers, id: string) {
  await requirePermission(headers, "crm.view");
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(customer).where(eq(customer.id, id));
  if (!row) return null;
  return { ...row, ...(await customerHistory(headers, id)) };
}

const optional = z
  .string()
  .trim()
  .max(500)
  .transform((v) => v || null);

const updateInput = z.object({
  id: z.uuid(),
  phone: optional,
  email: optional.refine((v) => !v || z.email().safeParse(v).success, { error: "E-posta adresi geçersiz." }),
  website: optional,
  about: optional,
  contactSource: optional,
  status: z.enum(customerStatus.enumValues, { error: "Durum seçin." }),
  nextFollowUpOn: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: "Takip tarihi geçersiz." })
    .transform((v) => v || null),
  followUpChannel: z.enum(followUpChannel.enumValues, { error: "Takip şeklini seçin." }),
});

export async function updateCustomer(headers: Headers, input: z.input<typeof updateInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(updateInput, input);
  const { id, ...fields } = data;
  const [before] = await db.select().from(customer).where(eq(customer.id, id));
  if (!before) throw new UserError("Müşteri bulunamadı.");
  await db.transaction(async (tx) => {
    await tx.update(customer).set({ ...fields, updatedAt: new Date() }).where(eq(customer.id, id));
    const tracked = { phone: fields.phone, email: fields.email, website: fields.website, about: fields.about, status: fields.status };
    await recordChanges(tx, id, before, tracked, { source: "elle", userId: actor.userId });
  });
}

const noteInput = z.object({
  customerId: z.uuid(),
  body: z.string().trim().min(1, { error: "Not boş olamaz." }).max(4000, { error: "Not en fazla 4000 karakter olabilir." }),
});

// The parts of a card the list doesn't carry: notes and invoices, loaded when the card opens.
export async function customerHistory(headers: Headers, id: string) {
  await requirePermission(headers, "crm.view");
  if (!isUuid(id)) return { notes: [], invoices: [], changes: [], links: [] };
  const [invoices, notes, changes, links] = await Promise.all([
    db
      .select({ id: invoice.id, number: invoice.number, issuedOn: invoice.issuedOn, type: invoice.type, netAmount: invoice.netAmount })
      .from(invoice)
      .where(eq(invoice.customerId, id))
      .orderBy(desc(invoice.issuedOn)),
    db
      .select({
        id: customerNote.id,
        body: customerNote.body,
        createdAt: customerNote.createdAt,
        author: user.name,
        proposal: customerNote.proposal,
        proposalDecidedAt: customerNote.proposalDecidedAt,
      })
      .from(customerNote)
      .innerJoin(user, eq(user.id, customerNote.userId))
      .where(eq(customerNote.customerId, id))
      .orderBy(desc(customerNote.createdAt)),
    customerChanges(id),
    linksFor(id),
  ]);
  return { invoices, notes, changes, links };
}

// Notes are a history: added, never edited. The assistant reads each one and may propose changes to the card,
// which wait under the note until someone applies or rejects them.
export async function addCustomerNote(headers: Headers, input: z.input<typeof noteInput>, client?: Anthropic) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(noteInput, input);
  const [c] = await db.select().from(customer).where(eq(customer.id, data.customerId));
  if (!c) throw new UserError("Müşteri bulunamadı.");
  const [note] = await db.insert(customerNote).values({ customerId: c.id, userId: actor.userId, body: data.body }).returning({ id: customerNote.id });

  if (!client && !process.env.ANTHROPIC_API_KEY) return;
  try {
    const proposal = await interpretCardNote(client ?? new Anthropic(), c, data.body);
    if (!proposal.changes.length && !proposal.relatedFirm) return;
    const relatedFirmId = proposal.relatedFirm ? await matchFirm(proposal.relatedFirm, c.id) : null;
    await db.update(customerNote).set({ proposal: { ...proposal, relatedFirmId } }).where(eq(customerNote.id, note.id));
  } catch (error) {
    // The note is saved either way; without a reading it simply stays a note.
    console.error("Not okunamadı:", error);
  }
}

// Customers whose follow-up date has come, oldest first; closed ones (sipariş geldi, ilgilenmiyor) are left out.
export async function followUpsDue(today: string) {
  return db
    .select({ id: customer.id, name: customer.name, phone: customer.phone, nextFollowUpOn: customer.nextFollowUpOn, status: customer.status })
    .from(customer)
    .where(
      and(
        isNotNull(customer.nextFollowUpOn),
        lte(customer.nextFollowUpOn, today),
        inArray(customer.status, ["aranacak", "arandi", "ulasilamadi", "teklif_verildi"]),
      ),
    )
    .orderBy(asc(customer.nextFollowUpOn));
}
