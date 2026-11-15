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

// İşçilik in TL: minutes of work per unit at the Saat ücreti, or the flat TL per unit saved before minutes existed.
export type ProductLabor = { minutes: string | null; cost: string | null };
export const laborPerUnit = (l: ProductLabor | undefined, rate: number) => (l?.minutes != null ? (Number(l.minutes) / 60) * rate : Number(l?.cost ?? 0));

// A built line's İşçilik: the hours typed for that job if any, else the trafo's usual time for that many units.
export const lineLabor = (hours: string | null, quantity: string, perUnit: number, rate: number) => (hours != null ? Number(hours) * rate : perUnit * Number(quantity));

// "300 adet took 20 hours" is 4 minutes each.
export const minutesPerUnit = (hours: number, quantity: number) => (quantity > 0 ? (hours * 60) / quantity : null);
