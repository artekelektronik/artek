import { z } from "zod";

// Public catalog contract (ADR-0002): visitor-safe fields only; strict, so an extra field fails loudly.
const publicProduct = z.strictObject({
  id: z.uuid(),
  // Pre-stok site number ("product-3" → 3) so old URLs and translations keep working.
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
