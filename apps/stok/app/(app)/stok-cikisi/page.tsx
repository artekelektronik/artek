import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { DateRangeForm, type DateRangeParams } from "@/components/date-range-form";
import { FormSheet } from "@/components/form-sheet";
import { NoAccess } from "@/components/no-access";
import { PanelCard, PanelShell } from "@/components/panel";
import { MovementTable } from "@/components/movement-table";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { movementTypeLabels } from "@/lib/labels";
import { listMovements } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { activeProducts, availableByLokasyon, lokasyonFor } from "@/lib/pickers";
import { stockOutTypes } from "@/lib/stock-out";
import { dayRange } from "@/lib/time";
import { exitValues } from "@/lib/stock-out-report";
import { recordStockOutAction } from "./actions";
import { StockOutFields } from "./stock-out-fields";

export const metadata = { title: "Stok çıkışı | Artek" };

export default async function StockOutPage({ searchParams }: { searchParams: Promise<DateRangeParams> }) {
  const params = await searchParams;
  const range = dayRange(params);
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [lokasyon, products, recent] = await Promise.all([
    lokasyonFor(actor, "stock.out"),
    activeProducts(),
    listMovements(requestHeaders, { types: stockOutTypes, ...range, limit: range.from || range.to ? undefined : 50 }),
  ]);
  if (lokasyon.length === 0) return <NoAccess />;
  const [available, values] = await Promise.all([availableByLokasyon(lokasyon.map((l) => l.id)), exitValues(actor, recent)]);

  return (
    <PanelShell
      title="Stok çıkışı"
      lede="Satış teslimatı, üretim tüketimi ve fire burada elle kaydedilir. Kullanılabilir stoktan fazlası çıkarılamaz."
      actions={
        <FormSheet
          title="Stok çıkışı"
          description="Kullanılabilir stoktan fazlası çıkarılamaz."
          trigger={
            <Button>
              <Plus /> Stok çıkışı
            </Button>
          }
        >
          <StockForm action={recordStockOutAction} submitLabel="Çıkışı kaydet" savedMessage="Stok çıkışı kaydedildi.">
            <StockOutFields
              types={stockOutTypes.map((type) => ({ value: type, label: movementTypeLabels[type] }))}
              lokasyon={lokasyon.map((l) => ({ value: l.id, label: l.name }))}
              products={products}
              availableByLokasyon={available}
            />
          </StockForm>
        </FormSheet>
      }
    >
      <PanelCard title={range.from || range.to ? "Çıkışlar" : "Son çıkışlar"}>
        <DateRangeForm params={params} />
        <MovementTable key={[params.baslangic, params.bitis].join("|")} movements={recent} canReverse={can(actor, "stock.reverse")} values={values} />
      </PanelCard>
    </PanelShell>
  );
}
