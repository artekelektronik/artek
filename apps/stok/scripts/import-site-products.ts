// One-time: imports the site's product JSON as the starting catalog. Safe to run again:
// records already imported are skipped, so later edits in the stok app are kept.
// Usage: pnpm --filter stok import-products [path/to/site-products.json]
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../db";
import { product } from "../db/schema";

type SiteRecord = {
  id: string; // "product-3"
  name: string;
  productCode?: string; // the manufacturer's or series code; several sizes can share it
  category?: string;
  productType?: string;
  subCategory?: string;
  manufacturer?: string;
  supplier?: string;
  supplierCountry?: string;
  description?: string;
  image?: string | null;
  // Stock and prices in the JSON are deliberately ignored: stock starts from the Açılış sayımı.
};

// Our own unique code, derived from the record's stable id so re-runs produce the same code.
function codeFor(record: SiteRecord) {
  return `ART-${record.id.replace(/\D/g, "").padStart(4, "0")}`;
}

export async function importSiteProducts(records: SiteRecord[]) {
  const rows = records.map((record) => ({
    importKey: record.id,
    code: codeFor(record),
    name: record.name,
    category: record.category ?? "Diğer",
    isTradeGoods: true,
    isMaterial: false,
    unit: "adet" as const,
    showOnSite: true,
    productType: record.productType ?? null,
    subCategory: record.subCategory ?? null,
    manufacturer: record.manufacturer ?? null,
    manufacturerCode: record.productCode?.trim() || null,
    supplier: record.supplier ?? null,
    supplierCountry: record.supplierCountry ?? null,
    description: record.description || null,
    images: record.image ? [record.image] : [],
  }));
  const inserted = await db
    .insert(product)
    .values(rows)
    .onConflictDoNothing({ target: product.importKey })
    .returning({ id: product.id });
  return { created: inserted.length, alreadyImported: rows.length - inserted.length };
}

async function main() {
  const file = process.argv[2] ?? path.join(__dirname, "site-products.json");
  const result = await importSiteProducts(JSON.parse(readFileSync(file, "utf8")));
  console.log(`Ürün aktarımı: ${result.created} yeni, ${result.alreadyImported} zaten vardı.`);
  await db.$client.end();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$client.end();
    process.exit(1);
  });
}
