"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@artek/ui/components/chart";

type Month = { month: string; sales: number; invoices: number; customers: number; newCustomers: number; incomplete: boolean; best: boolean };

const config = { sales: { label: "Satış (KDV hariç)", color: "var(--chart-1)" } } satisfies ChartConfig;
const short = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const long = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const label = (ym: string) => `${short[Number(ym.slice(5, 7)) - 1]} ${ym.slice(2, 4)}`;
const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Month }[] }) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return (
    <div className="bg-popover rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">
        {long[Number(m.month.slice(5, 7)) - 1]} {m.month.slice(0, 4)}
      </div>
      <div className="font-medium tabular-nums">{full.format(m.sales)} TL</div>
      <div className="tabular-nums">
        {m.invoices} fatura · {m.customers} müşteri · {m.newCustomers} yeni
      </div>
      {m.incomplete && <div className="text-amber-700 dark:text-amber-400">Bu ayda eksik fatura var</div>}
    </div>
  );
}

// Muted bars: months with missing invoice numbers. Outlined bar: the best month.
export function SalesChart({ data }: { data: Month[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} tickFormatter={label} />
        <YAxis tickLine={false} axisLine={false} width={76} tickFormatter={(v: number) => `${compact.format(v)} TL`} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<Tip />} />
        <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.month}
              fill={d.incomplete ? "var(--muted-foreground)" : "var(--color-sales)"}
              fillOpacity={d.incomplete ? 0.3 : 1}
              stroke={d.best ? "var(--foreground)" : "none"}
              strokeWidth={1.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
