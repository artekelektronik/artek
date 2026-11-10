"use client";

import { useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { amountShort, monthLabel, shortMonthLabel } from "@/lib/finance-calc";
import { moneyIn } from "@/lib/period";

type Key = "sales" | "gross" | "expenses" | "net";
type Month = Record<Key, number> & { month: string };

const views: { key: Key; label: string; color: string }[] = [
  { key: "sales", label: "Satış", color: "var(--chart-1)" },
  { key: "gross", label: "Brüt kâr", color: "var(--chart-2)" },
  { key: "expenses", label: "Giderler", color: "var(--chart-5)" },
  { key: "net", label: "Net", color: "var(--chart-3)" },
];

// One figure month by month over the picked period, in its currency.
export function MonthResults({ months, usd }: { months: Month[]; usd: boolean }) {
  const [key, setKey] = useState<Key>("sales");
  const view = views.find((v) => v.key === key)!;
  const money = moneyIn(usd);
  const data = months.map((m) => ({ month: m.month, value: Math.round(m[key]) }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aylara göre {view.label.toLocaleLowerCase("tr-TR")}</CardTitle>
        <CardDescription>{usd ? "USD" : "TL"}, KDV hariç</CardDescription>
        <CardAction>
          <Tabs value={key} onValueChange={(v) => setKey(v as Key)}>
            <TabsList>
              {views.map((v) => (
                <TabsTrigger key={v.key} value={v.key}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <EvilBarChart key={key} config={{ value: { label: view.label, colors: { light: [view.color] } } }} data={data} className="aspect-auto h-64 w-full" barRadius={6}>
          <EvilBarChart.Grid vertical={false} />
          <EvilBarChart.XAxis dataKey="month" tickFormatter={shortMonthLabel} />
          <EvilBarChart.YAxis width={56} tickFormatter={amountShort} />
          <EvilBarChart.Tooltip valueFormatter={money.full} labelFormatter={monthLabel} />
          <EvilBarChart.Bar dataKey="value" variant="gradient" enableHoverHighlight />
        </EvilBarChart>
      </CardContent>
    </Card>
  );
}
