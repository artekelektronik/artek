import { catalogResponse, type CatalogResponse } from "@artek/catalog";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { product } from "../db/schema";

// Products shown on the site, whatever their stock; public columns only, and the strict parse rejects extras.
export async function getPublicCatalog(): Promise<CatalogResponse> {
  const rows = await db
    .select({
      id: product.id,
      importKey: product.importKey,
      name: product.name,
      category: product.category,
      productType: product.productType,
      subCategory: product.subCategory,
      manufacturer: product.manufacturer,
      manufacturerCode: product.manufacturerCode,
      supplierCountry: product.supplierCountry,
      description: product.description,
      images: product.images,
    })
    .from(product)
    .where(and(eq(product.showOnSite, true), isNull(product.archivedAt)))
    .orderBy(asc(product.name), asc(product.id));

  return catalogResponse.parse({
    products: rows.map(({ importKey, ...row }) => ({ ...row, legacyId: legacyIdFor(importKey) })),
  });
}

// "product-3" → 3, from the one-time site import.
function legacyIdFor(importKey: string | null) {
  const match = importKey?.match(/^product-(\d+)$/);
  return match ? Number(match[1]) : null;
}
