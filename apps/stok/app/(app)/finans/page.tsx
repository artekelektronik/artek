import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@artek/ui/components/tabs";
import { NoAccess } from "@/components/no-access";
import { PanelShell, panelLede, panelWarning } from "@/components/panel";
import { fillRecurringExpenses, listExpenses, upcomingExpenses } from "@/lib/expenses";
import { financeSummary } from "@/lib/finance";
import { grossProfit } from "@/lib/gross-profit";
import { emptyMonth, monthlyNet } from "@/lib/gross-profit-calc";
import { loadActor } from "@/lib/guard";
import { recentInvoices } from "@/lib/invoices";
import { can } from "@/lib/permissions";
import { addMonths, istanbulDate } from "@/lib/time";
import { CustomersTab } from "./customers-tab";
import { MonthResults } from "./month-results";
import { MonthlyTable, UncostedLines } from "./monthly-table";
import { ExpensesOverview, SalesOverview } from "./overview";
import { RecentInvoicesCard, UpcomingCard, YearCard } from "./side-cards";

export const metadata = { title: "Finansal özet | Artek" };

export default async function FinancePage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const crm = can(actor, "crm.view");
  const today = istanbulDate(new Date());
  await fillRecurringExpenses(today);
  const [s, gp, spent, upcoming, recent] = await Promise.all([
    financeSummary(requestHeaders, "finance.view"),
    grossProfit(requestHeaders),
    listExpenses(requestHeaders),
    upcomingExpenses(requestHeaders),
    recentInvoices(requestHeaders, 5),
  ]);

  const { months, years } = monthlyNet(gp.months, spent);
  const thisMonth = today.slice(0, 7);
  const year = today.slice(0, 4);
  const at = (ym: string) => months.find((m) => m.month === ym) ?? emptyMonth(ym);
  const current = at(thisMonth);
  const previous = at(addMonths(thisMonth, -1));
  const yearTotals = years.find((y) => y.year === year) ?? { year, sales: 0, costedSales: 0, gross: 0, uncostedSales: 0, expenses: 0, net: 0, byCategory: {} };
  const hasSales = s.invoiceCount > 0;

  const overview = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesOverview months={months} current={current} previous={previous} />
        <ExpensesOverview current={current} previous={previous} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MonthResults months={months} year={year} />
        <UpcomingCard items={upcoming} canEdit={can(actor, "finance.edit")} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {hasSales ? (
          <RecentInvoicesCard rows={recent} />
        ) : (
          <p className="text-muted-foreground lg:col-span-2">
            Henüz onaylı satış faturası yok.{" "}
            <Link href="/faturalar" className="text-foreground underline underline-offset-4">
              Faturaları yükleyin
            </Link>
            ; satış ve brüt kâr onlardan hesaplanır.
          </p>
        )}
        <YearCard totals={yearTotals} />
      </div>
      {months.length > 0 && <MonthlyTable months={months} years={years} />}
      <UncostedLines lines={gp.uncosted} />
    </div>
  );

  return (
    <PanelShell title="Finansal özet" lede={hasSales ? panelLede(s) : undefined} warning={hasSales ? panelWarning(s.gaps) : undefined}>
      {hasSales ? (
        <Tabs defaultValue="ozet" className="gap-4">
          <TabsList>
            <TabsTrigger value="ozet">Özet</TabsTrigger>
            <TabsTrigger value="musteriler">Müşteriler</TabsTrigger>
          </TabsList>
          <TabsContent value="ozet">{overview}</TabsContent>
          <TabsContent value="musteriler">
            <CustomersTab s={s} crm={crm} />
          </TabsContent>
        </Tabs>
      ) : (
        overview
      )}
    </PanelShell>
  );
}
