import { headers } from "next/headers";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { NoAccess } from "@/components/no-access";
import { ProductLines } from "@/components/product-lines";
import { QuickAddProduct } from "@/components/quick-add-product";
import { FormSelect } from "@/components/form-select";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { listCategories } from "@/lib/products";
import { recordReceiptAction } from "./actions";

export const metadata = { title: "Mal kabul | Artek" };

export default async function ReceiptPage() {
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const canAddProduct = can(actor, "products.manage");
  const [lokasyon, products, categories] = await Promise.all([
    lokasyonFor(actor, "stock.receive"),
    activeProducts(),
    canAddProduct ? listCategories(requestHeaders) : [],
  ]);
  if (lokasyon.length === 0) return <NoAccess />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mal kabul</h1>
      {canAddProduct && <QuickAddProduct categories={categories} />}
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
        <ProductLines products={products} />
      </StockForm>
    </div>
  );
}
