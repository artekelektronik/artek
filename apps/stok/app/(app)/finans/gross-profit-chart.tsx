"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@artek/ui/components/chart";
import { amountShort, share, shortMonthLabel, tl } from "@/lib/finance-calc";
import type { MonthProfit } from "@/lib/gross-profit-calc";

const config = {
  cost: { label: "Maliyet", color: "var(--chart-2)" },
  gross: { label: "Brüt kâr", color: "var(--chart-1)" },
  uncostedSales: { label: "Fiyatsız satış", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

function Tip({ active, payload }: { active?: boolean; payload?: { payload: MonthProfit }[] }) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return (
    <div className="bg-popover grid gap-0.5 rounded-md border px-2.5 py-1.5 text-xs shadow-md tabular-nums">
      <div className="text-muted-foreground">{shortMonthLabel(m.month)}</div>
      <div>Satış {tl(m.sales)}</div>
      <div>Maliyet {tl(m.cost)}</div>
      <div className="font-medium">
        Brüt kâr {tl(m.gross)} ({share(m.gross, m.costedSales)})
      </div>
      {m.uncostedLines > 0 && (
        <div className="text-amber-700 dark:text-amber-400">
          {m.uncostedLines} satır fiyatsız: {tl(m.uncostedSales)}
        </div>
      )}
    </div>
  );
}

// One bar per month is its sales, split into what it cost, what it earned, and what has no cost yet.
export function GrossProfitChart({ data }: { data: MonthProfit[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} tickFormatter={shortMonthLabel} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={amountShort} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<Tip />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="cost" stackId="s" fill="var(--color-cost)" />
        <Bar dataKey="gross" stackId="s" fill="var(--color-gross)" />
        <Bar dataKey="uncostedSales" stackId="s" fill="var(--color-uncostedSales)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
