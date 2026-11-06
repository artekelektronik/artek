"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@artek/ui/components/chart";
import {
  amountShort,
  monthLabel,
  shortMonthLabel,
  tl,
} from "@/lib/finance-calc";

type Month = {
  month: string;
  sales: number;
  invoices: number;
  customers: number;
  newCustomers: number;
  incomplete: boolean;
};

const config = {
  sales: { label: "Satış (KDV hariç)", color: "var(--chart-1)" },
} satisfies ChartConfig;

function Tip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Month }[];
}) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return (
    <div className="bg-popover rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">{monthLabel(m.month)}</div>
      <div className="font-medium tabular-nums">{tl(m.sales)}</div>
      <div className="tabular-nums">
        {m.invoices} fatura · {m.customers} müşteri · {m.newCustomers} yeni
      </div>
      {m.incomplete && (
        <div className="text-amber-700 dark:text-amber-400">
          Bu ayda eksik fatura var
        </div>
      )}
    </div>
  );
}

// Muted bars: months with missing invoice numbers.
export function SalesChart({ data }: { data: Month[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={8}
          tickFormatter={shortMonthLabel}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={76}
          tickFormatter={amountShort}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<Tip />}
        />
        <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.month}
              fill={
                d.incomplete ? "var(--muted-foreground)" : "var(--color-sales)"
              }
              fillOpacity={d.incomplete ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
