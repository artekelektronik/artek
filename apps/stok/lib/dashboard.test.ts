import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";
import { istanbulDate } from "./time";

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

    assert.equal(d.productCount, 2, "archived products don't count");
    assert.deepEqual(
      d.lokasyon.map((l) => [l.name, l.stockedProducts, Boolean(l.openedAt)]),
      [
        ["Çekmeköy İmalathane", 2, true],
        ["Karaköy Mağaza", 1, true],
      ],
    );
    assert.equal(d.transfersOnTheWay, 1);
    assert.equal(d.openCounts, 1);
    assert.deepEqual(
      d.belowMinimum?.map((p) => [p.code, p.total, p.minLevel]),
      [["T-CORE", "140", "200"]],
    );
    assert.equal(d.daily.length, dashboard.dashboardDays);
    const today = d.daily.at(-1)!;
    assert.equal(today.inbound, 3, "three receipts");
    assert.equal(today.outbound, 1, "the transfer leaving Çekmeköy");
    assert.equal(d.movementsToday, today.inbound + today.outbound);
    assert.ok(d.recent.length > 0 && d.recent.length <= 8);
  });

  test("a mağaza sorumlusu sees only their own Lokasyon and no Kritik seviye list", async () => {
    const d = await dashboard.getDashboard(karakoyUser.headers);

    assert.deepEqual(d.lokasyon.map((l) => l.name), ["Karaköy Mağaza"]);
    assert.equal(d.belowMinimum, null);
    assert.equal(d.transfersOnTheWay, 1, "it is on its way to Karaköy");
    assert.equal(d.openCounts, 0, "the open count is at Çekmeköy");
    assert.equal(d.movementsToday, 1, "only the Karaköy receipt");
    assert.deepEqual(d.daily.at(-1), { day: d.daily.at(-1)!.day, inbound: 1, outbound: 0 });
    assert.ok(d.recent.every((m) => m.lokasyonId === lokasyon["Karaköy Mağaza"]));
  });

  test("days with no movement are zero, and today is the last day", async () => {
    const d = await dashboard.getDashboard(muhendis.headers);
    const istanbulToday = istanbulDate(new Date());
    assert.equal(d.daily.at(-1)!.day, istanbulToday);
    assert.deepEqual(d.daily.slice(0, -1).map((x) => x.inbound + x.outbound), Array(dashboard.dashboardDays - 1).fill(0));
  });
});
