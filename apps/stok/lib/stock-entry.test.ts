import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("stok girişi: one sheet across Lokasyon", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let entry: typeof import("./stock-entry");
  let products: typeof import("./products");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  const key = () => crypto.randomUUID();
  const cell = async (lokasyonId: string, productId = core) =>
    (await entry.getStockEntrySheet(muhendis.headers)).rows.find((r) => r.id === productId)!.cells[lokasyonId];

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    entry = await import("./stock-entry");
    products = await import("./products");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    const { inArray } = await import("drizzle-orm");
    await db
      .update(schema.lokasyon)
      .set({ openedAt: null })
      .where(inArray(schema.lokasyon.id, [lokasyon["Çekmeköy İmalathane"], lokasyon.Yedek]));
    muhendis = await signedInAs(["muhendis"]);
    [{ id: core }] = await db
      .insert(schema.product)
      .values({ code: "T-1", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: true, unit: "adet", showOnSite: false })
      .returning({ id: schema.product.id });
  });
  after(() => db.$client.end());

  test("the same product is entered per Lokasyon, and approval opens each one with its own quantity", async () => {
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId: lokasyon["Çekmeköy İmalathane"], counted: "40" });
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId: lokasyon.Yedek, counted: "10" });
    assert.equal((await cell(lokasyon.Yedek)).entered, "10");
    assert.equal((await cell(lokasyon.Yedek)).current, "0");

    await entry.approveStockEntries(muhendis.headers, lokasyon["Çekmeköy İmalathane"], { idempotencyKey: key() });
    await entry.approveStockEntries(muhendis.headers, lokasyon.Yedek, { idempotencyKey: key() });

    assert.equal((await cell(lokasyon["Çekmeköy İmalathane"])).current, "40");
    assert.equal((await cell(lokasyon.Yedek)).current, "10");
    const sheet = await entry.getStockEntrySheet(muhendis.headers);
    assert.ok(sheet.lokasyon.every((l) => l.opened));
  });

  test("each row carries what identifies the product at a glance: image and Üretici kodu", async () => {
    const { eq } = await import("drizzle-orm");
    await db.update(schema.product).set({ images: ["urunler/ee-25.jpg", "urunler/ee-25-b.jpg"], manufacturerCode: "EE25/13/7" }).where(eq(schema.product.id, core));
    const row = (await entry.getStockEntrySheet(muhendis.headers)).rows.find((r) => r.id === core)!;
    assert.deepEqual(row.images, ["urunler/ee-25.jpg", "urunler/ee-25-b.jpg"]);
    assert.equal(row.manufacturerCode, "EE25/13/7");
  });

  test("an entry can be changed or taken back before approval", async () => {
    const lokasyonId = lokasyon["Çekmeköy İmalathane"];
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "40" });
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "45" });
    assert.equal((await cell(lokasyonId)).entered, "45");
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "" });
    assert.equal((await cell(lokasyonId)).entered, null);
    await assert.rejects(entry.approveStockEntries(muhendis.headers, lokasyonId, { idempotencyKey: key() }), /Onaylanacak giriş yok/);
  });

  test("after opening, what is typed adds to the balance and shows in the movements", async () => {
    const lokasyonId = lokasyon.Yedek;
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "10" });
    await entry.approveStockEntries(muhendis.headers, lokasyonId, { idempotencyKey: key() });

    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "7" });
    assert.equal((await cell(lokasyonId)).current, "10");
    await entry.approveStockEntries(muhendis.headers, lokasyonId, { idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "17");

    const { listMovements } = await import("./ledger");
    const moves = await listMovements(muhendis.headers, { productId: core });
    assert.deepEqual(moves.map((m) => m.reason).sort(), ["Açılış sayımı", "Sayılıp eklendi"]);
  });

  test("a product added after entering began can still be entered", async () => {
    const lokasyonId = lokasyon["Çekmeköy İmalathane"];
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "1" });
    const added = await products.quickAddProduct(muhendis.headers, { name: "Bakır tel", category: "Malzeme", unit: "kg", isMaterial: true, isTradeGoods: false });
    await entry.saveStockEntry(muhendis.headers, { productId: added.id, lokasyonId, counted: "12,5" });
    assert.equal((await cell(lokasyonId, added.id)).entered, "12.5");
  });

  test("a product added here gets a code of its own and stays off the site", async () => {
    await db.insert(schema.product).values({ code: "ART-0041", name: "Var olan", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true });
    const added = await products.quickAddProduct(muhendis.headers, { name: "Vernik", category: "Malzeme", unit: "kg", isMaterial: true, isTradeGoods: false });
    assert.equal(added.code, "ART-0042");
    assert.equal(added.showOnSite, false);
  });

  test("only those who manage products can add one this way", async () => {
    const depo = await signedInAs(["depo_sorumlusu"], [lokasyon["Çekmeköy İmalathane"]]);
    await assert.rejects(products.quickAddProduct(depo.headers, { name: "Vernik", category: "Malzeme", unit: "kg", isMaterial: true, isTradeGoods: false }));
  });

  test("an admin sets a wrong balance to the right number at once, in either direction, and it stays on record", async () => {
    const admin = await signedInAs(["admin"]);
    const lokasyonId = lokasyon["Karaköy Mağaza"];
    await entry.saveStockEntry(admin.headers, { productId: core, lokasyonId, counted: "50" });
    await entry.approveStockEntries(admin.headers, lokasyonId, { idempotencyKey: key() });

    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "5", idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "5");
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "8", idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "8");
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "0", idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "0");

    const { listMovements } = await import("./ledger");
    const edits = (await listMovements(admin.headers, { productId: core })).filter((m) => m.reason === "Stok düzenleme");
    assert.equal(edits.length, 3);
    assert.ok(edits.every((m) => m.userName === admin.user.name));
  });

  test("the same number changes nothing, and a double submit records once", async () => {
    const admin = await signedInAs(["admin"]);
    const lokasyonId = lokasyon["Karaköy Mağaza"];
    await entry.saveStockEntry(admin.headers, { productId: core, lokasyonId, counted: "50" });
    await entry.approveStockEntries(admin.headers, lokasyonId, { idempotencyKey: key() });
    const repeated = key();
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "40", idempotencyKey: repeated });
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "40", idempotencyKey: repeated });
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "40", idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "40");
    const { listMovements } = await import("./ledger");
    assert.equal((await listMovements(admin.headers, { productId: core })).filter((m) => m.reason === "Stok düzenleme").length, 1);
  });

  test("an entry waiting for approval still adds on top of a correction", async () => {
    const admin = await signedInAs(["admin"]);
    const lokasyonId = lokasyon["Karaköy Mağaza"];
    await entry.saveStockEntry(admin.headers, { productId: core, lokasyonId, counted: "50" });
    await entry.approveStockEntries(admin.headers, lokasyonId, { idempotencyKey: key() });
    await entry.saveStockEntry(admin.headers, { productId: core, lokasyonId, counted: "45" });
    await entry.correctStock(admin.headers, { productId: core, lokasyonId, quantity: "30", idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "30");
    await entry.approveStockEntries(admin.headers, lokasyonId, { idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "75");
  });

  test("a Sayım opened from the Sayım screen still replaces the balance", async () => {
    const lokasyonId = lokasyon["Karaköy Mağaza"];
    await entry.saveStockEntry(muhendis.headers, { productId: core, lokasyonId, counted: "50" });
    await entry.approveStockEntries(muhendis.headers, lokasyonId, { idempotencyKey: key() });
    const counts = await import("./counts");
    const { countId } = await counts.openCount(muhendis.headers, { lokasyonId, kind: "sayim" });
    await counts.recordCountLines(muhendis.headers, countId, [{ productId: core, counted: "48" }]);
    await counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() });
    assert.equal((await cell(lokasyonId)).current, "48");
  });

  test("only an admin can correct; a mühendis and a sorumlu cannot", async () => {
    const lokasyonId = lokasyon["Karaköy Mağaza"];
    const karakoy = await signedInAs(["magaza_sorumlusu"], [lokasyonId]);
    for (const who of [muhendis, karakoy]) {
      await assert.rejects(entry.correctStock(who.headers, { productId: core, lokasyonId, quantity: "1", idempotencyKey: key() }));
    }
  });

  test("a Lokasyon sorumlusu sees and enters only their own column, and cannot approve", async () => {
    const karakoy = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    const sheet = await entry.getStockEntrySheet(karakoy.headers);
    assert.deepEqual(sheet.lokasyon.map((l) => l.name), ["Karaköy Mağaza"]);
    await assert.rejects(entry.saveStockEntry(karakoy.headers, { productId: core, lokasyonId: lokasyon.Yedek, counted: "1" }));
    await entry.saveStockEntry(karakoy.headers, { productId: core, lokasyonId: lokasyon["Karaköy Mağaza"], counted: "3" });
    await assert.rejects(entry.approveStockEntries(karakoy.headers, lokasyon["Karaköy Mağaza"], { idempotencyKey: key() }));
  });
});
