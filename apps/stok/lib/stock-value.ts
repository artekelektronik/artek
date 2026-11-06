// Pure calculations for Stok değeri; no database, so tests can import it directly.
import type { currency } from "../db/schema";
import { normalizeDecimal } from "./decimal";
import type { Rates } from "./exchange-rates";
import { totalsByUnit } from "./overview-totals";
import type { Unit } from "./quantity";

export type Currency = (typeof currency.enumValues)[number];
export type Price = { purchasePrice: string | null; purchaseCurrency: Currency; salePrice: string | null; saleCurrency: Currency };

// Empty is no price. "12,50", "12.50" and "1.234,50" are all accepted; returns the string the numeric column stores.
export function parsePrice(raw: string): string | null {
  if (!raw.trim()) return null;
  const text = normalizeDecimal(raw) ?? "";
  if (!/^\d+(\.\d{1,4})?$/.test(text) || Number(text) <= 0) throw new Error("Fiyat sıfırdan büyük bir sayı olmalı, virgülden sonra en çok 4 hane.");
  if (text.split(".")[0].replace(/^0+/, "").length > 10) throw new Error("Fiyat çok büyük.");
  return text;
}

// "12.5000" → "12,5": what the price field shows.
export const displayPrice = (stored: string | null) => (stored ? stored.replace(/\.?0+$/, "").replace(".", ",") : "");

export function inTl(quantity: string, price: string | null | undefined, currency: Currency | undefined, rates: Rates | null) {
  if (!price || !currency) return null;
  const rate = currency === "TRY" ? 1 : rates?.[currency];
  return rate ? Number(quantity) * Number(price) * rate : null;
}

function unitValue(row: { total: string; price: Price | undefined }, rates: Rates | null) {
  const purchase = inTl(row.total, row.price?.purchasePrice, row.price?.purchaseCurrency, rates);
  const sale = inTl(row.total, row.price?.salePrice, row.price?.saleCurrency, rates);
  return { purchase, sale };
}

type Row = { id: string; category: string; unit: Unit; stock: Record<string, { physical: string }>; inTransit: string; total: string };

// What is in stock per category and overall. A value counts only the products with that price; `counted` says how many.
export function stockSummary(rows: Row[], lokasyonIds: string[], prices: Map<string, Price>, rates: Rates | null) {
  const stocked = rows.filter((r) => Number(r.total) > 0);
  const add = (lines: Row[]) => {
    const values = lines.map((r) => unitValue({ total: r.total, price: prices.get(r.id) }, rates));
    const sum = (picked: (number | null)[]) => picked.reduce<number>((s, v) => s + (v ?? 0), 0);
    const both = values.filter((v) => v.purchase !== null && v.sale !== null);
    return {
      products: lines.length,
      units: totalsByUnit(lines, lokasyonIds),
      purchase: sum(values.map((v) => v.purchase)),
      sale: sum(values.map((v) => v.sale)),
      purchaseCounted: values.filter((v) => v.purchase !== null).length,
      saleCounted: values.filter((v) => v.sale !== null).length,
      // Kâr only where both prices exist, or a missing alış fiyatı would read as profit.
      margin: both.reduce((s, v) => s + v.sale! - v.purchase!, 0),
      marginCounted: both.length,
    };
  };
  const names = [...new Set(stocked.map((r) => r.category))].sort((a, b) => a.localeCompare(b, "tr"));
  return { overall: add(stocked), categories: names.map((category) => ({ category, ...add(stocked.filter((r) => r.category === category)) })) };
}

// What a stock-out is worth: a sale at its sale price, material used in production at its purchase price. Null when the price is missing.
export function exitValue(type: string, quantity: string, price: Price | undefined, rates: Rates | null) {
  const amount = quantity.replace("-", "");
  if (type === "satis_teslimati") return inTl(amount, price?.salePrice, price?.saleCurrency, rates);
  if (type === "uretim_tuketimi") return inTl(amount, price?.purchasePrice, price?.purchaseCurrency, rates);
  return null;
}
