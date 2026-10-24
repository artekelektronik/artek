import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { loadActor } from "@/lib/guard";
import { getOverview } from "@/lib/overview";
import { can } from "@/lib/permissions";
import { listCategories, listProducts } from "@/lib/products";
import { ProductsTable, type ProductRow, type ProductStatus } from "./products-table";

export const metadata = { title: "Ürünler | Artek Stok" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ arsiv?: string }> }) {
  const { arsiv } = await searchParams;
  const archived = arsiv === "1";
  const requestHeaders = await headers();
  // Every product (or the archive) once, with its stock in the Lokasyon the user sees; the table
  // searches, filters, sorts and pages them.
  const [actor, products, categories, overview] = await Promise.all([
    loadActor(requestHeaders),
    listProducts(requestHeaders, { archived }),
    listCategories(requestHeaders),
    getOverview(requestHeaders, {}),
  ]);
  const stockOf = new Map(overview.rows.map((r) => [r.id, r]));
  // Kritik seviye compares the company total, so only users who see every Lokasyon get it.
  const comparesMinimum = overview.canFilterBelowMinimum;

  const rows: ProductRow[] = products.map((p) => {
    const stock = stockOf.get(p.id);
    const total = stock?.total ?? "0";
    const status: ProductStatus = archived
      ? "arsiv"
      : Number(total) <= 0
        ? "yok"
        : comparesMinimum && p.minLevel !== null && Number(total) < Number(p.minLevel)
          ? "kritik"
          : "stokta";
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      manufacturer: p.manufacturer,
      manufacturerCode: p.manufacturerCode,
      description: p.description,
      isTradeGoods: p.isTradeGoods,
      isMaterial: p.isMaterial,
      unit: p.unit,
      showOnSite: p.showOnSite,
      images: p.images,
      minLevel: p.minLevel,
      stock: overview.lokasyon.map((l) => ({
        lokasyonId: l.id,
        name: l.name,
        physical: stock?.stock[l.id]?.physical ?? "0",
        available: stock?.stock[l.id]?.available ?? "0",
      })),
      inTransit: stock?.inTransit ?? "0",
      total,
      status,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{archived ? "Arşivdeki ürünler" : "Ürünler"}</h1>
          <p className="text-muted-foreground text-sm">Stok durumu, görseller ve sitede gösterilenler tek yerde.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href={archived ? "/urunler" : "/urunler?arsiv=1"}>{archived ? "Aktif ürünler" : "Arşivdekiler"}</Link>
          </Button>
          {can(actor, "products.manage") && (
            <Button asChild>
              <Link href="/urunler/yeni">Yeni ürün</Link>
            </Button>
          )}
        </div>
      </div>
      <ProductsTable
        key={arsiv ?? "aktif"}
        rows={rows}
        categories={categories}
        canManage={can(actor, "products.manage")}
        comparesMinimum={comparesMinimum}
        archived={archived}
      />
    </div>
  );
}
