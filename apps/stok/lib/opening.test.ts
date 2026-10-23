import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("açılış sayımı: go-live per Lokasyon", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let ledger: typeof import("./ledger");
  let counts: typeof import("./counts");
  let receipts: typeof import("./receipts");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let products: { id: string }[];
  const key = () => crypto.randomUUID();
  const cekmekoy = () => lokasyon["Çekmeköy İmalathane"];

  const receiveAtCekmekoy = () =>
    receipts.recordReceipt(muhendis.headers, {
      lokasyonId: cekmekoy(),
      supplier: "TDK",
      reference: "İrsaliye",
      lines: [{ productId: products[0].id, quantity: "5" }],
      idempotencyKey: key(),
    });

  async function approveOpening(counted: string[]) {
    const { countId } = await counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "acilis" });
    await counts.recordCountLines(
      muhendis.headers,
      countId,
      products.map((p, i) => ({ productId: p.id, counted: counted[i] ?? "" })),
    );
    await counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() });
    return countId;
  }

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    ledger = await import("./ledger");
    counts = await import("./counts");
    receipts = await import("./receipts");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    const { eq } = await import("drizzle-orm");
    await db.update(schema.lokasyon).set({ openedAt: null }).where(eq(schema.lokasyon.id, cekmekoy()));
    muhendis = await signedInAs(["muhendis"]);
    products = await db
      .insert(schema.product)
      .values([
        { code: "T-1", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
        { code: "T-2", name: "Bakır tel", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
        { code: "T-3", name: "Eski ürün", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: false, archivedAt: new Date() },
      ])
      .returning({ id: schema.product.id });
  });
  after(() => db.$client.end());

  test("before the opening count is approved, no other movement can be recorded at that Lokasyon", async () => {
    await assert.rejects(receiveAtCekmekoy(), /açılış sayımı onaylanmadan/);
    await assert.rejects(
      counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "sayim" }),
      /Önce bu Lokasyonun açılış sayımı/,
    );
    // The other Lokasyon is already open and unaffected.
    await receipts.recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye",
      lines: [{ productId: products[0].id, quantity: "1" }],
      idempotencyKey: key(),
    });
  });

  test("the opening sheet lists every active product, with its Raf kodu", async () => {
    await db.insert(schema.productShelf).values({ productId: products[1].id, lokasyonId: cekmekoy(), rafKodu: "C-4" });
    const { countId } = await counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "acilis" });
    const sheet = await counts.getCount(muhendis.headers, countId);
    assert.deepEqual(
      sheet?.lines.map((l) => [l.code, l.rafKodu, l.counted]),
      [
        ["T-2", "C-4", null],
        ["T-1", null, null],
      ],
    );
  });

  test("after approval every balance equals its opening movement, and later balances are opening + movements", async () => {
    await approveOpening(["40", "12,5"]);

    const opening = await ledger.listMovements(muhendis.headers, { type: "acilis" });
    assert.equal(opening.length, 2);
    for (const movement of opening) {
      const balance = (await ledger.getBalances(muhendis.headers, movement.productId)).lokasyon.find(
        (b) => b.lokasyonId === cekmekoy(),
      );
      assert.equal(balance?.physical, movement.quantity);
    }

    await receiveAtCekmekoy();
    const after = (await ledger.getBalances(muhendis.headers, products[0].id)).lokasyon.find((b) => b.lokasyonId === cekmekoy());
    assert.equal(after?.physical, "45");
    assert.deepEqual(await ledger.findBalanceMismatches(), []);
  });

  test("a Lokasyon has exactly one approved opening count; a second is refused", async () => {
    await approveOpening(["1"]);
    await assert.rejects(
      counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "acilis" }),
      /zaten onaylandı/,
    );
  });

  test("two opening counts approved at the same moment: only one goes through", async () => {
    const first = await counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "acilis" });
    const second = await counts.openCount(muhendis.headers, { lokasyonId: cekmekoy(), kind: "acilis" });
    for (const { countId } of [first, second]) {
      await counts.recordCountLines(muhendis.headers, countId, [{ productId: products[0].id, counted: "10" }]);
    }
    const results = await Promise.allSettled([
      counts.approveCount(muhendis.headers, first.countId, { idempotencyKey: key() }),
      counts.approveCount(muhendis.headers, second.countId, { idempotencyKey: key() }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const balance = (await ledger.getBalances(muhendis.headers, products[0].id)).lokasyon.find((b) => b.lokasyonId === cekmekoy());
    assert.equal(balance?.physical, "10");
  });
});
