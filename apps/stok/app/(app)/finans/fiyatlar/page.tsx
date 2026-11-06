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
  const { rows, prices, lokasyon } = await listPrices(requestHeaders);

  return (
    <PanelShell title="Fiyatlar" lede="Alış fiyatını ve üç müşteri sınıfı için satış fiyatını girip Kaydet'e basın. Para birimi hazır USD seçili gelir. Ana sayfadaki stok değeri alış ve B fiyatından, günün TCMB kuruyla hesaplanır. Yalnızca Finans paneli izni olanlar görür.">
      <PricesForm
        readOnly={!can(actor, "finance.edit")}
        canEditProducts={can(actor, "products.manage")}
        lokasyon={lokasyon}
        rows={rows.map((r) => {
          const price = prices.get(r.id);
          const places = lokasyon.filter((l) => Number(r.stock[l.id].physical) > 0).map((l) => `${l.name.split(" ")[0]} ${displayQuantity(r.stock[l.id].physical)}`);
          if (Number(r.inTransit) > 0) places.push(`Yolda ${displayQuantity(r.inTransit)}`);
          return {
            id: r.id,
            code: r.code,
            name: r.name,
            category: r.category,
            productType: r.productType,
            image: r.images[0] ?? null,
            details: [r.manufacturerCode, r.code].filter(Boolean).join(" · "),
            search: `${r.code} ${r.name} ${r.manufacturerCode ?? ""}`.toLocaleLowerCase("tr"),
            stock: `${displayQuantity(r.total)} ${unitLabels[r.unit]}`,
            total: Number(r.total),
            quantities: Object.fromEntries(lokasyon.map((l) => [l.id, Number(r.stock[l.id].physical)])),
            physical: Object.fromEntries(lokasyon.map((l) => [l.id, r.stock[l.id].physical])),
            where: places.join(" · ") || "—",
            hasPurchase: Boolean(price?.purchasePrice),
            hasSale: Boolean(price?.salePriceA && price.salePrice && price.salePriceC),
            purchasePrice: displayPrice(price?.purchasePrice ?? null),
            purchaseCurrency: price?.purchaseCurrency ?? "USD",
            salePriceA: displayPrice(price?.salePriceA ?? null),
            salePrice: displayPrice(price?.salePrice ?? null),
            salePriceC: displayPrice(price?.salePriceC ?? null),
            saleCurrency: price?.saleCurrency ?? "USD",
          };
        })}
      />
    </PanelShell>
  );
}
