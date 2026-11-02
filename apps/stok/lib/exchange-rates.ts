export type Rates = { USD: number; EUR: number; date: string };

const feed = "https://www.tcmb.gov.tr/kurlar/today.xml";

// TCMB's döviz satış rate of the day, from its daily bulletin; null if the bulletin doesn't have both currencies.
export function parseRates(xml: string): Rates | null {
  const rate = (code: string) => Number(xml.match(new RegExp(`CurrencyCode="${code}"[\\s\\S]*?<ForexSelling>([\\d.]+)<`))?.[1]);
  const USD = rate("USD");
  const EUR = rate("EUR");
  const date = xml.match(/Tarih="([\d.]+)"/)?.[1];
  return USD > 0 && EUR > 0 && date ? { USD, EUR, date } : null;
}

// Hourly at most. TCMB being down must not take the home page with it: without rates only TL prices are counted.
export async function getRates(): Promise<Rates | null> {
  try {
    const response = await fetch(feed, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    return response.ok ? parseRates(await response.text()) : null;
  } catch {
    return null;
  }
}
