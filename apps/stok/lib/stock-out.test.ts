import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
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

  test("the picker's available figure follows the balance, per Lokasyon", async () => {
    const { availableByLokasyon } = await import("./pickers");
    const karakoy = lokasyon["Karaköy Mağaza"];
    const cekmekoy = lokasyon["Çekmeköy İmalathane"];
    await receive(core, "50");
    await receive(core, "7", "Çekmeköy İmalathane");
    await stockOut.recordStockOut(karakoyUser.headers, {
      type: "fire",
      lokasyonId: karakoy,
      reason: "Kırık",
      lines: [{ productId: core, quantity: "20" }],
      idempotencyKey: key(),
    });
    const available = await availableByLokasyon([karakoy, cekmekoy]);
    assert.equal(available[karakoy][core], "30");
    assert.equal(available[cekmekoy][core], "7");
    assert.deepEqual(Object.keys(await availableByLokasyon([cekmekoy])), [cekmekoy]);
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

  describe("correcting a stock-out", () => {
    let fixer: Awaited<ReturnType<typeof signedInAs>>;
    const out = async (quantity: string) => {
      const { documentId } = await stockOut.recordStockOut(karakoyUser.headers, {
        type: "satis_teslimati",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: "Yanlış girildi",
        lines: [{ productId: core, quantity }],
        idempotencyKey: key(),
      });
      const [m] = await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.documentId, documentId));
      return m.id;
    };
    const physical = async () => (await ledger.getBalances(karakoyUser.headers, core)).total.physical;
    beforeEach(async () => {
      fixer = await signedInAs(["muhendis"]);
      await receive(core, "50");
    });

    test("Düzenle takes the right amount instead, with its new type and reason, in one step", async () => {
      const id = await out("10");
      await stockOut.correctStockOut(fixer.headers, id, { type: "fire", quantity: "4", reason: "Kırık çıktı", reference: "", idempotencyKey: key() });
      assert.equal(await physical(), "46");
      const moves = await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.productId, core));
      assert.ok(moves.some((m) => m.reversesId === id), "the wrong one is reversed");
      assert.ok(moves.some((m) => m.type === "fire" && m.quantity === "-4.000" && m.reason === "Kırık çıktı"));
    });

    test("Sil puts the stock back", async () => {
      const id = await out("10");
      await stockOut.deleteStockOut(fixer.headers, id, { idempotencyKey: key() });
      assert.equal(await physical(), "50");
    });

    test("a correction that can't be taken changes nothing", async () => {
      const id = await out("50");
      await assert.rejects(stockOut.correctStockOut(fixer.headers, id, { type: "fire", quantity: "60", reason: "x", reference: "", idempotencyKey: key() }), /Yetersiz stok/);
      assert.equal(await physical(), "0");
      assert.equal((await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.reversesId, id))).length, 0);
    });

    test("only a stock-out not yet corrected, by someone who may reverse", async () => {
      const id = await out("10");
      await assert.rejects(stockOut.deleteStockOut(karakoyUser.headers, id, { idempotencyKey: key() }));
      await stockOut.deleteStockOut(fixer.headers, id, { idempotencyKey: key() });
      await assert.rejects(stockOut.deleteStockOut(fixer.headers, id, { idempotencyKey: key() }), /düzeltilmiş/);
      const [receipt] = await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.type, "mal_kabul"));
      await assert.rejects(stockOut.deleteStockOut(fixer.headers, receipt.id, { idempotencyKey: key() }), /yalnız elle girilen stok çıkışı/);
    });
  });
});
