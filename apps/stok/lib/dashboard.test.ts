import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("dashboard", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let dashboard: typeof import("./dashboard");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  const key = () => crypto.randomUUID();

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    dashboard = await import("./dashboard");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    muhendis = await signedInAs(["muhendis"]);
    const base = { category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet" as const, showOnSite: true };
    const [core, copper] = await db
      .insert(schema.product)
      .values([
        { ...base, code: "T-CORE", name: "EE 25 çekirdek", minLevel: "200" },
        { ...base, code: "T-CU", name: "Bakır tel" },
        { ...base, code: "T-OLD", name: "Eski ürün", archivedAt: new Date() },
      ])
      .returning();
    const { recordReceipt } = await import("./receipts");
    for (const [name, productId, quantity] of [
      ["Karaköy Mağaza", core.id, "40"],
      ["Çekmeköy İmalathane", core.id, "100"],
      ["Çekmeköy İmalathane", copper.id, "12"],
    ] as const) {
      await recordReceipt(muhendis.headers, {
        lokasyonId: lokasyon[name],
        supplier: "TDK",
        reference: "İrsaliye",
        lines: [{ productId, quantity }],
        idempotencyKey: key(),
      });
    }
    const { sendTransfer } = await import("./transfers");
    await sendTransfer(muhendis.headers, {
      fromLokasyonId: lokasyon["Çekmeköy İmalathane"],
      toLokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [{ productId: core.id, quantity: "10" }],
      idempotencyKey: key(),
    });
    const { openCount } = await import("./counts");
    await openCount(muhendis.headers, { lokasyonId: lokasyon["Çekmeköy İmalathane"], kind: "sayim" });
  });
  after(() => db.$client.end());

  test("a user who sees every Lokasyon gets every count and the products below Kritik seviye", async () => {
    const d = await dashboard.getDashboard(muhendis.headers);

    assert.deepEqual(
      d.lokasyon.map((l) => [l.name, Boolean(l.openedAt)]),
      [
        ["Çekmeköy İmalathane", true],
        ["Karaköy Mağaza", true],
        ["Yedek", true],
      ],
    );
    assert.equal(d.transfersOnTheWay, 1);
    assert.equal(d.openCounts, 1);
    assert.deepEqual(
      d.belowMinimum?.map((p) => [p.code, p.total, p.minLevel]),
      [["T-CORE", "140", "200"]],
    );
    assert.equal(d.noMinimumCount, 1, "T-CU; archived products don't count");
    assert.equal(d.movementsToday, 4, "three receipts and the transfer leaving Çekmeköy");
    assert.ok(d.recent.length > 0 && d.recent.length <= 8);
  });

  test("a mağaza sorumlusu sees only their own Lokasyon and no Kritik seviye list", async () => {
    const d = await dashboard.getDashboard(karakoyUser.headers);

    assert.deepEqual(d.lokasyon.map((l) => l.name), ["Karaköy Mağaza"]);
    assert.equal(d.belowMinimum, null);
    assert.equal(d.transfersOnTheWay, 1, "it is on its way to Karaköy");
    assert.equal(d.openCounts, 0, "the open count is at Çekmeköy");
    assert.equal(d.movementsToday, 1, "only the Karaköy receipt");
    assert.equal(d.noMinimumCount, null);
    assert.ok(d.recent.every((m) => m.lokasyonId === lokasyon["Karaköy Mağaza"]));
  });

  test("the stock summary totals per unit; only a Finans paneli holder gets values", async () => {
    const stockSummary = await dashboard.getStockSummary(muhendis.headers);
    assert.equal(stockSummary.finance, false);
    assert.equal(stockSummary.overall.products, 2);
    assert.equal(stockSummary.overall.units[0].total, "152", "on-the-way stock counts in the total");

    const owner = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: owner.user.id, panel: "finans", level: "duzenler" });
    const { savePrices } = await import("./prices");
    const [core] = await db.select().from(schema.product).where(eq(schema.product.code, "T-CORE"));
    await savePrices(owner.headers, [{ productId: core.id, purchasePrice: "2,50", purchaseCurrency: "TRY", salePrice: "4", saleCurrency: "TRY" }]);
    await assert.rejects(savePrices(muhendis.headers, []), "Finans izni olmadan fiyat kaydedilemez");

    const withValues = await dashboard.getStockSummary(owner.headers);
    assert.equal(withValues.overall.purchase, 350, "140 × 2,50");
    assert.equal(withValues.overall.margin, 210);
    assert.equal(withValues.overall.purchaseCounted, 1, "T-CU has no price");
    assert.equal((await dashboard.getStockSummary(muhendis.headers)).overall.purchase, 0);
  });
});
