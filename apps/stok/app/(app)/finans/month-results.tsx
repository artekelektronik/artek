"use client";

import { useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import { amountShort, monthLabel, shortMonthLabel, tl } from "@/lib/finance-calc";

type Key = "sales" | "gross" | "expenses" | "net";
type Month = Record<Key, number> & { month: string };

const views: { key: Key; label: string; color: string }[] = [
  { key: "sales", label: "Satış", color: "var(--chart-1)" },
  { key: "gross", label: "Brüt kâr", color: "var(--chart-2)" },
  { key: "expenses", label: "Giderler", color: "var(--chart-5)" },
  { key: "net", label: "Net", color: "var(--chart-3)" },
];

// The big number is this year's total of the picked figure.
export function MonthResults({ months, year }: { months: Month[]; year: string }) {
  const [key, setKey] = useState<Key>("net");
  const view = views.find((v) => v.key === key)!;
  const total = months.filter((m) => m.month.startsWith(year)).reduce((s, m) => s + m[key], 0);
  const data = months.slice(-12).map((m) => ({ month: m.month, value: Math.round(m[key]) }));
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>
          {year} {view.label.toLocaleLowerCase("tr-TR")}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">{tl(total)}</CardTitle>
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
          <EvilBarChart.Tooltip valueFormatter={tl} labelFormatter={monthLabel} />
          <EvilBarChart.Bar dataKey="value" variant="gradient" enableHoverHighlight />
        </EvilBarChart>
      </CardContent>
    </Card>
  );
}
