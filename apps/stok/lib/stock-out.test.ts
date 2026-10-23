import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("manual stock-out", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let ledger: typeof import("./ledger");
  let receipts: typeof import("./receipts");
  let stockOut: typeof import("./stock-out");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  let copper: string;
  const key = () => crypto.randomUUID();

  async function receive(productId: string, quantity: string, lokasyonName: keyof typeof lokasyon = "Karaköy Mağaza") {
    const admin = await signedInAs(["admin"]);
    await receipts.recordReceipt(admin.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon[lokasyonName],
      lines: [{ productId, quantity }],
      idempotencyKey: key(),
    });
  }

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    ledger = await import("./ledger");
    receipts = await import("./receipts");
    stockOut = await import("./stock-out");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    const [a, b] = await db
      .insert(schema.product)
      .values([
        { code: "T-CORE", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: true, unit: "adet", showOnSite: true },
        { code: "T-CU", name: "Bakır tel", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
      ])
      .returning();
    core = a.id;
    copper = b.id;
  });
  after(() => db.$client.end());

  test("each stock-out type is recorded with its reason and lowers the balance by exactly its quantity", async () => {
    await receive(core, "50");
    await receive(copper, "10", "Karaköy Mağaza");
    for (const [type, productId, quantity] of [
      ["satis_teslimati", core, "7"],
      ["uretim_tuketimi", copper, "2,125"],
      ["fire", core, "1"],
    ] as const) {
      await stockOut.recordStockOut(karakoyUser.headers, {
        type,
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: `${type} nedeni`,
        reference: "REF-1",
        lines: [{ productId, quantity }],
        idempotencyKey: key(),
      });
    }

    assert.equal((await ledger.getBalances(karakoyUser.headers, core)).total.physical, "42");
    assert.equal((await ledger.getBalances(karakoyUser.headers, copper)).total.physical, "7.875");
    const history = await ledger.listMovements(karakoyUser.headers, {});
    const sale = history.find((m) => m.type === "satis_teslimati");
    assert.equal(sale?.quantity, "-7");
    assert.equal(sale?.reason, "satis_teslimati nedeni");
    assert.equal(sale?.reference, "REF-1");
    assert.equal(history.find((m) => m.type === "uretim_tuketimi")?.quantity, "-2.125");
    assert.equal(history.find((m) => m.type === "fire")?.quantity, "-1");
    assert.deepEqual(await ledger.findBalanceMismatches(), []);
  });

  test("a stock-out is recorded only at a Lokasyon the user has access to", async () => {
    await receive(core, "5", "Çekmeköy İmalathane");
    const { Forbidden } = await import("./guard");
    await assert.rejects(
      stockOut.recordStockOut(karakoyUser.headers, {
        type: "fire",
        lokasyonId: lokasyon["Çekmeköy İmalathane"],
        reason: "Kırıldı",
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      }),
      Forbidden,
    );
  });

  test("a stock-out needs a reason", async () => {
    await receive(core, "5");
    await assert.rejects(
      stockOut.recordStockOut(karakoyUser.headers, {
        type: "fire",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: "  ",
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      }),
      /neden/,
    );
  });

  test("taking more than is available is refused in Turkish and records nothing", async () => {
    await receive(core, "3");
    await assert.rejects(
      stockOut.recordStockOut(karakoyUser.headers, {
        type: "satis_teslimati",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: "Müşteri siparişi",
        lines: [{ productId: core, quantity: "4" }],
        idempotencyKey: key(),
      }),
      /Yetersiz stok: T-CORE için kullanılabilir miktar 3 adet/,
    );
    assert.equal((await ledger.getBalances(karakoyUser.headers, core)).total.physical, "3");
    assert.equal((await db.select().from(schema.stockDocument)).filter((d) => d.kind === "stok_cikisi").length, 0);
  });

  test("two simultaneous requests for the last unit: exactly one succeeds", async () => {
    await receive(core, "1");
    const attempt = () =>
      stockOut.recordStockOut(karakoyUser.headers, {
        type: "satis_teslimati",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: "Son adet",
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      });
    const results = await Promise.allSettled([attempt(), attempt(), attempt()]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      assert.match((r as PromiseRejectedResult).reason.message, /Yetersiz stok/);
    }
    assert.equal((await ledger.getBalances(karakoyUser.headers, core)).total.physical, "0");
  });
});
