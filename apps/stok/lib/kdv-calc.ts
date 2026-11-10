// KDV per month: on sales (hesaplanan) less on Giderler (indirilecek). Pure, so tests need no database.
type Amounts = { day: string; netAmount: string; totalAmount: string };
export type KdvMonth = { month: string; sales: number; expenses: number; payable: number };

const kdvOf = (r: Amounts) => Number(r.totalAmount) - Number(r.netAmount);

// `sales`: an iade's KDV comes off. Months with neither are left out.
export function monthlyKdv(sales: (Amounts & { isReturn: boolean })[], expenses: Amounts[]): KdvMonth[] {
  const byMonth = new Map<string, KdvMonth>();
  const at = (day: string) => {
    const month = day.slice(0, 7);
    const m = byMonth.get(month) ?? { month, sales: 0, expenses: 0, payable: 0 };
    byMonth.set(month, m);
    return m;
  };
  for (const s of sales) at(s.day).sales += (s.isReturn ? -1 : 1) * kdvOf(s);
  for (const e of expenses) at(e.day).expenses += kdvOf(e);
  return [...byMonth.values()].map((m) => ({ ...m, payable: m.sales - m.expenses })).sort((a, b) => a.month.localeCompare(b.month));
}

// The months from `from` to `to` (YYYY-MM-DD) added up.
export function kdvBetween(months: KdvMonth[], from: string, to: string) {
  const picked = months.filter((m) => m.month >= from.slice(0, 7) && m.month <= to.slice(0, 7));
  const sum = (k: "sales" | "expenses" | "payable") => picked.reduce((s, m) => s + m[k], 0);
  return { sales: sum("sales"), expenses: sum("expenses"), payable: sum("payable") };
}
