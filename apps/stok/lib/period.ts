// The Finans screens' period (?baslangic=&bitis=, YYYY-MM-DD) and currency (?para=usd). Pure: client and server share it.
import { tl, tlShort, usd, usdShort } from "./finance-calc";
import { addDays, addMonths } from "./time";

export type PeriodParams = { baslangic?: string; bitis?: string; para?: string };
export type Period = { from: string; to: string; usd: boolean };

const isDay = (d: string | undefined): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
const monthEnd = (ym: string) => addDays(`${addMonths(ym, 1)}-01`, -1);

// Ready-made ranges, newest first; "Son 3 ay" is the three whole months before this one.
export function periodPresets(today: string) {
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  return [
    { label: "Bu ay", from: `${month}-01`, to: today },
    { label: "Geçen ay", from: `${addMonths(month, -1)}-01`, to: monthEnd(addMonths(month, -1)) },
    { label: "Son 3 ay", from: `${addMonths(month, -3)}-01`, to: monthEnd(addMonths(month, -1)) },
    { label: "Bu yıl", from: `${year}-01-01`, to: today },
    { label: "Geçen yıl", from: `${Number(year) - 1}-01-01`, to: `${Number(year) - 1}-12-31` },
  ];
}

// No range picked: this year so far.
export function financePeriod(params: PeriodParams, today: string): Period {
  const from = isDay(params.baslangic) ? params.baslangic : `${today.slice(0, 4)}-01-01`;
  const to = isDay(params.bitis) ? params.bitis : today;
  return { from, to, usd: params.para === "usd" };
}

export const inPeriod = (day: string, p: { from: string; to: string }) => day >= p.from && day <= p.to;

// Full and short amount formatters in the period's currency.
export const moneyIn = (isUsd: boolean) => (isUsd ? { full: usd, short: usdShort } : { full: tl, short: tlShort });
