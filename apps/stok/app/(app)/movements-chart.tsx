"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@artek/ui/components/chart";

const config = {
  inbound: { label: "Giriş", color: "var(--chart-2)" },
  outbound: { label: "Çıkış", color: "var(--chart-1)" },
} satisfies ChartConfig;

const dayLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const label = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

// Stock movements per day, in and out (shadcn's bar chart with recharts).
export function MovementsChart({ data }: { data: { day: string; inbound: number; outbound: number }[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={label} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(day) => label(String(day))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="inbound" fill="var(--color-inbound)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outbound" fill="var(--color-outbound)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
