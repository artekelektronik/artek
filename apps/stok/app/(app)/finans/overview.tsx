import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@artek/ui/components/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { cn } from "@artek/ui/lib/utils";
import { pct, tl, tlShort } from "@/lib/finance-calc";
import type { MonthNet } from "@/lib/gross-profit-calc";
import { SalesTrend } from "./sales-trend";

// "+%12" against the month before; nothing when there is nothing to compare with. `upIsGood`: false for costs.
function Change({ now, before, upIsGood = true }: { now: number; before: number; upIsGood?: boolean }) {
  if (!before) return null;
  const change = (now - before) / Math.abs(before);
  const up = change >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-0.5 border-transparent tabular-nums",
        up === upIsGood ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive",
      )}
    >
      {up ? "+" : "−"}{pct(Math.abs(change))}
      <Arrow className="size-3" />
    </Badge>
  );
}

function Figure({ value, children }: { value: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
      {children}
    </div>
  );
}

export function SalesOverview({ months, current, previous }: { months: MonthNet[]; current: MonthNet; previous: MonthNet }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Satış · bu ay</CardDescription>
        <CardTitle>
          <Figure value={tl(current.sales)}>
            <Change now={current.sales} before={previous.sales} />
          </Figure>
        </CardTitle>
        <CardAction className="text-muted-foreground text-xs">Geçen ay {tlShort(previous.sales)}</CardAction>
      </CardHeader>
      <CardContent>
        <SalesTrend data={months.slice(-12).map((m) => ({ month: m.month, sales: Math.round(m.sales) }))} />
      </CardContent>
    </Card>
  );
}

const shades = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

// The month's expenses by category: the three biggest, the rest together.
export function ExpensesOverview({ current, previous }: { current: MonthNet; previous: MonthNet }) {
  const sorted = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1]);
  const rest = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
  const parts = [
    ...sorted.slice(0, 3).map(([category, amount], i) => ({ category, amount, color: shades[i], opacity: 1 })),
    ...(rest ? [{ category: "Diğer", amount: rest, color: "var(--muted-foreground)", opacity: 0.25 }] : []),
  ];
  return (
    <Card>
      <CardHeader>
        <CardDescription>Giderler · bu ay</CardDescription>
        <CardTitle>
          <Figure value={tl(current.expenses)}>
            <Change now={current.expenses} before={previous.expenses} upIsGood={false} />
          </Figure>
        </CardTitle>
        <CardAction>
          <Link href="/finans/giderler" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">
            Giderler
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-4">
        {parts.length ? (
          <>
            <span className="text-sm font-medium">Kategoriye göre</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {parts.map((p) => (
                <div key={p.category} className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 truncate text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                    {p.category}
                  </span>
                  <span className="text-muted-foreground pl-3.5 text-xs tabular-nums">{tl(p.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex h-12 overflow-hidden rounded-md">
              {parts.map((p) => (
                <div key={p.category} title={`${p.category}: ${tl(p.amount)}`} style={{ width: `${(p.amount / current.expenses) * 100}%`, background: p.color, opacity: p.opacity }} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Bu ay gider girilmedi.</p>
        )}
      </CardContent>
    </Card>
  );
}
