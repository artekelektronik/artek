import { headers } from "next/headers";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { ProductLines } from "@/components/product-lines";
import { FormSelect } from "@/components/form-select";
import { StockForm } from "@/components/stock-form";
import { loadActor } from "@/lib/guard";
import { listLokasyon } from "@/lib/lokasyon";
import { activeProducts, lokasyonFor } from "@/lib/pickers";
import { listTransfers } from "@/lib/transfers";
import { sendTransferAction } from "./actions";
import { TransfersTable } from "./transfers-table";

export const metadata = { title: "Transfer | Artek" };

export default async function TransfersPage() {
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  const [sources, targets, products, transfers] = await Promise.all([
    lokasyonFor(actor, "stock.transfer"),
    listLokasyon(),
    activeProducts(),
    listTransfers(requestHeaders),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transfer</h1>

      {sources.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Yeni sevk</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Sevk edilen miktar kaynaktan hemen düşer ve teslim alınana kadar yolda görünür; iki Lokasyonda da sayılmaz.
          </p>
          <StockForm action={sendTransferAction} submitLabel="Sevk et" savedMessage="Sevk kaydedildi; ürünler yolda.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Label className="flex-col items-stretch gap-1">
                Kaynak
                <FormSelect name="fromLokasyonId" options={sources.map((l) => ({ value: l.id, label: l.name }))} className="w-full" />
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Hedef
                <FormSelect
                  name="toLokasyonId"
                  options={targets.map((l) => ({ value: l.id, label: l.name }))}
                  defaultValue={targets.find((t) => t.id !== sources[0].id)?.id}
                  className="w-full"
                />
              </Label>
              <Label className="flex-col items-stretch gap-1">
                Not (isteğe bağlı)
                <Input name="note" className="font-normal" />
              </Label>
            </div>
            <ProductLines products={products} />
          </StockForm>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Transferler</h2>
        <TransfersTable transfers={transfers} />
      </section>
    </div>
  );
}
