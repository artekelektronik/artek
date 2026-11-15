// Artek's two businesses apart, and what each built trafo earned. Pure, so tests need no database.
import { lineCost, monthlyGrossProfit, type PurchasePrice, type Scale, type SoldLine } from "./gross-profit-calc";

type Rates = { USD: number; EUR: number };
type RateOn = (date: string) => Rates | null;

// A line built from Malzeme is the trafo business; anything else is Ticari mal.
export const isBuilt = (l: Pick<SoldLine, "components">) => !!l.components?.length;

// Satış, maliyet and Brüt kâr of each business; together they are the period's Brüt kâr.
export function businessSplit(lines: SoldLine[], prices: Map<string, PurchasePrice>, rateOn: RateOn, scale?: Scale) {
  const totals = (part: SoldLine[]) => {
    const months = monthlyGrossProfit(part, prices, rateOn, scale).months;
    const sum = (k: "sales" | "costedSales" | "cost" | "gross" | "uncostedSales") => months.reduce((t, m) => t + m[k], 0);
    return { sales: sum("sales"), costedSales: sum("costedSales"), cost: sum("cost"), gross: sum("gross"), uncostedSales: sum("uncostedSales") };
  };
  return { trafo: totals(lines.filter(isBuilt)), ticari: totals(lines.filter((l) => !isBuilt(l))) };
}
export type BusinessSplit = ReturnType<typeof businessSplit>;

export type BuiltLine = SoldLine & { productLabel: string; customer: string };
export type TrafoRow = { key: string; label: string; quantity: number; sales: number; material: number; labor: number; profit: number };

// Each built line's sale against its materials and İşçilik, in TL, summed per trafo and per Müşteri, best earner first.
// A line whose materials can't be costed is left out and counted in `uncosted`.
export function trafoProfit(lines: BuiltLine[], prices: Map<string, PurchasePrice>, labor: Map<string, number>, rateOn: RateOn) {
  const byProduct = new Map<string, TrafoRow>();
  const byCustomer = new Map<string, TrafoRow>();
  let uncosted = 0;
  for (const l of lines.filter(isBuilt)) {
    const material = lineCost(l, prices, rateOn);
    if (typeof material === "string") {
      uncosted += 1;
      continue;
    }
    const quantity = Number(l.quantity);
    const work = (l.productId ? (labor.get(l.productId) ?? 0) : 0) * quantity;
    const add = (rows: Map<string, TrafoRow>, key: string, label: string) => {
      const r = rows.get(key) ?? { key, label, quantity: 0, sales: 0, material: 0, labor: 0, profit: 0 };
      rows.set(key, r);
      r.quantity += quantity;
      r.sales += Number(l.amount);
      r.material += material;
      r.labor += work;
      r.profit = r.sales - r.material - r.labor;
    };
    add(byProduct, l.productId ?? l.description, l.productLabel);
    add(byCustomer, l.customer, l.customer);
  }
  const sorted = (rows: Map<string, TrafoRow>) => [...rows.values()].sort((a, b) => b.profit - a.profit);
  return { byProduct: sorted(byProduct), byCustomer: sorted(byCustomer), uncosted };
}
