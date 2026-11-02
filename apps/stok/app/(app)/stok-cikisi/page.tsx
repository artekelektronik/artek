import { headers } from "next/headers";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { NoAccess } from "@/components/no-access";
import { ProductLines } from "@/components/product-lines";
import { FormSelect } from "@/components/form-select";
import { MovementTable } from "@/components/movement-table";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { movementTypeLabels } from "@/lib/labels";
import { listMovements } from "@/lib/ledger";
import { can } from "@/lib/permissions";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { stockOutTypes } from "@/lib/stock-out";
import { exitValues } from "@/lib/stock-out-report";
import { recordStockOutAction } from "./actions";

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
  const values = await exitValues(actor, recent);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok çıkışı</h1>
      <p className="text-muted-foreground max-w-3xl text-sm">
        Satış teslimatı, üretim tüketimi ve fire burada elle kaydedilir. Kullanılabilir stoktan fazlası çıkarılamaz.
      </p>
      <StockForm action={recordStockOutAction} submitLabel="Çıkışı kaydet" savedMessage="Stok çıkışı kaydedildi.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Label className="flex-col items-stretch gap-1">
            Çıkış türü
            <FormSelect
              name="type"
              options={stockOutTypes.map((type) => ({ value: type, label: movementTypeLabels[type] }))}
              className="w-full"
            />
          </Label>
          <Label className="flex-col items-stretch gap-1">
            Lokasyon
            <FormSelect name="lokasyonId" options={lokasyon.map((l) => ({ value: l.id, label: l.name }))} className="w-full" />
          </Label>
          <Label className="flex-col items-stretch gap-1">
            Neden
            <Input name="reason" required className="font-normal" placeholder="Örn. müşteri teslimatı, kırık parça" />
          </Label>
          <Label className="flex-col items-stretch gap-1">
            Referans (isteğe bağlı)
            <Input name="reference" className="font-normal" placeholder="Fatura, iş veya müşteri no" />
          </Label>
        </div>
        <ProductLines products={products} />
      </StockForm>
      <h2 className="mt-4 text-lg font-semibold">Son çıkışlar</h2>
      <MovementTable movements={recent} canReverse={can(actor, "stock.reverse")} values={values} />
    </div>
  );
}
