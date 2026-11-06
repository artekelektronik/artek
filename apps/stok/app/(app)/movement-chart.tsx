"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@artek/ui/components/chart";

const config = {
  in: { label: "Giriş", color: "var(--primary)" },
  out: { label: "Çıkış", color: "var(--muted-foreground)" },
} satisfies ChartConfig;
const short = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

// The last six months up to `thisMonth`, with empty months as zero.
export function MovementChart({ thisMonth, data }: { thisMonth: string; data: { month: string; in: number; out: number }[] }) {
  const [year, month] = thisMonth.split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 6 + i, 1));
    const ym = d.toISOString().slice(0, 7);
    const row = data.find((r) => r.month === ym);
    return { month: short[d.getUTCMonth()], in: row?.in ?? 0, out: row?.out ?? 0 };
  });
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={months} margin={{ left: 0, right: 0, top: 8 }} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent />} />
        <ChartLegend verticalAlign="top" align="right" content={<ChartLegendContent className="justify-end pt-0 pb-3" />} />
        <Bar dataKey="in" fill="var(--color-in)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="out" fill="var(--color-out)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}
