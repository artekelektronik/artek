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

export type MonthNet = MonthProfit & { expenses: number; byCategory: Record<string, number>; net: number; incomplete: boolean };
type Spent = { spentOn: string; category: string; netAmount: string };

export const emptyMonth = (month: string): MonthNet => ({ month, sales: 0, costedSales: 0, cost: 0, gross: 0, uncostedSales: 0, uncostedLines: 0, expenses: 0, byCategory: {}, net: 0, incomplete: false });

// Satış → Brüt kâr → Giderler → Net per month and year, KDV hariç. A month with sales of unknown cost is incomplete.
export function monthlyNet(profits: MonthProfit[], expenses: Spent[]) {
  const byMonth = new Map<string, MonthNet>(profits.map((p) => [p.month, { ...emptyMonth(p.month), ...p }]));
  for (const e of expenses) {
    const month = e.spentOn.slice(0, 7);
    const m = byMonth.get(month) ?? emptyMonth(month);
    byMonth.set(month, m);
    m.expenses += Number(e.netAmount);
    m.byCategory[e.category] = (m.byCategory[e.category] ?? 0) + Number(e.netAmount);
  }
  const months = [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, net: m.gross - m.expenses, incomplete: m.uncostedSales !== 0 }));
  const years = Object.entries(Object.groupBy(months, (m) => m.month.slice(0, 4))).map(([year, list]) => {
    const sum = (key: "sales" | "costedSales" | "gross" | "uncostedSales" | "expenses" | "net") => list!.reduce((s, m) => s + m[key], 0);
    const byCategory: Record<string, number> = {};
    for (const m of list!) for (const [c, v] of Object.entries(m.byCategory)) byCategory[c] = (byCategory[c] ?? 0) + v;
    return { year, sales: sum("sales"), costedSales: sum("costedSales"), gross: sum("gross"), uncostedSales: sum("uncostedSales"), expenses: sum("expenses"), net: sum("net"), byCategory };
  });
  return { months, years };
}
