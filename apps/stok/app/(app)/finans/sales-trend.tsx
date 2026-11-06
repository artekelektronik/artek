"use client";

import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import { amountShort, monthLabel, shortMonthLabel, tl } from "@/lib/finance-calc";

const config = { sales: { label: "Satış", colors: { light: ["var(--chart-1)"] } } };

export function SalesTrend({ data }: { data: { month: string; sales: number }[] }) {
  return (
    <EvilAreaChart config={config} data={data} className="aspect-auto h-44 w-full" curveType="monotone">
      <EvilAreaChart.Grid vertical={false} />
      <EvilAreaChart.XAxis dataKey="month" tickFormatter={shortMonthLabel} />
      <EvilAreaChart.YAxis width={56} tickFormatter={amountShort} />
      <EvilAreaChart.Tooltip valueFormatter={tl} labelFormatter={monthLabel} />
      <EvilAreaChart.Area dataKey="sales" variant="gradient" />
    </EvilAreaChart>
  );
}
