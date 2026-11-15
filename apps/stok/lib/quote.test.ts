import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("Fiyat çalışması and the trafo's usual materials", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let quotes: typeof import("./quote");
  let admin: Awaited<ReturnType<typeof signedInAs>>;
  let trafo: string;
  let wire: string;

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    quotes = await import("./quote");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    admin = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: admin.user.id, panel: "finans", level: "duzenler" });
    const rows = await db
      .insert(schema.product)
      .values([
        { code: "T-TRAFO", name: "Trafo", category: "Özel trafo", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: false },
        { code: "T-TEL", name: "Bakır tel", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
      ])
      .returning();
    [trafo, wire] = rows.map((r) => r.id);
  });

  const study = { id: null, title: "EF 20, 12 V", customer: "Yıldız", productId: null, quantity: "300", materials: [] as { productId: string; quantity: string }[], laborMinutes: "4", profitPct: "40", unitPrice: "", note: "" };

  test("a çalışma is saved, changed in place, copied and deleted", async () => {
    const id = await quotes.saveQuote(admin.headers, { ...study, productId: trafo, materials: [{ productId: wire, quantity: "0,015" }] });
    await quotes.saveQuote(admin.headers, { ...study, id, title: "EF 20, 24 V", profitPct: "", unitPrice: "90,2" });
    const copy = await quotes.saveQuote(admin.headers, { ...study, title: "EF 20, 24 V (kopya)" });
    assert.notEqual(copy, id);

    const { quotes: saved } = await quotes.quoteOptions(admin.headers);
    assert.equal(saved.length, 2);
    const changed = saved.find((q) => q.id === id)!;
    assert.deepEqual([changed.title, changed.profitPct, changed.unitPrice, changed.quantity], ["EF 20, 24 V", null, "90,2", "300"], "the typed price replaced the kâr");

    await quotes.deleteQuote(admin.headers, id);
    assert.deepEqual((await quotes.quoteOptions(admin.headers)).quotes.map((q) => q.id), [copy]);
    await assert.rejects(quotes.saveQuote(admin.headers, { ...study, title: "" }), /ad verin/);
  });

  test("only someone who may edit Finans saves a çalışma", async () => {
    const viewer = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: viewer.user.id, panel: "finans", level: "gorur" });
    await assert.rejects(quotes.saveQuote(viewer.headers, study));
    await assert.rejects(quotes.saveHourlyRate(viewer.headers, "300"));
  });

  test("the Saat ücreti and a trafo's usual materials and minutes are what the next job starts from", async () => {
    await quotes.saveHourlyRate(admin.headers, "300");
    await quotes.saveStandard(admin.headers, { productId: trafo, materials: [{ productId: wire, quantity: "0,015" }], laborMinutes: "4" });
    const options = await quotes.quoteOptions(admin.headers);
    assert.equal(options.hourlyRate, 300);
    assert.deepEqual(options.recipes[trafo], [{ productId: wire, quantity: "0,015" }]);
    assert.equal(Number(options.labor[trafo].minutes), 4);
    await assert.rejects(quotes.saveHourlyRate(admin.headers, "0"), /sıfırdan büyük/);
  });
});
