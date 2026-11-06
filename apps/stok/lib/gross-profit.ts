import { eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db";
import { exchangeRate, invoice, invoiceLine, productPrice } from "../db/schema";
import { fetchRatesOn } from "./exchange-rates";
import { countedInvoice } from "./finance";
import { requirePermission } from "./guard";
import { monthlyGrossProfit, type PurchasePrice } from "./gross-profit-calc";

// Rates for the given dates: cached ones from the database, the rest fetched from TCMB once and kept.
async function ratesOn(dates: string[]) {
  const wanted = [...new Set(dates)];
  const rates = new Map<string, { USD: number; EUR: number }>();
  if (!wanted.length) return rates;
  for (const r of await db.select().from(exchangeRate).where(inArray(exchangeRate.date, wanted))) rates.set(r.date, { USD: Number(r.usd), EUR: Number(r.eur) });
  const missing = wanted.filter((d) => !rates.has(d));
  for (let i = 0; i < missing.length; i += 8) {
    const fetched = await Promise.all(missing.slice(i, i + 8).map(async (date) => ({ date, rates: await fetchRatesOn(date) })));
    const found = fetched.flatMap((f) => (f.rates ? [{ date: f.date, usd: String(f.rates.USD), eur: String(f.rates.EUR), bulletinOn: f.rates.bulletinOn }] : []));
    if (found.length) await db.insert(exchangeRate).values(found).onConflictDoNothing();
    for (const f of found) rates.set(f.date, { USD: Number(f.usd), EUR: Number(f.eur) });
  }
  return rates;
}

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
