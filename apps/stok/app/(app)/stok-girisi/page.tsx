import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@artek/ui/components/badge";
import { NoAccess } from "@/components/no-access";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { lokasyonPurpose } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { listCategories } from "@/lib/products";
import { getStockEntrySheet } from "@/lib/stock-entry";
import { approveStockEntriesAction } from "./actions";
import { StockEntrySheet } from "./stock-entry-sheet";

export const metadata = { title: "Stok girişi | Artek" };

export default async function StockEntryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const requestHeaders = await headers();
  const [actor, sheet, categories] = await Promise.all([
    loadActor(requestHeaders),
    getStockEntrySheet(requestHeaders),
    listCategories(requestHeaders),
  ]);
  if (sheet.lokasyon.length === 0) return <NoAccess />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Stok girişi</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Sayılan stoğu kutuya yazın, üstteki karttan onaylayın: <strong className="text-foreground">mevcut stoğun üstüne eklenir</strong> ve Stok hareketleri&apos;nde
          görünür. Yanlış sayıyı düzeltmek için <strong className="text-foreground">Düzenle</strong>&apos;ye basın. Satın alınan mallar{" "}
          <Link href="/mal-kabul" className="text-foreground underline underline-offset-4">
            Mal kabul
          </Link>
          &apos;e yazılır.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {sheet.lokasyon.map((l) => (
          <div key={l.id} className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{l.name}</span>
              {l.opened ? <Badge variant="secondary">Açık</Badge> : <Badge variant="outline">Açılış bekliyor</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{lokasyonPurpose[l.name]}</p>
            {l.pending > 0 &&
              (l.canApprove ? (
                <StockForm
                  action={approveStockEntriesAction.bind(null, l.id)}
                  submitLabel={`${l.pending} girişi onayla`}
                  savedMessage="Onaylandı, stoka işlendi."
                >
                  <p className="text-sm">{l.opened ? "Onaylanınca mevcut stoğun üstüne eklenir." : "Onaylanınca açılış stoku olur."}</p>
                </StockForm>
              ) : (
                <p className="text-sm">{l.pending} giriş onay bekliyor.</p>
              ))}
          </div>
        ))}
      </section>

      <StockEntrySheet sheet={sheet} categories={categories} initialQuery={q ?? ""} canAddProduct={can(actor, "products.manage")} />
    </div>
  );
}
