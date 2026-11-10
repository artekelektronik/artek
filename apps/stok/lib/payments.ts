import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customer, invoice, payment } from "../db/schema";
import { logActivity } from "./activity";
import { isUuid, parseInput, UserError } from "./errors";
import { tl } from "./finance-calc";
import { requirePermission } from "./guard";
import { proformaScenario } from "./invoices";
import { normalizeDecimal } from "./decimal";
import { paymentMethodLabels, paymentState, type PaymentMethod } from "./payment-state";

const paymentInput = z.object({
  paidOn: z.iso.date({ error: "Tarihi seçin." }),
  amount: z.string().transform((raw, ctx) => {
    const value = normalizeDecimal(raw);
    if (!value || Number(value) <= 0) ctx.addIssue({ code: "custom", message: "Tutarı yazın." });
    return value ?? "";
  }),
  method: z.enum(Object.keys(paymentMethodLabels) as [PaymentMethod, ...PaymentMethod[]], { error: "Ödeme şeklini seçin." }),
  note: z.string().trim().max(300).default(""),
});
export type PaymentInput = z.input<typeof paymentInput>;

// Qualified by hand: inside a subquery drizzle would leave "id" for Postgres to read as payment.id.
const paidSum = sql<string>`(select coalesce(sum(p.amount), 0) from payment p where p.invoice_id = "invoice"."id")`;

// A sale that can be paid: a confirmed Fatura (not an İade), or a Proforma confirmed or not.
const isSale = and(isNull(invoice.archivedAt), ne(invoice.type, "IADE"), or(eq(invoice.status, "onaylandi"), eq(invoice.scenario, proformaScenario)));

export async function addPayment(headers: Headers, invoiceId: string, input: PaymentInput) {
  const actor = await requirePermission(headers, "finance.edit");
  const data = parseInput(paymentInput, input);
  if (!isUuid(invoiceId)) throw new UserError("Satış bulunamadı.");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select({ number: invoice.number, total: invoice.totalAmount, paid: paidSum }).from(invoice).where(and(eq(invoice.id, invoiceId), isSale)).for("update");
    if (!sale) throw new UserError("Bu kayda ödeme girilemez; onaylı bir satış ya da proforma seçin.");
    const left = Number(sale.total) - Number(sale.paid);
    if (Number(data.amount) > left + 0.005) throw new UserError(`Kalan borçtan fazla: en çok ${tl(left)}.`);
    const [added] = await tx.insert(payment).values({ invoiceId, ...data, createdBy: actor.userId }).returning({ id: payment.id });
    await logActivity(tx, { entity: "fatura", entityId: invoiceId, label: sale.number, action: "duzenlendi", detail: `Tahsilat: ${tl(Number(data.amount))}, ${paymentMethodLabels[data.method]}`, userId: actor.userId });
    return added.id;
  });
}

// A payment entered by mistake is removed, not reversed (ADR-0008).
export async function deletePayment(headers: Headers, paymentId: string) {
  const actor = await requirePermission(headers, "finance.edit");
  if (!isUuid(paymentId)) throw new UserError("Ödeme bulunamadı.");
  await db.transaction(async (tx) => {
    const [gone] = await tx.delete(payment).where(eq(payment.id, paymentId)).returning();
    if (!gone) throw new UserError("Ödeme bulunamadı.");
    const [sale] = await tx.select({ number: invoice.number }).from(invoice).where(eq(invoice.id, gone.invoiceId));
    await logActivity(tx, { entity: "fatura", entityId: gone.invoiceId, label: sale?.number ?? "", action: "duzenlendi", detail: `Tahsilat silindi: ${tl(Number(gone.amount))}`, userId: actor.userId });
  });
}

export async function listPayments(headers: Headers, invoiceId: string) {
  await requirePermission(headers, "finance.view");
  if (!isUuid(invoiceId)) return [];
  return db.select().from(payment).where(eq(payment.invoiceId, invoiceId)).orderBy(desc(payment.paidOn), desc(payment.createdAt));
}

// Every sale with what is paid on it, for the Tahsilat lists.
export async function listCollections(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const rows = await db
    .select({
      id: invoice.id,
      number: invoice.number,
      issuedOn: invoice.issuedOn,
      status: invoice.status,
      proforma: sql<boolean>`${invoice.scenario} = ${proformaScenario}`,
      customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
      total: invoice.totalAmount,
      paid: paidSum,
    })
    .from(invoice)
    .leftJoin(customer, eq(customer.id, invoice.customerId))
    .where(isSale)
    .orderBy(desc(invoice.issuedOn), desc(invoice.number));
  return rows.map((r) => ({ ...r, total: Number(r.total), paid: Number(r.paid), state: paymentState(Number(r.total), Number(r.paid), r.issuedOn) }));
}

// Delivered proformas never invoiced, KDV hariç: how much of a year's Satış had no e-invoice.
export async function unInvoicedSales(headers: Headers, year: string) {
  await requirePermission(headers, "finance.view");
  const [row] = await db
    .select({ net: sql<string>`coalesce(sum(${invoice.netAmount}), 0)` })
    .from(invoice)
    .where(and(eq(invoice.scenario, proformaScenario), eq(invoice.status, "onaylandi"), isNull(invoice.archivedAt), ne(invoice.type, "IADE"), sql`to_char(${invoice.issuedOn}, 'YYYY') = ${year}`));
  return Number(row.net);
}
