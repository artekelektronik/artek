import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { assistantSuggestion, customer, invoice, lead } from "../db/schema";
import { logActivity } from "./activity";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";

// Archiving instead of deleting: an archived invoice, Müşteri or Aday leaves lists and totals but is kept with who,
// when and why, and "Geri al" brings it back. Every archive and restore goes into the İşlem geçmişi.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const archiveInput = z.object({ id: z.uuid(), reason: z.string().trim().min(2, { error: "Kısa bir sebep yazın." }).max(500) });

export async function archiveInvoice(headers: Headers, input: z.input<typeof archiveInput>) {
  const actor = await requirePermission(headers, "finance.edit");
  const data = parseInput(archiveInput, input);
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(invoice)
      .set({ archivedAt: new Date(), archivedBy: actor.userId, archiveReason: data.reason })
      .where(and(eq(invoice.id, data.id), isNull(invoice.archivedAt)))
      .returning({ number: invoice.number, customerId: invoice.customerId });
    if (!row) throw new UserError("Fatura bulunamadı ya da zaten arşivde.");
    const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, row.customerId));
    await logActivity(tx, { entity: "fatura", entityId: data.id, label: `${row.number} · ${c.name}`, action: "arsivlendi", detail: data.reason, userId: actor.userId });
  });
}

export async function restoreInvoice(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "finance.edit");
  await db.transaction(async (tx) => {
    const done = await restoreInvoiceIn(tx, id, { userId: actor.userId, why: null });
    if (!done) throw new UserError("Fatura arşivde değil.");
  });
}

// Also used when the same invoice is uploaded again.
export async function restoreInvoiceIn(tx: Tx, id: string, by: { userId: string | null; why: string | null }) {
  const [row] = await tx
    .update(invoice)
    .set({ archivedAt: null, archivedBy: null, archiveReason: null })
    .where(and(eq(invoice.id, id), isNotNull(invoice.archivedAt)))
    .returning({ number: invoice.number, customerId: invoice.customerId });
  if (!row) return false;
  const [c] = await tx.select({ name: customer.name }).from(customer).where(eq(customer.id, row.customerId));
  await logActivity(tx, { entity: "fatura", entityId: id, label: `${row.number} · ${c.name}`, action: "geri_alindi", detail: by.why, userId: by.userId });
  return true;
}

// The Müşteri's open Bugün suggestions close with it, so nothing waits on an archived firm.
export async function archiveCustomer(headers: Headers, input: z.input<typeof archiveInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(archiveInput, input);
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(customer)
      .set({ archivedAt: new Date(), archivedBy: actor.userId, archiveReason: data.reason, nextFollowUpOn: null, updatedAt: new Date() })
      .where(and(eq(customer.id, data.id), isNull(customer.archivedAt)))
      .returning({ name: customer.name });
    if (!row) throw new UserError("Müşteri bulunamadı ya da zaten arşivde.");
    await tx
      .update(assistantSuggestion)
      .set({ status: "atlandi", closeNote: `Müşteri arşivlendi: ${data.reason}`, decidedAt: new Date(), decidedBy: actor.userId })
      .where(and(eq(assistantSuggestion.customerId, data.id), inArray(assistantSuggestion.status, ["bekliyor", "basarisiz", "onay_bekliyor"])));
    await logActivity(tx, { entity: "musteri", entityId: data.id, label: row.name, action: "arsivlendi", detail: data.reason, userId: actor.userId });
  });
}

export async function restoreCustomer(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "crm.edit");
  await db.transaction(async (tx) => {
    const done = await restoreCustomerIn(tx, id, { userId: actor.userId, why: null });
    if (!done) throw new UserError("Müşteri arşivde değil.");
  });
}

// Also used when a new invoice arrives for an archived Müşteri's VKN.
export async function restoreCustomerIn(tx: Tx, id: string, by: { userId: string | null; why: string | null }) {
  const [row] = await tx
    .update(customer)
    .set({ archivedAt: null, archivedBy: null, archiveReason: null, updatedAt: new Date() })
    .where(and(eq(customer.id, id), isNotNull(customer.archivedAt)))
    .returning({ name: customer.name });
  if (!row) return false;
  await logActivity(tx, { entity: "musteri", entityId: id, label: row.name, action: "geri_alindi", detail: by.why, userId: by.userId, via: by.userId ? null : "fatura" });
  return true;
}

export async function archiveLead(headers: Headers, input: z.input<typeof archiveInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(archiveInput, input);
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(lead)
      .set({ archivedAt: new Date(), archivedBy: actor.userId, archiveReason: data.reason })
      .where(and(eq(lead.id, data.id), isNull(lead.archivedAt)))
      .returning({ name: lead.name });
    if (!row) throw new UserError("Aday bulunamadı ya da zaten arşivde.");
    await logActivity(tx, { entity: "aday", entityId: data.id, label: row.name, action: "arsivlendi", detail: data.reason, userId: actor.userId });
  });
}

export async function restoreLead(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "crm.edit");
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(lead)
      .set({ archivedAt: null, archivedBy: null, archiveReason: null })
      .where(and(eq(lead.id, id), isNotNull(lead.archivedAt)))
      .returning({ name: lead.name });
    if (!row) throw new UserError("Aday arşivde değil.");
    await logActivity(tx, { entity: "aday", entityId: id, label: row.name, action: "geri_alindi", userId: actor.userId });
  });
}
