// Fiyat hesapla: what one unit costs to build today, and what it sells for at a given kâr. Pure, so tests need no database.
import type { Rates } from "./exchange-rates";
import { inTl, type Currency } from "./stock-value";

export type QuoteMaterial = { quantity: string; price: string | null; currency: Currency | null };

// One unit's cost in TL. A material with no Alış fiyatı (or no rate) is counted in `missing`, never as free.
export function unitCost(materials: QuoteMaterial[], labor: number, rates: Rates | null) {
  const costs = materials.map((m) => inTl(m.quantity, m.price, m.currency ?? undefined, rates));
  const material = costs.reduce<number>((sum, c) => sum + (c ?? 0), 0);
  return { costs, material, labor, total: material + labor, missing: costs.filter((c) => c === null).length };
}

// Kâr is a percentage on top of cost: 60 TL at %40 sells for 84 TL.
export const priceAt = (cost: number, profitPct: number) => cost * (1 + profitPct / 100);
export const profitPctOf = (cost: number, price: number) => (cost > 0 ? (price / cost - 1) * 100 : null);
