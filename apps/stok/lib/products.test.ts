import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("products", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let products: typeof import("./products");
  let guard: typeof import("./guard");
  let muhendis: Headers;
  let depoSorumlusu: Headers;

  const ferrit = {
    code: "ART-T001",
    name: "EE 25 Ferrit Nüve",
    category: "Ferrit",
    isTradeGoods: true,
    isMaterial: true,
    unit: "takim" as const,
    showOnSite: true,
  };

  before(async () => {
    db = await openTestDatabase();
    await resetTestDatabase();
    products = await import("./products");
    guard = await import("./guard");
    muhendis = (await signedInAs(["muhendis"])).headers;
    depoSorumlusu = (await signedInAs(["depo_sorumlusu"])).headers;
  });
  after(() => db.$client.end());

  test("mühendis creates, edits and archives a product", async () => {
    const created = await products.createProduct(muhendis, ferrit);
    await products.updateProduct(muhendis, created.id, { ...ferrit, name: "EE 25/13/7 Ferrit Nüve" });
    await products.archiveProduct(muhendis, created.id);

    const saved = await products.getProduct(muhendis, created.id);
    assert.equal(saved?.name, "EE 25/13/7 Ferrit Nüve");
    assert.ok(saved?.archivedAt);
    const active = await products.listProducts(muhendis, {});
    assert.equal(active.some((p) => p.id === created.id), false);
    const archived = await products.listProducts(muhendis, { archived: true });
    assert.equal(archived.some((p) => p.id === created.id), true);
  });

  test("other roles can view products but not change them", async () => {
    const created = await products.createProduct(muhendis, { ...ferrit, code: "ART-T002" });
    assert.equal((await products.getProduct(depoSorumlusu, created.id))?.code, "ART-T002");
    await assert.rejects(products.createProduct(depoSorumlusu, { ...ferrit, code: "ART-T003" }), guard.Forbidden);
    await assert.rejects(products.updateProduct(depoSorumlusu, created.id, ferrit), guard.Forbidden);
    await assert.rejects(products.archiveProduct(depoSorumlusu, created.id), guard.Forbidden);
  });

  test("product codes are unique", async () => {
    await products.createProduct(muhendis, { ...ferrit, code: "ART-T004" });
    await assert.rejects(products.createProduct(muhendis, { ...ferrit, code: "ART-T004" }), /ürün kodu zaten/);
  });

  test("a product is Ticari mal, Malzeme or both", async () => {
    await assert.rejects(
      products.createProduct(muhendis, { ...ferrit, code: "ART-T005", isTradeGoods: false, isMaterial: false }),
      /Ticari mal veya Malzeme/,
    );
  });

  test("Raf kodu is kept per Lokasyon", async () => {
    const { lokasyonIdsByName } = await import("./test-database");
    const lokasyon = await lokasyonIdsByName();
    const created = await products.createProduct(muhendis, {
      ...ferrit,
      code: "ART-T006",
      shelves: { [lokasyon["Karaköy Mağaza"]]: "A-03" },
    });
    const saved = await products.getProduct(muhendis, created.id);
    assert.deepEqual(saved?.shelves, { [lokasyon["Karaköy Mağaza"]]: "A-03" });
  });
});
