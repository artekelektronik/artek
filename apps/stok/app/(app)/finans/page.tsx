import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { ChartColumn, Coins, Receipt, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { CurrencyToggle } from "@/components/currency-toggle";
import { DateRangeFilter } from "@/components/date-range-filter";
import { NoAccess } from "@/components/no-access";
import { PanelShell, panelWarning } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { fillRecurringExpenses } from "@/lib/expenses";
import { financeSummary, share } from "@/lib/finance";
import { financeResults } from "@/lib/gross-profit";
import { loadActor } from "@/lib/guard";
import { unInvoicedSales } from "@/lib/payments";
import { financePeriod, moneyIn, type PeriodParams } from "@/lib/period";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";
import { CustomersTab } from "./customers-tab";
import { MonthResults } from "./month-results";
import { MonthlyTable, UncostedLines } from "./monthly-table";

export const metadata = { title: "Finansal özet | Artek" };

export default async function FinancePage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const today = istanbulDate(new Date());
  const period = financePeriod(await searchParams, today);
  await fillRecurringExpenses(today);
  const [s, r, unInvoiced] = await Promise.all([
    financeSummary(requestHeaders, "finance.view"),
    financeResults(requestHeaders, period),
    unInvoicedSales(requestHeaders, period.from, period.to),
  ]);

  const money = moneyIn(period.usd);
  const sum = (k: "sales" | "costedSales" | "gross" | "expenses" | "expensesWithKdv" | "net") => r.months.reduce((t, m) => t + m[k], 0);
  const note = period.usd ? "Her tutar kendi tarihindeki TCMB kuruyla USD’ye çevrildi." : "KDV hariç.";

  const overview = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Satış" value={money.full(sum("sales"))} note={unInvoiced && !period.usd ? `${money.short(unInvoiced)} faturasız (proforma)` : note} icon={ChartColumn} href="/faturalar" />
        <StatCard label="Brüt kâr" value={money.full(sum("gross"))} note={`Kâr oranı ${share(sum("gross"), sum("costedSales"))}`} icon={Coins} />
        <StatCard label="Giderler" value={money.full(sum("expenses"))} note={`KDV dahil ${money.short(sum("expensesWithKdv"))}`} icon={Receipt} href="/finans/giderler" />
        <StatCard label="Net" value={money.full(sum("net"))} note="Brüt kâr − Giderler" icon={Wallet} />
      </div>
      {r.months.length > 0 ? (
        <>
          <MonthResults months={r.months} usd={period.usd} />
          <MonthlyTable months={r.months} usd={period.usd} note={note} />
        </>
      ) : (
        <p className="text-muted-foreground">
          Bu tarihlerde onaylı satış ya da gider yok.{" "}
          <Link href="/faturalar" className="text-foreground underline underline-offset-4">
            Faturalar
          </Link>
        </p>
      )}
      <UncostedLines lines={r.uncosted} />
    </div>
  );

  return (
    <PanelShell
      title="Finansal özet"
      lede="Seçilen tarihlerdeki satış, brüt kâr, gider ve net. Satış onaylı faturalardan, gider Giderler’den."
      warning={s.invoiceCount > 0 ? panelWarning(s.gaps) : undefined}
      actions={
        <>
          <DateRangeFilter fallback={period} />
          <CurrencyToggle />
        </>
      }
    >
      {s.invoiceCount > 0 ? (
        <Tabs defaultValue="ozet" className="gap-4">
          <TabsList>
            <TabsTrigger value="ozet">Özet</TabsTrigger>
            <TabsTrigger value="musteriler">Müşteriler (tüm zamanlar)</TabsTrigger>
          </TabsList>
          <TabsContent value="ozet">{overview}</TabsContent>
          <TabsContent value="musteriler">
            <CustomersTab s={s} crm={can(actor, "crm.view")} />
          </TabsContent>
        </Tabs>
      ) : (
        overview
      )}
    </PanelShell>
  );
}
