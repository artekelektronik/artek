import { asc, desc, eq, and, lte, isNotNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customer, customerNote, customerStatus, invoice, user } from "../db/schema";
import { isUuid, parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";

export { customerStatusLabels, type CustomerStatus } from "./finance-calc";

export async function customerCard(headers: Headers, id: string) {
  await requirePermission(headers, "crm.view");
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(customer).where(eq(customer.id, id));
  if (!row) return null;
  const [invoices, notes] = await Promise.all([
    db
      .select({ id: invoice.id, number: invoice.number, issuedOn: invoice.issuedOn, type: invoice.type, netAmount: invoice.netAmount })
      .from(invoice)
      .where(eq(invoice.customerId, id))
      .orderBy(desc(invoice.issuedOn)),
    db
      .select({ id: customerNote.id, body: customerNote.body, createdAt: customerNote.createdAt, author: user.name })
      .from(customerNote)
      .innerJoin(user, eq(user.id, customerNote.userId))
      .where(eq(customerNote.customerId, id))
      .orderBy(desc(customerNote.createdAt)),
  ]);
  return { ...row, invoices, notes };
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
});

export async function updateCustomer(headers: Headers, input: z.input<typeof updateInput>) {
  await requirePermission(headers, "crm.edit");
  const data = parseInput(updateInput, input);
  const { id, ...fields } = data;
  const updated = await db.update(customer).set({ ...fields, updatedAt: new Date() }).where(eq(customer.id, id)).returning({ id: customer.id });
  if (!updated.length) throw new UserError("Müşteri bulunamadı.");
}

const noteInput = z.object({
  customerId: z.uuid(),
  body: z.string().trim().min(1, { error: "Not boş olamaz." }).max(4000, { error: "Not en fazla 4000 karakter olabilir." }),
});

// Notes are a history: added, never edited.
export async function addCustomerNote(headers: Headers, input: z.input<typeof noteInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(noteInput, input);
  const [exists] = await db.select({ id: customer.id }).from(customer).where(eq(customer.id, data.customerId));
  if (!exists) throw new UserError("Müşteri bulunamadı.");
  await db.insert(customerNote).values({ customerId: data.customerId, userId: actor.userId, body: data.body });
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
