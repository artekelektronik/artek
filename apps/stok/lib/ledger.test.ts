import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("stock ledger: mal kabul, balances and history", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let ledger: typeof import("./ledger");
  let receipts: typeof import("./receipts");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let core: string; // product in adet
  let copper: string; // product in kg

  const key = () => crypto.randomUUID();

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    ledger = await import("./ledger");
    receipts = await import("./receipts");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    karakoyUser = await signedInAs(["depo_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    muhendis = await signedInAs(["muhendis"]);
    const [a, b] = await db
      .insert(schema.product)
      .values([
        { code: "T-CORE", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
        { code: "T-CU", name: "Bakır tel", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
      ])
      .returning();
    core = a.id;
    copper = b.id;
  });
  after(() => db.$client.end());

  test("a mal kabul raises the balance through movements that record who, what, where, when and why", async () => {
    await receipts.recordReceipt(karakoyUser.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye 42",
      lines: [{ productId: core, quantity: "100" }],
      idempotencyKey: key(),
    });

    const balances = await ledger.getBalances(karakoyUser.headers, core);
    assert.deepEqual(
      balances.lokasyon.map((b) => [b.name, b.physical, b.reserved, b.available]),
      [["Karaköy Mağaza", "100", "0", "100"]],
    );
    assert.equal(balances.total.physical, "100");

    const [movement] = await ledger.listMovements(karakoyUser.headers, { productId: core });
    assert.equal(movement.type, "mal_kabul");
    assert.equal(movement.quantity, "100");
    assert.equal(movement.unit, "adet");
    assert.equal(movement.lokasyonName, "Karaköy Mağaza");
    assert.equal(movement.userId, karakoyUser.user.id);
    assert.ok(movement.createdAt instanceof Date);
    assert.equal(movement.reference, "İrsaliye 42");
    assert.equal(movement.supplier, "TDK");
  });

  test("a user records mal kabul only at a Lokasyon they have access to", async () => {
    const { Forbidden } = await import("./guard");
    await assert.rejects(
      receipts.recordReceipt(karakoyUser.headers, {
        supplier: "Test tedarikçi",
        reference: "T-1",
        lokasyonId: lokasyon["Çekmeköy İmalathane"],
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      }),
      Forbidden,
    );
  });

  test("quantities follow the product's unit", async () => {
    await assert.rejects(
      receipts.recordReceipt(muhendis.headers, {
        supplier: "Test tedarikçi",
        reference: "T-1",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        lines: [{ productId: core, quantity: "1,5" }],
        idempotencyKey: key(),
      }),
      /tam sayı/,
    );
    await receipts.recordReceipt(muhendis.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon["Çekmeköy İmalathane"],
      lines: [{ productId: copper, quantity: "12,345" }],
      idempotencyKey: key(),
    });
    assert.equal((await ledger.getBalances(muhendis.headers, copper)).total.physical, "12.345");
  });

  test("the database refuses to edit or delete a confirmed movement", async () => {
    await receipts.recordReceipt(muhendis.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [{ productId: core, quantity: "5" }],
      idempotencyKey: key(),
    });
    const { sql } = await import("drizzle-orm");
    // Drizzle wraps the database error; the trigger's message is on its cause.
    const refused = (error: { cause?: Error }) => /değiştirilemez/.test(error.cause?.message ?? "");
    await assert.rejects(db.execute(sql`update stock_movement set quantity = 50`), refused);
    await assert.rejects(db.execute(sql`delete from stock_movement`), refused);
    await assert.rejects(db.execute(sql`delete from stock_document`), refused);
  });

  test("a movement is corrected by a reversal with a reason, once", async () => {
    await receipts.recordReceipt(muhendis.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [{ productId: core, quantity: "30" }],
      idempotencyKey: key(),
    });
    const [original] = await ledger.listMovements(muhendis.headers, { productId: core });

    const { Forbidden } = await import("./guard");
    await assert.rejects(
      ledger.reverseMovement(karakoyUser.headers, original.id, { reason: "Yanlış giriş", idempotencyKey: key() }),
      Forbidden,
    );
    await assert.rejects(
      ledger.reverseMovement(muhendis.headers, original.id, { reason: " ", idempotencyKey: key() }),
      /neden/,
    );
    await ledger.reverseMovement(muhendis.headers, original.id, { reason: "Yanlış giriş", idempotencyKey: key() });
    assert.equal((await ledger.getBalances(muhendis.headers, core)).total.physical, "0");
    await assert.rejects(
      ledger.reverseMovement(muhendis.headers, original.id, { reason: "Tekrar", idempotencyKey: key() }),
      /zaten ters kaydı/,
    );

    const history = await ledger.listMovements(muhendis.headers, { productId: core });
    assert.equal(history.length, 2);
    assert.equal(history.find((m) => m.reversesId === original.id)?.quantity, "-30");
  });

  test("a failure part-way through a mal kabul leaves nothing behind", async () => {
    await assert.rejects(
      receipts.recordReceipt(muhendis.headers, {
        supplier: "Test tedarikçi",
        reference: "T-1",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        lines: [
          { productId: core, quantity: "10" },
          { productId: crypto.randomUUID(), quantity: "1" },
        ],
        idempotencyKey: key(),
      }),
      /Ürün bulunamadı/,
    );
    assert.equal((await db.select().from(schema.stockDocument)).length, 0);
    assert.equal((await db.select().from(schema.stockMovement)).length, 0);
    assert.equal((await db.select().from(schema.stock)).length, 0);
  });

  test("submitting the same mal kabul twice records it once", async () => {
    const receipt = {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye 7",
      lines: [{ productId: core, quantity: "7" }],
      idempotencyKey: key(),
    };
    const [first, second] = await Promise.all([
      receipts.recordReceipt(muhendis.headers, receipt),
      receipts.recordReceipt(muhendis.headers, receipt),
    ]);
    assert.equal(first.documentId, second.documentId);
    assert.equal((await db.select().from(schema.stockDocument)).length, 1);
    assert.equal((await db.select().from(schema.stockMovement)).length, 1);
    assert.equal((await ledger.getBalances(muhendis.headers, core)).total.physical, "7");
  });

  test("recomputing every balance from movements matches the stored balances", async () => {
    for (const [lokasyonName, product, qty] of [
      ["Karaköy Mağaza", core, "40"],
      ["Çekmeköy İmalathane", core, "15"],
      ["Çekmeköy İmalathane", copper, "2,5"],
      ["Karaköy Mağaza", core, "3"],
    ] as const) {
      await receipts.recordReceipt(muhendis.headers, {
        supplier: "Test tedarikçi",
        reference: "T-1",
        lokasyonId: lokasyon[lokasyonName],
        lines: [{ productId: product, quantity: qty }],
        idempotencyKey: key(),
      });
    }
    const [first] = await ledger.listMovements(muhendis.headers, { productId: core });
    await ledger.reverseMovement(muhendis.headers, first.id, { reason: "Düzeltme", idempotencyKey: key() });

    assert.deepEqual(await ledger.findBalanceMismatches(), []);
    assert.equal((await ledger.getBalances(muhendis.headers, core)).total.physical, "55");
  });

  test("movement history filters by date, type, user and Lokasyon, and hides Lokasyon the user can't see", async () => {
    await receipts.recordReceipt(karakoyUser.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [{ productId: core, quantity: "1" }],
      idempotencyKey: key(),
    });
    await receipts.recordReceipt(muhendis.headers, {
      supplier: "Test tedarikçi",
      reference: "T-1",
      lokasyonId: lokasyon["Çekmeköy İmalathane"],
      lines: [{ productId: core, quantity: "2" }],
      idempotencyKey: key(),
    });

    const all = await ledger.listMovements(muhendis.headers, {});
    assert.equal(all.length, 2);
    assert.equal((await ledger.listMovements(muhendis.headers, { userId: karakoyUser.user.id })).length, 1);
    assert.equal(
      (await ledger.listMovements(muhendis.headers, { lokasyonId: lokasyon["Çekmeköy İmalathane"] }))[0].quantity,
      "2",
    );
    assert.equal((await ledger.listMovements(muhendis.headers, { type: "fire" })).length, 0);
    const tomorrow = new Date(Date.now() + 86_400_000);
    assert.equal((await ledger.listMovements(muhendis.headers, { from: tomorrow })).length, 0);
    assert.equal((await ledger.listMovements(muhendis.headers, { to: tomorrow })).length, 2);

    // The Karaköy user never sees Çekmeköy, not even by asking for it.
    const seen = await ledger.listMovements(karakoyUser.headers, { lokasyonId: lokasyon["Çekmeköy İmalathane"] });
    assert.equal(seen.length, 0);
    const balances = await ledger.getBalances(karakoyUser.headers, core);
    assert.deepEqual(balances.lokasyon.map((b) => b.name), ["Karaköy Mağaza"]);
    assert.equal(balances.total.physical, "1");
  });

  test("a mal kabul needs a supplier and a document number", async () => {
    for (const missing of ["supplier", "reference"] as const) {
      await assert.rejects(
        receipts.recordReceipt(muhendis.headers, {
          lokasyonId: lokasyon["Karaköy Mağaza"],
          supplier: "TDK",
          reference: "İrsaliye 1",
          [missing]: " ",
          lines: [{ productId: core, quantity: "1" }],
          idempotencyKey: key(),
        }),
        missing === "supplier" ? /Tedarikçi/ : /Belge no/,
      );
    }
  });

  test("an archived product takes no new movements, but its past ones can still be reversed", async () => {
    await receipts.recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye 2",
      lines: [{ productId: core, quantity: "4" }],
      idempotencyKey: key(),
    });
    const [received] = await ledger.listMovements(muhendis.headers, { productId: core });
    const { eq } = await import("drizzle-orm");
    await db.update(schema.product).set({ archivedAt: new Date() }).where(eq(schema.product.id, core));

    await assert.rejects(
      receipts.recordReceipt(muhendis.headers, {
        lokasyonId: lokasyon["Karaköy Mağaza"],
        supplier: "TDK",
        reference: "İrsaliye 3",
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      }),
      /Arşivdeki ürün/,
    );
    await ledger.reverseMovement(muhendis.headers, received.id, { reason: "Hatalı giriş", idempotencyKey: key() });
    assert.equal((await ledger.getBalances(muhendis.headers, core)).total.physical, "0");
  });

  test("a quantity too large for the ledger is refused with a message", async () => {
    await assert.rejects(
      receipts.recordReceipt(muhendis.headers, {
        lokasyonId: lokasyon["Karaköy Mağaza"],
        supplier: "TDK",
        reference: "İrsaliye 4",
        lines: [{ productId: core, quantity: "1000000000000" }],
        idempotencyKey: key(),
      }),
      /çok büyük/,
    );
  });

  test("retrying a reversal with the same key returns the first result", async () => {
    await receipts.recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye 5",
      lines: [{ productId: core, quantity: "9" }],
      idempotencyKey: key(),
    });
    const [received] = await ledger.listMovements(muhendis.headers, { productId: core });
    const retryKey = key();
    const first = await ledger.reverseMovement(muhendis.headers, received.id, { reason: "Hata", idempotencyKey: retryKey });
    const again = await ledger.reverseMovement(muhendis.headers, received.id, { reason: "Hata", idempotencyKey: retryKey });
    assert.equal(again.documentId, first.documentId);
    assert.equal(again.created, false);
  });
});
