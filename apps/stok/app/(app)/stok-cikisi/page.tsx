import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { Button } from "@artek/ui/components/button";
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
import { exitValues } from "@/lib/stock-out-report";
import { recordStockOutAction } from "./actions";
import { StockOutFields } from "./stock-out-fields";

export const metadata = { title: "Stok çıkışı | Artek" };

export default async function StockOutPage() {
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [lokasyon, products, recent] = await Promise.all([
    lokasyonFor(actor, "stock.out"),
    activeProducts(),
    listMovements(requestHeaders, { types: stockOutTypes, limit: 50 }),
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
      <PanelCard title="Son çıkışlar">
        <MovementTable movements={recent} canReverse={can(actor, "stock.reverse")} values={values} />
      </PanelCard>
    </PanelShell>
  );
}
