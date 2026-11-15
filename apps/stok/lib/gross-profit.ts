import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "../db";
import { expense, invoice, invoiceLine, productPrice } from "../db/schema";
import { ratesOn, usdScale } from "./historic-rates";
import { countedInvoice } from "./finance";
import { requirePermission } from "./guard";
import { monthlyGrossProfit, monthlyNet, type PurchasePrice } from "./gross-profit-calc";
import type { Period } from "./period";

export async function grossProfit(headers: Headers, period?: Period) {
  await requirePermission(headers, "finance.view");
  const [lines, priceRows] = await Promise.all([
    db
      .select({
        invoiceId: invoice.id,
        number: invoice.number,
        issuedOn: invoice.issuedOn,
        type: invoice.type,
        description: invoiceLine.description,
        productId: invoiceLine.productId,
        quantity: invoiceLine.quantity,
        stockQuantity: invoiceLine.stockQuantity,
        amount: invoiceLine.amount,
        components: invoiceLine.components,
      })
      .from(invoiceLine)
      .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
      .where(period ? and(countedInvoice, gte(invoice.issuedOn, period.from), lte(invoice.issuedOn, period.to)) : countedInvoice),
    db
      .select({ productId: productPrice.productId, price: productPrice.purchasePrice, currency: productPrice.purchaseCurrency })
      .from(productPrice)
      .where(isNotNull(productPrice.purchasePrice)),
  ]);
  const prices = new Map<string, PurchasePrice>(priceRows.map((p) => [p.productId, { price: p.price!, currency: p.currency }]));
  const foreign = new Set(priceRows.filter((p) => p.currency !== "TRY").map((p) => p.productId));
  const needsRate = lines.filter((l) => (l.components?.map((c) => c.productId) ?? [l.productId]).some((id) => id && foreign.has(id)));
  const [rates, scale] = await Promise.all([ratesOn(needsRate.map((l) => l.issuedOn)), period?.usd ? usdScale(lines.map((l) => l.issuedOn)) : undefined]);
  return monthlyGrossProfit(
    lines.map((l) => ({ ...l, isReturn: l.type === "IADE" })),
    prices,
    (date) => rates.get(date) ?? null,
    scale,
  );
}

// Satış → Brüt kâr → Giderler → Net per month within the period, in its currency.
export async function financeResults(headers: Headers, period: Period) {
  const [gp, spent] = await Promise.all([
    grossProfit(headers, period),
    db
      .select({ spentOn: expense.spentOn, category: expense.category, netAmount: expense.netAmount, totalAmount: expense.totalAmount })
      .from(expense)
      .where(and(gte(expense.spentOn, period.from), lte(expense.spentOn, period.to))),
  ]);
  const scale = period.usd ? await usdScale(spent.map((e) => e.spentOn)) : undefined;
  return { ...monthlyNet(gp.months, spent, scale), uncosted: gp.uncosted };
}
