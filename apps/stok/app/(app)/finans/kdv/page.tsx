import { headers } from "next/headers";
import { connection } from "next/server";
import { CalendarClock, CalendarDays, CalendarRange, History } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { cn } from "@artek/ui/lib/utils";
import { DateRangeFilter } from "@/components/date-range-filter";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { monthLabel, tl } from "@/lib/finance-calc";
import { loadActor } from "@/lib/guard";
import { kdvByMonth } from "@/lib/kdv";
import { kdvBetween } from "@/lib/kdv-calc";
import { financePeriod, periodPresets, type PeriodParams } from "@/lib/period";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";

export const metadata = { title: "KDV | Artek" };

const icons = { "Bu ay": CalendarDays, "Geçen ay": CalendarClock, "Son 3 ay": History, "Bu yıl": CalendarRange } as const;
const Signed = ({ value }: { value: number }) => <span className={cn("tabular-nums", value < 0 && "text-emerald-600 dark:text-emerald-400")}>{tl(value)}</span>;

export default async function KdvPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const today = istanbulDate(new Date());
  const period = financePeriod(await searchParams, today);
  const months = await kdvByMonth(requestHeaders);
  const cards = periodPresets(today).filter((p) => p.label in icons);
  const shown = months.filter((m) => m.month >= period.from.slice(0, 7) && m.month <= period.to.slice(0, 7)).reverse();
  const total = kdvBetween(months, period.from, period.to);

  return (
    <PanelShell
      title="KDV"
      lede="Satış faturalarındaki KDV (hesaplanan) eksi Giderlerdeki KDV (indirilecek). Proformalar sayılmaz; mal alımlarının KDV’si Giderler’e girildiyse düşülür. Tahmindir, beyanname için muhasebeyle karşılaştırın."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((p) => {
          const k = kdvBetween(months, p.from, p.to);
          return (
            <StatCard
              key={p.label}
              label={`${p.label} · ${p.from.slice(0, 7) === p.to.slice(0, 7) ? monthLabel(p.from.slice(0, 7)) : `${monthLabel(p.from.slice(0, 7))} – ${monthLabel(p.to.slice(0, 7))}`}`}
              value={tl(k.payable)}
              note={`Satış ${tl(k.sales)} − Gider ${tl(k.expenses)}`}
              icon={icons[p.label as keyof typeof icons]}
            />
          );
        })}
      </div>

      <PanelCard title="Aylara göre" note="Fark eksiyse o ay devreden KDV var (yeşil).">
        <DateRangeFilter fallback={period} />
        {shown.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ay</TableHead>
                <TableHead className="text-right">Satış KDV</TableHead>
                <TableHead className="text-right">Gider KDV</TableHead>
                <TableHead className="text-right">Fark (ödenecek)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((m) => (
                <TableRow key={m.month}>
                  <TableCell>{monthLabel(m.month)}</TableCell>
                  <TableCell className="text-right tabular-nums">{tl(m.sales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{tl(m.expenses)}</TableCell>
                  <TableCell className="text-right font-medium">
                    <Signed value={m.payable} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Toplam</TableCell>
                <TableCell className="text-right tabular-nums">{tl(total.sales)}</TableCell>
                <TableCell className="text-right tabular-nums">{tl(total.expenses)}</TableCell>
                <TableCell className="text-right">
                  <Signed value={total.payable} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">Bu tarihlerde KDV’li fatura ya da gider yok.</p>
        )}
      </PanelCard>
    </PanelShell>
  );
}
