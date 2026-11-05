import { and, isNull, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { customer, invoice, invoiceLine } from "../db/schema";
import { missingNumbers, summarize } from "./finance-calc";
import { requirePermission } from "./guard";

export * from "./finance-calc";

// Both panels read it: Finans for the totals, Müşteri for each customer's sales and Öncelik.
export async function financeSummary(headers: Headers, action: "finance.view" | "crm.view") {
  await requirePermission(headers, action);
  return loadSalesSummary();
}

// The home page's "Bu ay satış" card: two months' totals and the last invoice date, summed in the database
// instead of loading every invoice, line and customer like financeSummary does.
export async function salesForMonths(headers: Headers, months: string[]) {
  await requirePermission(headers, "finance.view");
  const ym = sql<string>`left(${invoice.issuedOn}::text, 7)`;
  const [rows, [last]] = await Promise.all([
    db
      .select({ month: ym, sales: sql<string>`sum(${invoice.netAmount})` })
      .from(invoice)
      .where(and(isNull(invoice.archivedAt), ne(invoice.type, "IADE"), sql`${ym} in ${months}`))
      .groupBy(ym),
    db
      .select({ asOf: sql<string | null>`max(${invoice.issuedOn})::text` })
      .from(invoice)
      .where(and(isNull(invoice.archivedAt), ne(invoice.type, "IADE"))),
  ]);
  return { monthly: rows.map((r) => ({ month: r.month, sales: Number(r.sales) })), asOf: last?.asOf ?? "" };
}

// Unchecked: for callers that already checked access, and for the morning assistant run by the cron.
export async function loadSalesSummary() {
  const [invoices, lines, customers] = await Promise.all([
    db
      .select({
        id: invoice.id,
        customerId: invoice.customerId,
        issuedOn: invoice.issuedOn,
        netAmount: invoice.netAmount,
        number: invoice.number,
        scenario: invoice.scenario,
        type: invoice.type,
        archivedAt: invoice.archivedAt,
      })
      .from(invoice),
    db
      .select({
        invoiceId: invoiceLine.invoiceId,
        productName: invoiceLine.productName,
        productGroup: invoiceLine.productGroup,
        amount: invoiceLine.amount,
        quantity: invoiceLine.quantity,
      })
      .from(invoiceLine),
    db.select().from(customer),
  ]);
  // Archived invoices leave every total but still count as issued, so they don't show up as missing numbers.
  const live = invoices.filter((i) => !i.archivedAt);
  const liveIds = new Set(live.map((i) => i.id));
  const summary = summarize(
    live.filter((i) => i.type !== "IADE").map((i) => ({ ...i, netAmount: Number(i.netAmount) })),
    lines.filter((l) => liveIds.has(l.invoiceId)).map((l) => ({ ...l, amount: Number(l.amount), quantity: Number(l.quantity) })),
    customers,
  );
  return { ...summary, customerRows: customers, gaps: missingNumbers(invoices) };
}
