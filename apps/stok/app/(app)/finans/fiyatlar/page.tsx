import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { loadActor } from "@/lib/guard";
import { displayQuantity } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { listPrices } from "@/lib/prices";
import { unitLabels } from "@/lib/quantity";
import { displayPrice } from "@/lib/stock-value";
import { PricesForm } from "./prices-form";

export const metadata = { title: "Fiyatlar | Artek" };

export default async function PricesPage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const { rows, prices } = await listPrices(requestHeaders);

  return (
    <PanelShell title="Fiyatlar" lede="Birim fiyatları buraya girin, ana sayfadaki stok değeri bunlardan hesaplanır. Dolar ve euro, günün TCMB kuruyla TL'ye çevrilir. Yalnızca Finans paneli izni olanlar görür.">
      <PricesForm
        readOnly={!can(actor, "finance.edit")}
        rows={rows.map((r) => {
          const price = prices.get(r.id);
          return {
            id: r.id,
            code: r.code,
            name: r.name,
            stock: `${displayQuantity(r.total)} ${unitLabels[r.unit]}`,
            purchasePrice: displayPrice(price?.purchasePrice ?? null),
            purchaseCurrency: price?.purchaseCurrency ?? "USD",
            salePrice: displayPrice(price?.salePrice ?? null),
            saleCurrency: price?.saleCurrency ?? "TRY",
          };
        })}
      />
    </PanelShell>
  );
}
