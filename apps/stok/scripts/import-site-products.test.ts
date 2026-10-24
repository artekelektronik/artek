import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, skipWithoutDatabase } from "../lib/test-database";

const siteJson = path.join(__dirname, "../../ferritnuve/lib/products.json");

describe("site product import", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let importSiteProducts: typeof import("./import-site-products").importSiteProducts;
  const records = JSON.parse(readFileSync(siteJson, "utf8")) as { id: string; name: string; productCode?: string; supplier?: string; supplierCountry?: string; description?: string; image?: string }[];

  before(async () => {
    db = await openTestDatabase();
    await resetTestDatabase();
    schema = await import("../db/schema");
    ({ importSiteProducts } = await import("./import-site-products"));
  });
  after(() => db.$client.end());

  test("every product in the JSON appears with its public details", async () => {
    assert.deepEqual(await importSiteProducts(records), { created: 92, alreadyImported: 0 });

    const rows = await db.select().from(schema.product);
    assert.equal(rows.length, 92);
    for (const record of records) {
      const row = rows.find((r) => r.importKey === record.id);
      assert.ok(row, record.id);
      assert.equal(row.name, record.name);
      assert.equal(row.manufacturerCode, record.productCode?.trim() || null);
      assert.equal(row.supplier, record.supplier ?? null);
      assert.equal(row.supplierCountry, record.supplierCountry ?? null);
      assert.equal(row.description, record.description || null);
      assert.deepEqual(row.images, record.image ? [record.image] : []);
      assert.equal(row.isTradeGoods, true);
      assert.equal(row.showOnSite, true);
    }
    assert.equal(rows.find((r) => r.importKey === "product-3")?.code, "ART-0003");
  });

  test("running it again creates nothing and keeps later edits", async () => {
    const { eq } = await import("drizzle-orm");
    await db.update(schema.product).set({ name: "Elle düzeltilmiş ad" }).where(eq(schema.product.importKey, "product-3"));

    assert.deepEqual(await importSiteProducts(records), { created: 0, alreadyImported: 92 });
    assert.equal((await db.select().from(schema.product)).length, 92);
    const edited = await db.query.product.findFirst({ where: eq(schema.product.importKey, "product-3") });
    assert.equal(edited?.name, "Elle düzeltilmiş ad");
  });

  test("quantities and prices are not imported", async () => {
    const columns = Object.keys(schema.product);
    for (const field of ["stock", "quantity", "price", "unitPrice"]) assert.equal(columns.includes(field), false, field);
  });
});
