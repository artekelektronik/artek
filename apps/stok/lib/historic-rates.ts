import { inArray } from "drizzle-orm";
import { db } from "../db";
import { exchangeRate } from "../db/schema";
import { fetchRatesOn, getRates } from "./exchange-rates";

// Rates for the given dates: cached ones from the database, the rest fetched from TCMB once and kept.
export async function ratesOn(dates: string[]) {
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

// TL to USD at each day's TCMB rate (today's when a day's can't be had).
export async function usdScale(days: string[]) {
  const [rates, today] = await Promise.all([ratesOn(days), getRates()]);
  return (v: number, day: string) => {
    const rate = rates.get(day)?.USD ?? today?.USD;
    return rate ? v / rate : 0;
  };
}
