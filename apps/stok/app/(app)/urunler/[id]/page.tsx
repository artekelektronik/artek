import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { loadActor } from "@/lib/guard";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { getProduct, listCategories } from "@/lib/products";
import { archiveProductAction, restoreProductAction, updateProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const [actor, product, lokasyon, categories] = await Promise.all([
    loadActor(requestHeaders),
    getProduct(requestHeaders, id),
    listLokasyon(),
    listCategories(requestHeaders),
  ]);
  if (!product) notFound();
  const canManage = can(actor, "products.manage");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <span className="text-muted-foreground font-mono">{product.code}</span>
        {product.archivedAt && <Badge variant="outline">Arşivde</Badge>}
      </div>

      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        product={product}
        lokasyon={lokasyon}
        categories={categories}
        readOnly={!canManage}
        submitLabel="Kaydet"
      />

      {canManage && (
        <form action={(product.archivedAt ? restoreProductAction : archiveProductAction).bind(null, product.id)}>
          <Button type="submit" variant="outline">
            {product.archivedAt ? "Arşivden çıkar" : "Arşivle"}
          </Button>
        </form>
      )}
    </div>
  );
}
