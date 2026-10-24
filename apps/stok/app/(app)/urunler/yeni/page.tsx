import { headers } from "next/headers";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { listCategories } from "@/lib/products";
import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";

export const metadata = { title: "Yeni ürün | Artek Stok" };

export default async function NewProductPage() {
  const requestHeaders = await headers();
  // UX only; createProduct enforces the permission.
  if (!can(await loadActor(requestHeaders), "products.manage")) return <NoAccess />;
  const [lokasyon, categories] = await Promise.all([listLokasyon(), listCategories(requestHeaders)]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Yeni ürün</h1>
      <ProductForm action={createProductAction} lokasyon={lokasyon} categories={categories} submitLabel="Ürünü oluştur" />
    </div>
  );
}
