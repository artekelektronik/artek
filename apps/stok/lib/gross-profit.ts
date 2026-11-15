import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { customer, expense, invoice, invoiceLine, product, productLabor, productPrice } from "../db/schema";
import { ratesOn, usdScale } from "./historic-rates";
import { countedInvoice } from "./finance";
import { requirePermission } from "./guard";
import { monthlyGrossProfit, monthlyNet, type PurchasePrice } from "./gross-profit-calc";
import type { Period } from "./period";
import { businessSplit, trafoProfit } from "./trafo-profit-calc";

// Confirmed lines in the period with what costing them needs: today's Alış fiyatı and the invoice days' rates.
async function soldLines(period?: Period) {
  const [rows, priceRows] = await Promise.all([
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
        productLabel: sql<string>`coalesce(${product.name} || ' · ' || ${product.code}, ${invoiceLine.description})`,
        customer: sql<string>`coalesce(${customer.name}, ${invoice.buyer}->>'name')`,
      })
      .from(invoiceLine)
      .innerJoin(invoice, eq(invoice.id, invoiceLine.invoiceId))
      .leftJoin(product, eq(product.id, invoiceLine.productId))
      .leftJoin(customer, eq(customer.id, invoice.customerId))
      .where(period ? and(countedInvoice, gte(invoice.issuedOn, period.from), lte(invoice.issuedOn, period.to)) : countedInvoice),
    db
      .select({ productId: productPrice.productId, price: productPrice.purchasePrice, currency: productPrice.purchaseCurrency })
      .from(productPrice)
      .where(isNotNull(productPrice.purchasePrice)),
  ]);
  const prices = new Map<string, PurchasePrice>(priceRows.map((p) => [p.productId, { price: p.price!, currency: p.currency }]));
  const foreign = new Set(priceRows.filter((p) => p.currency !== "TRY").map((p) => p.productId));
  const needsRate = rows.filter((l) => (l.components?.map((c) => c.productId) ?? [l.productId]).some((id) => id && foreign.has(id)));
  const rates = await ratesOn(needsRate.map((l) => l.issuedOn));
  return { lines: rows.map((l) => ({ ...l, isReturn: l.type === "IADE" })), prices, rateOn: (date: string) => rates.get(date) ?? null };
}

// Brüt kâr per month, and the same period split into the trafo business and Ticari mal.
export async function grossProfit(headers: Headers, period?: Period) {
  await requirePermission(headers, "finance.view");
  const { lines, prices, rateOn } = await soldLines(period);
  const scale = period?.usd ? await usdScale(lines.map((l) => l.issuedOn)) : undefined;
  return { ...monthlyGrossProfit(lines, prices, rateOn, scale), split: businessSplit(lines, prices, rateOn, scale) };
}

// Trafo kârlılığı: each built trafo's sale against its materials and İşçilik, per model and per Müşteri, in TL.
export async function trafoProfitability(headers: Headers, period: Period) {
  await requirePermission(headers, "finance.view");
  const [{ lines, prices, rateOn }, laborRows] = await Promise.all([soldLines(period), db.select({ productId: productLabor.productId, cost: productLabor.cost }).from(productLabor)]);
  return trafoProfit(lines, prices, new Map(laborRows.map((l) => [l.productId, Number(l.cost)])), rateOn);
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
  return { ...monthlyNet(gp.months, spent, scale), uncosted: gp.uncosted, split: gp.split };
}
