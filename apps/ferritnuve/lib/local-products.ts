/**
 * local-products.ts
 *
 * Reads from the generated lib/products.json (built by scripts/download-products.mjs)
 * and returns AirtableProduct records with local image paths pointing to
 * /public/products-images/*.
 *
 * Run `node scripts/download-products.mjs` to refresh the JSON + images.
 */

import fs from "fs";
import path from "path";
import type { AirtableProduct, AirtableAttachment, ProductFields } from "@/types/airtable";

const JSON_PATH = path.join(process.cwd(), "lib", "products.json");

// ─── Raw shape of a record in products.json ──────────────────────────────────

interface LocalProduct {
  id: string;
  name: string;
  productCode?: string;
  category?: string;
  productType?: string;
  subCategory?: string;
  description?: string;
  image?: string | null;
  pricing?: {
    unitPrice?: number;
    purchasePrice?: number;
    wholesalePrice?: number;
    retailPrice?: number;
    wholesaleBase?: number;
  };
  stock?: {
    total?: number;
    karakoy?: number;
    cekmekoy?: number;
  };
  supplier?: string;
  manufacturer?: string;
  supplierCountry?: string;
  totalStockValue?: number;
}

// ─── Convert to AirtableProduct format ───────────────────────────────────────

function toAirtableProduct(p: LocalProduct, index: number): AirtableProduct {
  const photoAttachments: AirtableAttachment[] = p.image
    ? [
        {
          id: `local-photo-${p.id}`,
          url: p.image,
          filename: path.basename(p.image),
          size: 0,
          type: p.image.endsWith(".png") ? "image/png" : "image/jpeg",
        },
      ]
    : [];

  const fields: ProductFields = {
    "Product Name": p.name,
    "Product Code": p.productCode,
    Category: p.category,
    "Ürün Tipi": p.productType ? [p.productType] : undefined,
    "Alt Kategori": p.subCategory ? [p.subCategory] : undefined,
    Description: p.description,
    Photo: photoAttachments.length ? photoAttachments : undefined,

    // Pricing
    "Unit Price": p.pricing?.unitPrice,
    "Alış Fiyatı": p.pricing?.purchasePrice,
    "Toptan Fiyatı": p.pricing?.wholesalePrice,
    "Parakende Fiyatı": p.pricing?.retailPrice,
    "Toptan Taban ": p.pricing?.wholesaleBase,

    // Stock
    "Stock Quantity": p.stock?.total,
    "Stock (Karakoy)": p.stock?.karakoy,
    "Stock (Cekmekoy)": p.stock?.cekmekoy,
    "Total Stock Value": p.totalStockValue,

    // Relations (stored as arrays to match Airtable API shape)
    Supplier: p.supplier ? [p.supplier] : undefined,
    Manufacturer: p.manufacturer ? [p.manufacturer] : undefined,
    "Supplier Country": p.supplierCountry ? [p.supplierCountry] : undefined,
  };

  return {
    id: "rec" + String(index + 1).padStart(14, "0"),
    fields,
    createdTime: new Date().toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cache: AirtableProduct[] | null = null;

export function getProductsFromJSON(): AirtableProduct[] {
  if (_cache) return _cache;

  if (!fs.existsSync(JSON_PATH)) {
    console.warn(
      "[local-products] products.json not found. Run: node scripts/download-products.mjs"
    );
    return [];
  }

  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const data: LocalProduct[] = JSON.parse(raw);

  _cache = data
    .filter((p) => !!p.name) // skip blank-name rows
    .map((p, i) => toAirtableProduct(p, i));

  return _cache;
}

export function getProductBySlug(slug: string) {
  const id = slug.split("-").at(-1);
  return getProductsFromJSON().find(product => product.id.slice(-6) === id);
}
