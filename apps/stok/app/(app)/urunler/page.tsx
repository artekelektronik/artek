import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { listCategories, listProducts } from "@/lib/products";
import { ProductsTable } from "./products-table";

export const metadata = { title: "Ürünler | Artek Stok" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ arsiv?: string }> }) {
  const { arsiv } = await searchParams;
  const requestHeaders = await headers();
  // Every product (or the archive) once; the table searches, filters, sorts and pages them.
  const [actor, rows, categories] = await Promise.all([
    loadActor(requestHeaders),
    listProducts(requestHeaders, { archived: arsiv === "1" }),
    listCategories(requestHeaders),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{arsiv === "1" ? "Arşivdeki ürünler" : "Ürünler"}</h1>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href={arsiv === "1" ? "/urunler" : "/urunler?arsiv=1"}>{arsiv === "1" ? "Aktif ürünler" : "Arşivdekiler"}</Link>
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
        categories={categories}
        rows={rows.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          manufacturerCode: p.manufacturerCode,
          isTradeGoods: p.isTradeGoods,
          isMaterial: p.isMaterial,
          unit: p.unit,
          showOnSite: p.showOnSite,
          image: p.images[0] ?? null,
        }))}
      />
    </div>
  );
}
