"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@artek/ui/components/chart";
import { amountShort, shortMonthLabel, tl } from "@/lib/finance-calc";
import type { MonthNet } from "@/lib/gross-profit-calc";

const config = {
  gross: { label: "Brüt kâr", color: "var(--chart-1)" },
  expenses: { label: "Giderler", color: "var(--chart-5)" },
  net: { label: "Net", color: "var(--foreground)" },
} satisfies ChartConfig;

function Tip({ active, payload }: { active?: boolean; payload?: { payload: MonthNet }[] }) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  const top = Object.entries(m.byCategory).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-popover grid gap-0.5 rounded-md border px-2.5 py-1.5 text-xs shadow-md tabular-nums">
      <div className="text-muted-foreground">{shortMonthLabel(m.month)}</div>
      <div>Satış {tl(m.sales)}</div>
      <div>Brüt kâr {tl(m.gross)}</div>
      <div>Giderler {tl(m.expenses)}</div>
      {top.map(([category, amount]) => (
        <div key={category} className="text-muted-foreground pl-2">
          {category} {tl(amount)}
        </div>
      ))}
      <div className={m.net < 0 ? "text-destructive font-medium" : "font-medium"}>Net {tl(m.net)}</div>
      {m.incomplete && <div className="text-amber-700 dark:text-amber-400">Maliyeti bilinmeyen satış var</div>}
    </div>
  );
}

export function NetChart({ data }: { data: MonthNet[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} tickFormatter={shortMonthLabel} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={amountShort} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<Tip />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="gross" fill="var(--color-gross)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
        <Line dataKey="net" type="monotone" stroke="var(--color-net)" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ChartContainer>
  );
}
