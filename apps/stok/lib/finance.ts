import { and, isNull, ne, sql } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "../db";
import { customer, invoice, invoiceLine } from "../db/schema";
import { missingNumbers, summarize } from "./finance-calc";
import { requirePermission } from "./guard";

export * from "./finance-calc";

// Both panels read it: Finans for the totals, Müşteri for each customer's sales and Öncelik.
export async function financeSummary(headers: Headers, action: "finance.view" | "crm.view") {
  await requirePermission(headers, action);
  return loadSalesSummaryCached();
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

// Every invoice and line. They change only on upload, archive and restore, which call invoicesChanged().
async function loadInvoiceRows() {
  return Promise.all([
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
  ]);
}

const invoicesTag = "invoices";

// Kept between requests so the Finans and Müşteriler screens don't reload all invoices on every visit.
// The hour is only a safety net for changes made outside the app (scripts); the app expires it at once.
// About 0.4 MB today; Vercel's data cache skips entries over 2 MB, so past that it just loads every time again.
const cachedInvoiceRows = unstable_cache(loadInvoiceRows, ["sales-invoice-rows"], { tags: [invoicesTag], revalidate: 3600 });

// Call after anything that adds, archives or restores an invoice.
export function invoicesChanged() {
  revalidateTag(invoicesTag, { expire: 0 });
}

// Customers are read fresh every time: their status and follow-up dates change all day.
function summaryOf([invoices, lines]: Awaited<ReturnType<typeof loadInvoiceRows>>, customers: (typeof customer.$inferSelect)[]) {
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

// Unchecked: for callers that already checked access, and for the morning assistant run by the cron.
export async function loadSalesSummary() {
  const [rows, customers] = await Promise.all([loadInvoiceRows(), db.select().from(customer)]);
  return summaryOf(rows, customers);
}

// The same, with invoices from the cache; for screens rendered inside the app.
export async function loadSalesSummaryCached() {
  const [rows, customers] = await Promise.all([cachedInvoiceRows(), db.select().from(customer)]);
  return summaryOf(rows, customers);
}
