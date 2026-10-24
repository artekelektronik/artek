import { headers } from "next/headers";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { NoAccess } from "@/components/no-access";
import { ProductLines } from "@/components/product-lines";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { movementTypeLabels } from "@/lib/labels";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { stockOutTypes } from "@/lib/stock-out";
import { selectClassName } from "@/lib/ui";
import { recordStockOutAction } from "./actions";

export const metadata = { title: "Stok çıkışı | Artek Stok" };

export default async function StockOutPage() {
  const actor = await loadActor(await headers());
  const [lokasyon, products] = await Promise.all([lokasyonFor(actor, "stock.out"), activeProducts()]);
  if (lokasyon.length === 0) return <NoAccess />;

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
            <select name="type" className={`${selectClassName} w-full font-normal`} required>
              {stockOutTypes.map((type) => (
                <option key={type} value={type}>
                  {movementTypeLabels[type]}
                </option>
              ))}
            </select>
          </Label>
          <Label className="flex-col items-stretch gap-1">
            Lokasyon
            <select name="lokasyonId" className={`${selectClassName} w-full font-normal`} required>
              {lokasyon.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
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
    </div>
  );
}
