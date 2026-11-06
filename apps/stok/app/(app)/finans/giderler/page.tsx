import { headers } from "next/headers";
import { connection } from "next/server";
import { CalendarClock, CalendarDays, CalendarRange, Tags } from "lucide-react";
import { NoAccess } from "@/components/no-access";
import { chartColors, HBars, PanelCard, PanelShell } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { listExpenses, startingCategories } from "@/lib/expenses";
import { monthLabel, tl, tlShort } from "@/lib/finance";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { istanbulDate } from "@/lib/time";
import { ExpenseSheet } from "./expense-sheet";
import { AddExpenseButton, ExpenseTable } from "./expense-table";

export const metadata = { title: "Giderler | Artek" };

export default async function ExpensesPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const canEdit = can(actor, "finance.edit");
  const rows = (await listExpenses(requestHeaders)).map(({ id, spentOn, category, description, party, netAmount, kdvRate, totalAmount, fileName }) => ({
    id,
    spentOn,
    category,
    description,
    party,
    netAmount,
    kdvRate,
    totalAmount,
    fileName,
  }));

  const today = istanbulDate(new Date());
  const month = today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const lastMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const sum = (prefix: string) => rows.filter((r) => r.spentOn.startsWith(prefix)).reduce((s, r) => s + Number(r.netAmount), 0);
  const thisYear = rows.filter((r) => r.spentOn.startsWith(String(y)));
  const byCategory = Object.entries(Object.groupBy(thisYear, (r) => r.category))
    .map(([category, list]) => ({ category, total: list!.reduce((s, r) => s + Number(r.netAmount), 0) }))
    .sort((a, b) => b.total - a.total);
  const categories = [...new Set([...startingCategories, ...rows.map((r) => r.category)])];

  return (
    <PanelShell
      title="Giderler"
      lede="Artek’in ödediği giderler: kira, maaş, vergi, tedarikçi faturaları… Tutarlar KDV hariç; aylık net hesabında satıştan düşülür."
      actions={canEdit && <AddExpenseButton />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bu ay" value={tl(sum(month))} note={monthLabel(month)} icon={CalendarDays} />
        <StatCard label="Geçen ay" value={tl(sum(lastMonth))} note={monthLabel(lastMonth)} icon={CalendarClock} />
        <StatCard label={`${y} toplamı`} value={tl(sum(String(y)))} note={`${thisYear.length.toLocaleString("tr-TR")} gider`} icon={CalendarRange} />
        <StatCard
          label="En büyük kalem"
          value={byCategory[0] ? tlShort(byCategory[0].total) : "—"}
          note={byCategory[0] ? `${byCategory[0].category}, ${y}` : "Bu yıl gider yok"}
          icon={Tags}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <PanelCard title={`${y} kategoriye göre`} note="KDV hariç." className="xl:col-span-1">
          {byCategory.length ? (
            <HBars rows={byCategory.map((c, i) => ({ key: c.category, label: c.category, value: c.total, display: tlShort(c.total), color: chartColors[i % chartColors.length] }))} />
          ) : (
            <p className="text-muted-foreground text-sm">Bu yıl henüz gider yok.</p>
          )}
        </PanelCard>
        <PanelCard title="Tüm giderler" note="Tarihe, kategoriye göre süzün; toplamlar süzülen satırlardan." className="xl:col-span-2">
          <ExpenseTable rows={rows} canEdit={canEdit} />
        </PanelCard>
      </div>

      <ExpenseSheet rows={rows} categories={categories} canEdit={canEdit} today={today} />
    </PanelShell>
  );
}
