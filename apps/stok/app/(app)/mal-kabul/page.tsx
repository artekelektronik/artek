import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { FormSelect } from "@/components/form-select";
import { FormSheet } from "@/components/form-sheet";
import { DateRangeForm, type DateRangeParams } from "@/components/date-range-form";
import { MovementTable } from "@/components/movement-table";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { ProductLines } from "@/components/product-lines";
import { QuickAddProduct } from "@/components/quick-add-product";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { listMovements } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { listCategories } from "@/lib/products";
import { dayRange } from "@/lib/time";
import { recordReceiptAction } from "./actions";

export const metadata = { title: "Mal kabul | Artek" };

export default async function ReceiptPage({ searchParams }: { searchParams: Promise<DateRangeParams> }) {
  const params = await searchParams;
  const range = dayRange(params);
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const canAddProduct = can(actor, "products.manage");
  const [lokasyon, products, categories, recent] = await Promise.all([
    lokasyonFor(actor, "stock.receive"),
    activeProducts(),
    canAddProduct ? listCategories(requestHeaders) : [],
    listMovements(requestHeaders, { type: "mal_kabul", ...range, limit: range.from || range.to ? undefined : 50 }),
  ]);
  if (lokasyon.length === 0) return <NoAccess />;

  return (
    <PanelShell
      title="Mal kabul"
      lede="Tedarikçiden gelen ürünler stoğa burada girer."
      actions={
        <FormSheet
          title="Mal kabul"
          description="Kaydedilen miktarlar seçilen Lokasyonun stoğuna hemen eklenir."
          trigger={
            <Button>
              <Plus /> Mal kabul
            </Button>
          }
        >
          <StockForm action={recordReceiptAction} submitLabel="Mal kabulü kaydet" savedMessage="Mal kabul kaydedildi; stok güncellendi.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Label className="flex-col items-stretch gap-1">
                Lokasyon
                <FormSelect name="lokasyonId" options={lokasyon.map((l) => ({ value: l.id, label: l.name }))} className="w-full" />
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Tedarikçi
                <Input name="supplier" className="font-normal" />
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Belge no (irsaliye / fatura)
                <Input name="reference" className="font-normal" />
              </Label>
            </div>
            <ProductLines products={products} actions={canAddProduct && <QuickAddProduct categories={categories} />} />
          </StockForm>
        </FormSheet>
      }
    >
      <PanelCard title={range.from || range.to ? "Mal kabuller" : "Son mal kabuller"}>
        <DateRangeForm params={params} />
        <MovementTable key={[params.baslangic, params.bitis].join("|")} movements={recent} canReverse={can(actor, "stock.reverse")} />
      </PanelCard>
    </PanelShell>
  );
}
