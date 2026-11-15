import { headers } from "next/headers";
import { connection } from "next/server";
import { Package, ShoppingCart, Store, Tag } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { CurrencyToggle } from "@/components/currency-toggle";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { StatCard } from "@/components/stat-card";
import { getStockSummary } from "@/lib/dashboard";
import { loadActor } from "@/lib/guard";
import { moneyIn } from "@/lib/period";
import { can } from "@/lib/permissions";

export const metadata = { title: "Stok değeri | Artek" };

type Summary = Awaited<ReturnType<typeof getStockSummary>>["overall"];
const bases = [
  { key: "purchase", counted: "purchaseCounted", label: "Alış", icon: ShoppingCart },
  { key: "saleA", counted: "saleACounted", label: "Toptan (A)", icon: Package },
  { key: "sale", counted: "saleCounted", label: "Normal (B)", icon: Tag },
  { key: "saleC", counted: "saleCCounted", label: "Perakende (C)", icon: Store },
] as const;

export default async function StockValuePage({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const [s, { para }] = await Promise.all([getStockSummary(requestHeaders), searchParams]);
  const usd = para === "usd" && Boolean(s.rates);
  const money = moneyIn(usd);
  // Values are in TL; USD is today's rate, so a USD-priced product shows its own USD price again.
  const shown = (v: number) => (usd ? v / s.rates!.USD : v);
  const cell = (r: Summary, b: (typeof bases)[number]) => (r[b.counted] ? money.short(shown(r[b.key])) : "—");

  return (
    <PanelShell
      title="Stok değeri"
      lede={
        s.rates
          ? `Eldeki stok, dört fiyatla. Kur: 1 USD = ${s.rates.USD.toLocaleString("tr-TR")} TL, 1 EUR = ${s.rates.EUR.toLocaleString("tr-TR")} TL (TCMB döviz satış, ${s.rates.date}). Fiyatı girilmemiş ürün o değere katılmaz.`
          : "Eldeki stok, dört fiyatla. TCMB kuru şu an alınamadı; yalnızca TL fiyatlı ürünler sayıldı."
      }
      actions={<CurrencyToggle />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {bases.map((b) => (
          <StatCard
            key={b.key}
            label={b.label}
            value={s.overall[b.counted] ? money.full(shown(s.overall[b.key])) : "—"}
            note={`${s.overall[b.counted]} / ${s.overall.products} üründe fiyat var`}
            icon={b.icon}
            href="/finans/fiyatlar"
          />
        ))}
      </div>

      <PanelCard title="Kategoriye göre">
        {s.categories.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Çeşit</TableHead>
                {bases.map((b) => (
                  <TableHead key={b.key} className="text-right">
                    {b.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.categories.map((c) => (
                <TableRow key={c.category}>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.products}</TableCell>
                  {bases.map((b) => (
                    <TableCell key={b.key} className="text-right tabular-nums">
                      {cell(c, b)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Toplam</TableCell>
                <TableCell className="text-right tabular-nums">{s.overall.products}</TableCell>
                {bases.map((b) => (
                  <TableCell key={b.key} className="text-right tabular-nums">
                    {cell(s.overall, b)}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">Henüz stok yok.</p>
        )}
      </PanelCard>
    </PanelShell>
  );
}
