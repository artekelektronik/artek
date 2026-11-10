import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "../db";
import { customer, invoice, invoiceLine } from "../db/schema";
import { missingNumbers, summarize } from "./finance-calc";
import { requirePermission } from "./guard";
import { usdScale } from "./historic-rates";
import { inPeriod, type Period } from "./period";

export * from "./finance-calc";

// Only a confirmed, unarchived invoice counts anywhere (Finans, Müşteri paneli, assistant).
export const countedInvoice = and(eq(invoice.status, "onaylandi"), isNull(invoice.archivedAt));

// Both panels read it: Finans for the totals, Müşteri for each customer's sales and Öncelik.
// `period`: only sales between its days, in its currency.
export async function financeSummary(headers: Headers, action: "finance.view" | "crm.view", period?: Period) {
  await requirePermission(headers, action);
  return loadSalesSummary({ cached: true, period });
}

// Home card totals, summed in SQL.
export async function salesForMonths(headers: Headers, thisMonth: string, lastMonth: string) {
  await requirePermission(headers, "finance.view");
  const monthSales = (ym: string) =>
    sql<string>`coalesce(sum(${invoice.netAmount}) filter (where ${invoice.issuedOn} >= ${`${ym}-01`}::date and ${invoice.issuedOn} < ${`${ym}-01`}::date + interval '1 month'), 0)`;
  const [row] = await db
    .select({ thisMonth: monthSales(thisMonth), lastMonth: monthSales(lastMonth), asOf: sql<string | null>`max(${invoice.issuedOn})::text` })
    .from(invoice)
    .where(and(countedInvoice, ne(invoice.type, "IADE")));
  return { thisMonth: Number(row.thisMonth), lastMonth: Number(row.lastMonth), asOf: row.asOf ?? "" };
}

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
        status: invoice.status,
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

// 1h is a fallback for edits made outside the app; Vercel skips entries over 2 MB (~0.4 MB now).
const cachedInvoiceRows = unstable_cache(loadInvoiceRows, ["sales-invoice-rows"], { tags: [invoicesTag], revalidate: 3600 });

// Call after anything that adds, confirms, archives or restores an invoice.
export function invoicesChanged() {
  revalidateTag(invoicesTag, { expire: 0 });
}

// Unchecked: for callers that already checked access. Customers are never cached; they change all day.
export async function loadSalesSummary({ cached = false, period }: { cached?: boolean; period?: Period } = {}) {
  const [[invoices, lines], customers] = await Promise.all([cached ? cachedInvoiceRows() : loadInvoiceRows(), db.select().from(customer)]);
  // Drafts and archived invoices leave every total but still count as issued, so they don't show up as missing numbers.
  const live = invoices.flatMap((i) =>
    i.status === "onaylandi" && !i.archivedAt && i.customerId && (!period || inPeriod(i.issuedOn, period)) ? [{ ...i, customerId: i.customerId }] : [],
  );
  const dayOf = new Map(live.map((i) => [i.id, i.issuedOn]));
  const scale = period?.usd ? await usdScale(live.map((i) => i.issuedOn)) : (v: number) => v;
  const summary = summarize(
    live.filter((i) => i.type !== "IADE").map((i) => ({ ...i, netAmount: scale(Number(i.netAmount), i.issuedOn) })),
    lines.flatMap((l) => {
      const day = dayOf.get(l.invoiceId);
      return day ? [{ ...l, amount: scale(Number(l.amount), day), quantity: Number(l.quantity) }] : [];
    }),
    customers,
  );
  return { ...summary, customerRows: customers, gaps: missingNumbers(invoices) };
}
