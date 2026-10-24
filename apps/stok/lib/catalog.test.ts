import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, skipWithoutDatabase } from "./test-database";

describe("public catalog", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let catalog: typeof import("./catalog");
  let schema: typeof import("../db/schema");

  const base = {
    category: "Ferrit",
    isTradeGoods: true,
    isMaterial: false,
    unit: "adet" as const,
    showOnSite: true,
  };

  before(async () => {
    db = await openTestDatabase();
    await resetTestDatabase();
    catalog = await import("./catalog");
    schema = await import("../db/schema");
  });
  after(() => db.$client.end());

  test("returns exactly the public details of products shown on the site", async () => {
    const [imported] = await db
      .insert(schema.product)
      .values({
        ...base,
        code: "ART-0007",
        name: "EE 25 Ferrit Nüve",
        importKey: "product-7",
        productType: "Nüve",
        subCategory: "EE",
        manufacturer: "TDK",
        manufacturerCode: "B66317",
        supplier: "Gizli Tedarikçi",
        supplierCountry: "Almanya",
        description: "EE 25/13/7",
        images: ["/products-images/ee25.png"],
        minLevel: "10",
      })
      .returning();
    const [lokasyon] = await db.select().from(schema.lokasyon).limit(1);
    await db.insert(schema.stock).values({ productId: imported.id, lokasyonId: lokasyon.id, physical: "12" });
    await db.insert(schema.productShelf).values({ productId: imported.id, lokasyonId: lokasyon.id, rafKodu: "A-3" });

    const { products } = await catalog.getPublicCatalog();

    assert.deepEqual(products, [
      {
        id: imported.id,
        legacyId: 7,
        name: "EE 25 Ferrit Nüve",
        category: "Ferrit",
        productType: "Nüve",
        subCategory: "EE",
        manufacturer: "TDK",
        manufacturerCode: "B66317",
        supplierCountry: "Almanya",
        description: "EE 25/13/7",
        images: ["/products-images/ee25.png"],
      },
    ]);
    const json = JSON.stringify(products);
    for (const secret of ["ART-0007", "A-3", "Gizli Tedarikçi", "physical", "minLevel"]) {
      assert.equal(json.includes(secret), false, secret);
    }
  });

  test("hidden and archived products are left out; products with no stock and no import still show", async () => {
    await db.insert(schema.product).values([
      { ...base, code: "ART-H1", name: "Gizli ürün", showOnSite: false },
      { ...base, code: "ART-A1", name: "Arşiv ürünü", archivedAt: new Date() },
      { ...base, code: "ART-N1", name: "Yeni ürün" },
    ]);

    const names = (await catalog.getPublicCatalog()).products.map((p) => [p.name, p.legacyId]);

    assert.deepEqual(names, [
      ["EE 25 Ferrit Nüve", 7],
      ["Yeni ürün", null],
    ]);
  });
});
