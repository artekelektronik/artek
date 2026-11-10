import { and, desc, eq, gte, isNull, lte, ne, or, sql, sum } from "drizzle-orm";
import { db } from "../db";
import { customer, invoice, payment } from "../db/schema";
import { logActivity } from "./activity";
import { isUuid, parseInput, UserError } from "./errors";
import { countedInvoice } from "./finance";
import { tl } from "./finance-calc";
import { requirePermission } from "./guard";
import { proformaScenario } from "./labels";
import { owed, paymentInput, paymentMethodLabels, paymentState, type PaymentInput } from "./payment-state";

// A sale that can be paid: a confirmed Fatura (not an İade), or a Proforma confirmed or not.
const isSale = and(isNull(invoice.archivedAt), ne(invoice.type, "IADE"), or(eq(invoice.status, "onaylandi"), eq(invoice.scenario, proformaScenario)));

const paidSoFar = async (tx: Pick<typeof db, "select">, invoiceId: string) =>
  Number((await tx.select({ paid: sum(payment.amount) }).from(payment).where(eq(payment.invoiceId, invoiceId)))[0].paid ?? 0);

export async function addPayment(headers: Headers, invoiceId: string, input: PaymentInput) {
  const actor = await requirePermission(headers, "finance.edit");
  const data = parseInput(paymentInput, input);
  if (!isUuid(invoiceId)) throw new UserError("Satış bulunamadı.");
  return db.transaction(async (tx) => {
    const [sale] = await tx.select({ number: invoice.number, total: invoice.totalAmount }).from(invoice).where(and(eq(invoice.id, invoiceId), isSale)).for("update");
    if (!sale) throw new UserError("Bu kayda ödeme girilemez; onaylı bir satış ya da proforma seçin.");
    const left = owed(Number(sale.total), await paidSoFar(tx, invoiceId));
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

// Every sale with what is paid on it, for the Tahsilat lists.
export async function listCollections(headers: Headers) {
  await requirePermission(headers, "finance.view");
  const paid = db.select({ invoiceId: payment.invoiceId, amount: sum(payment.amount).as("amount") }).from(payment).groupBy(payment.invoiceId).as("paid");
  const rows = await db
    .select({
      id: invoice.id,
      number: invoice.number,
      issuedOn: invoice.issuedOn,
      status: invoice.status,
      proforma: sql<boolean>`${invoice.scenario} = ${proformaScenario}`,
      customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
      total: invoice.totalAmount,
      paid: paid.amount,
    })
    .from(invoice)
    .leftJoin(customer, eq(customer.id, invoice.customerId))
    .leftJoin(paid, eq(paid.invoiceId, invoice.id))
    .where(isSale)
    .orderBy(desc(invoice.issuedOn), desc(invoice.number));
  return rows.map((r) => {
    const [total, paidAmount] = [Number(r.total), Number(r.paid ?? 0)];
    return { ...r, total, paid: paidAmount, owed: owed(total, paidAmount), state: paymentState(total, paidAmount, r.issuedOn) };
  });
}

// Delivered proformas never invoiced, KDV hariç: how much of the Satış between two days (inclusive) had no e-invoice.
export async function unInvoicedSales(headers: Headers, from: string, to: string) {
  await requirePermission(headers, "finance.view");
  const [row] = await db
    .select({ net: sum(invoice.netAmount) })
    .from(invoice)
    .where(and(countedInvoice, eq(invoice.scenario, proformaScenario), ne(invoice.type, "IADE"), gte(invoice.issuedOn, from), lte(invoice.issuedOn, to)));
  return Number(row.net ?? 0);
}
