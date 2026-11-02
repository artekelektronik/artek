import { headers } from "next/headers";
import { NoAccess } from "@/components/no-access";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { movementTypeLabels } from "@/lib/labels";
import { activeProducts, availableByLokasyon, lokasyonFor } from "@/lib/pickers";
import { stockOutTypes } from "@/lib/stock-out";
import { recordStockOutAction } from "./actions";
import { StockOutFields } from "./stock-out-fields";

export const metadata = { title: "Stok çıkışı | Artek" };

export default async function StockOutPage() {
  const actor = await loadActor(await headers());
  const [lokasyon, products] = await Promise.all([lokasyonFor(actor, "stock.out"), activeProducts()]);
  if (lokasyon.length === 0) return <NoAccess />;
  const available = await availableByLokasyon(lokasyon.map((l) => l.id));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Stok çıkışı</h1>
      <p className="text-muted-foreground max-w-3xl text-sm">
        Satış teslimatı, üretim tüketimi ve fire burada elle kaydedilir. Kullanılabilir stoktan fazlası çıkarılamaz.
      </p>
      <StockForm action={recordStockOutAction} submitLabel="Çıkışı kaydet" savedMessage="Stok çıkışı kaydedildi.">
        <StockOutFields
          types={stockOutTypes.map((type) => ({ value: type, label: movementTypeLabels[type] }))}
          lokasyon={lokasyon.map((l) => ({ value: l.id, label: l.name }))}
          products={products}
          availableByLokasyon={available}
        />
      </StockForm>
    </div>
  );
}
