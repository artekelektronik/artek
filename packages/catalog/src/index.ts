import { z } from "zod";

// The public catalog contract between the stok app and every Vitrin (ADR-0002).
// Only details a visitor may see: never quantities, stock codes, Raf kodu, prices or availability.
// Strict objects, so a field added on one side fails loudly instead of leaking.
export const publicProduct = z.strictObject({
  id: z.uuid(),
  // The product's number on the site before the stok app existed ("product-3" → 3), so its
  // URLs and translations keep working. New products have none.
  legacyId: z.number().int().positive().nullable(),
  name: z.string(),
  category: z.string(),
  productType: z.string().nullable(),
  subCategory: z.string().nullable(),
  manufacturer: z.string().nullable(), // the brand
  manufacturerCode: z.string().nullable(), // Üretici kodu, shown as the product code
  supplierCountry: z.string().nullable(),
  description: z.string().nullable(),
  images: z.array(z.string()),
});

export const catalogResponse = z.strictObject({
  products: z.array(publicProduct),
});

export type PublicProduct = z.infer<typeof publicProduct>;
export type CatalogResponse = z.infer<typeof catalogResponse>;
