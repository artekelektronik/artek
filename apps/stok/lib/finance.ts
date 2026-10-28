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
  const summary = summarize(
    invoices.filter((i) => i.type !== "IADE").map((i) => ({ ...i, netAmount: Number(i.netAmount) })),
    lines.map((l) => ({ ...l, amount: Number(l.amount), quantity: Number(l.quantity) })),
    customers,
  );
  return { ...summary, customerRows: customers, gaps: missingNumbers(invoices) };
}
