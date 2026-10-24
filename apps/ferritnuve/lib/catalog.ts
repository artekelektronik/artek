/**
 * catalog.ts
 *
 * The Vitrin's products come from the stok app's public catalog API (ADR-0002).
 * The site holds no database credentials; responses are cached, so a short stok
 * outage keeps serving the last catalog.
 *
 * Products are adapted to the AirtableProduct shape the pages already use.
 */

import { catalogResponse, type PublicProduct } from "@artek/catalog";
import type { AirtableProduct } from "../types/airtable";

const CATALOG_URL = process.env.CATALOG_URL || "https://stok.ferritnuve.com/api/catalog";

export async function getProducts(): Promise<AirtableProduct[]> {
  const response = await fetch(CATALOG_URL, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  return toSiteProducts(catalogResponse.parse(await response.json()).products);
}

export async function getProductBySlug(slug: string) {
  return findProductBySlug(await getProducts(), slug);
}

export function findProductBySlug(products: AirtableProduct[], slug: string) {
  const id = slug.split("-").at(-1);
  return products.find(product => product.id.slice(-6) === id);
}

// Imported products keep their old record id ("rec" + number), so their URLs and
// translations don't change; products created in the stok app use their own id.
export function toSiteProducts(products: PublicProduct[]): AirtableProduct[] {
  return [...products]
    .sort((a, b) => (a.legacyId ?? Infinity) - (b.legacyId ?? Infinity))
    .map(toSiteProduct);
}

function toSiteProduct(p: PublicProduct): AirtableProduct {
  const id = p.legacyId ? "rec" + String(p.legacyId).padStart(14, "0") : "rec" + p.id.replace(/-/g, "");
  return {
    id,
    fields: {
      "Product Name": p.name,
      "Product Code": p.manufacturerCode ?? undefined,
      Category: p.category,
      "Ürün Tipi": p.productType ? [p.productType] : undefined,
      "Alt Kategori": p.subCategory ? [p.subCategory] : undefined,
      Description: p.description ?? undefined,
      Photo: p.images.length
        ? p.images.map((url, i) => ({
            id: `${id}-photo-${i}`,
            url,
            filename: url.split("/").at(-1) ?? url,
            size: 0,
            type: url.endsWith(".png") ? "image/png" : "image/jpeg",
          }))
        : undefined,
      Manufacturer: p.manufacturer ? [p.manufacturer] : undefined,
      "Supplier Country": p.supplierCountry ? [p.supplierCountry] : undefined,
    },
    createdTime: "",
  };
}
