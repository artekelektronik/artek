import { eq, isNotNull } from "drizzle-orm";
import { db } from "../db";
import { invoice, invoiceLine, productPrice } from "../db/schema";
import { ratesOn } from "./historic-rates";
import { countedInvoice } from "./finance";
import { requirePermission } from "./guard";
import { monthlyGrossProfit, type PurchasePrice } from "./gross-profit-calc";

export async function grossProfit(headers: Headers) {
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
      .where(countedInvoice),
    db
      .select({ productId: productPrice.productId, price: productPrice.purchasePrice, currency: productPrice.purchaseCurrency })
      .from(productPrice)
      .where(isNotNull(productPrice.purchasePrice)),
  ]);
  const prices = new Map<string, PurchasePrice>(priceRows.map((p) => [p.productId, { price: p.price!, currency: p.currency }]));
  const foreign = new Set(priceRows.filter((p) => p.currency !== "TRY").map((p) => p.productId));
  const needsRate = lines.filter((l) => (l.components?.map((c) => c.productId) ?? [l.productId]).some((id) => id && foreign.has(id)));
  const rates = await ratesOn(needsRate.map((l) => l.issuedOn));
  return monthlyGrossProfit(
    lines.map((l) => ({ ...l, isReturn: l.type === "IADE" })),
    prices,
    (date) => rates.get(date) ?? null,
  );
}
