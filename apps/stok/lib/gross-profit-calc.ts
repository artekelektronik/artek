// Brüt kâr per month from confirmed Fatura lines. Pure: prices and rates come in, so tests need no database or network.
import type { LineComponent } from "../db/schema";
import type { Currency } from "./stock-value";

export type SoldLine = {
  invoiceId: string;
  number: string;
  issuedOn: string;
  isReturn: boolean;
  description: string;
  productId: string | null;
  quantity: string;
  stockQuantity: string | null;
  amount: string;
  components: LineComponent[] | null;
};
export type PurchasePrice = { price: string; currency: Currency };
type Rates = { USD: number; EUR: number };

export type MonthProfit = { month: string; sales: number; costedSales: number; cost: number; gross: number; uncostedSales: number; uncostedLines: number };
export type Uncosted = { invoiceId: string; number: string; issuedOn: string; description: string; amount: number; reason: "Katalogda yok" | "Alış fiyatı yok" | "Kur yok" };

// What `quantity` of a product cost in TL on `date`, or why it can't be said.
function costOf(productId: string, quantity: string, date: string, prices: Map<string, PurchasePrice>, rateOn: (date: string) => Rates | null) {
  const p = prices.get(productId);
  if (!p) return "Alış fiyatı yok" as const;
  const rate = p.currency === "TRY" ? 1 : rateOn(date)?.[p.currency];
  return rate ? Number(quantity) * Number(p.price) * rate : ("Kur yok" as const);
}

// A built line costs its materials; a stocked or linked one, its Ürün. Unknown cost is listed, never counted as zero.
export function monthlyGrossProfit(lines: SoldLine[], prices: Map<string, PurchasePrice>, rateOn: (date: string) => Rates | null) {
  const byMonth = new Map<string, MonthProfit>();
  const uncosted: Uncosted[] = [];
  for (const l of lines) {
    const month = l.issuedOn.slice(0, 7);
    const m = byMonth.get(month) ?? { month, sales: 0, costedSales: 0, cost: 0, gross: 0, uncostedSales: 0, uncostedLines: 0 };
    byMonth.set(month, m);
    const sign = l.isReturn ? -1 : 1;
    const amount = sign * Number(l.amount);
    m.sales += amount;

    const parts = l.components?.length
      ? l.components.map((c) => costOf(c.productId, c.quantity, l.issuedOn, prices, rateOn))
      : l.productId
        ? [costOf(l.productId, l.stockQuantity ?? l.quantity, l.issuedOn, prices, rateOn)]
        : ["Katalogda yok" as const];
    const missing = parts.find((p) => typeof p === "string");
    if (missing) {
      m.uncostedSales += amount;
      m.uncostedLines += 1;
      uncosted.push({ invoiceId: l.invoiceId, number: l.number, issuedOn: l.issuedOn, description: l.description, amount, reason: missing });
      continue;
    }
    m.costedSales += amount;
    m.cost += sign * (parts as number[]).reduce((s, c) => s + c, 0);
  }
  const months = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({ ...m, gross: m.costedSales - m.cost }));
  return { months, uncosted };
}
