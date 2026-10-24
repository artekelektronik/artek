import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("sayım without locks", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let ledger: typeof import("./ledger");
  let counts: typeof import("./counts");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  let filter: string;
  const key = () => crypto.randomUUID();
  const karakoyPhysical = async (productId = core) =>
    (await ledger.getBalances(muhendis.headers, productId)).lokasyon.find((b) => b.name === "Karaköy Mağaza")?.physical;

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    ledger = await import("./ledger");
    counts = await import("./counts");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    muhendis = await signedInAs(["muhendis"]);
    const [a, b] = await db
      .insert(schema.product)
      .values([
        { code: "T-CORE", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
        { code: "T-FLT", name: "EMI filtre", category: "PEM", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
      ])
      .returning();
    core = a.id;
    filter = b.id;
    await db.insert(schema.productShelf).values([
      { productId: core, lokasyonId: lokasyon["Karaköy Mağaza"], rafKodu: "B-2" },
      { productId: filter, lokasyonId: lokasyon["Karaköy Mağaza"], rafKodu: "A-1" },
    ]);
    const { recordReceipt } = await import("./receipts");
    await recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      supplier: "TDK",
      reference: "İrsaliye 1",
      lines: [
        { productId: core, quantity: "12" },
        { productId: filter, quantity: "5" },
      ],
      idempotencyKey: key(),
    });
  });
  after(() => db.$client.end());

  test("count 11 at balance 12, then a sale of 2: the difference is −1 and the balance after approval is 9", async () => {
    const { countId } = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.recordCountLines(karakoyUser.headers, countId, [{ productId: core, counted: "11" }]);

    const { recordStockOut } = await import("./stock-out");
    await recordStockOut(karakoyUser.headers, {
      type: "satis_teslimati",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      reason: "Satış sayım sırasında",
      lines: [{ productId: core, quantity: "2" }],
      idempotencyKey: key(),
    });
    assert.equal(await karakoyPhysical(), "10");

    const count = await counts.getCount(muhendis.headers, countId);
    const line = count?.lines.find((l) => l.productId === core);
    assert.equal(line?.balanceAtCount, "12");
    assert.equal(line?.difference, "-1");

    await counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() });
    assert.equal(await karakoyPhysical(), "9");
    const correction = (await ledger.listMovements(muhendis.headers, { type: "sayim_duzeltmesi" }))[0];
    assert.equal(correction.quantity, "-1");
    assert.deepEqual(await ledger.findBalanceMismatches(), []);
  });

  test("saving the sheet again keeps the moment of lines already counted", async () => {
    const { countId } = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.recordCountLines(karakoyUser.headers, countId, [{ productId: core, counted: "11" }]);
    const { recordStockOut } = await import("./stock-out");
    await recordStockOut(karakoyUser.headers, {
      type: "satis_teslimati",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      reason: "Satış",
      lines: [{ productId: core, quantity: "2" }],
      idempotencyKey: key(),
    });
    // The sheet posts every input again, including the unchanged 11.
    await counts.recordCountLines(karakoyUser.headers, countId, [
      { productId: core, counted: "11" },
      { productId: filter, counted: "5" },
    ]);
    const line = (await counts.getCount(muhendis.headers, countId))?.lines.find((l) => l.productId === core);
    assert.equal(line?.balanceAtCount, "12");
    assert.equal(line?.difference, "-1");
    await counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() });
    assert.equal(await karakoyPhysical(), "9");
  });

  test("a draft count changes no stock, and transfers keep working during it", async () => {
    const { countId } = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.recordCountLines(karakoyUser.headers, countId, [
      { productId: core, counted: "3" },
      { productId: filter, counted: "0" },
    ]);
    assert.equal(await karakoyPhysical(), "12");
    assert.equal(await karakoyPhysical(filter), "5");

    const { sendTransfer } = await import("./transfers");
    await sendTransfer(karakoyUser.headers, {
      fromLokasyonId: lokasyon["Karaköy Mağaza"],
      toLokasyonId: lokasyon["Çekmeköy İmalathane"],
      lines: [{ productId: core, quantity: "1" }],
      idempotencyKey: key(),
    });
    assert.equal(await karakoyPhysical(), "11");
  });

  test("approving twice applies the differences once", async () => {
    const { countId } = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.recordCountLines(karakoyUser.headers, countId, [{ productId: core, counted: "15" }]);
    const approval = { idempotencyKey: key() };
    await Promise.all([
      counts.approveCount(muhendis.headers, countId, approval),
      counts.approveCount(muhendis.headers, countId, approval),
    ]);
    await assert.rejects(counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() }), /zaten onaylandı/);
    assert.equal(await karakoyPhysical(), "15");
    assert.equal((await ledger.listMovements(muhendis.headers, { type: "sayim_duzeltmesi" })).length, 1);
  });

  test("a session records who counted and who approved, and only an authorized user approves or cancels", async () => {
    const { Forbidden } = await import("./guard");
    const { countId } = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.recordCountLines(karakoyUser.headers, countId, [{ productId: core, counted: "12" }]);
    await assert.rejects(counts.approveCount(karakoyUser.headers, countId, { idempotencyKey: key() }), Forbidden);
    await assert.rejects(counts.cancelCount(karakoyUser.headers, countId), Forbidden);

    await counts.approveCount(muhendis.headers, countId, { idempotencyKey: key() });
    const count = await counts.getCount(muhendis.headers, countId);
    assert.equal(count?.status, "onaylandi");
    assert.equal(count?.createdById, karakoyUser.user.id);
    assert.equal(count?.approvedById, muhendis.user.id);
    assert.ok(count?.approvedAt);
    assert.equal(count?.lines.find((l) => l.productId === core)?.countedById, karakoyUser.user.id);

    const abandoned = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    await counts.cancelCount(muhendis.headers, abandoned.countId);
    assert.equal((await counts.getCount(muhendis.headers, abandoned.countId))?.status, "iptal");
    await assert.rejects(
      counts.recordCountLines(karakoyUser.headers, abandoned.countId, [{ productId: core, counted: "1" }]),
      /açık değil/,
    );
  });

  test("count sheets are sorted by Raf kodu, and a count can cover one category", async () => {
    const all = await counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Karaköy Mağaza"], kind: "sayim" });
    const sheet = await counts.getCount(karakoyUser.headers, all.countId);
    assert.deepEqual(sheet?.lines.map((l) => l.rafKodu), ["A-1", "B-2"]);

    const ferrit = await counts.openCount(karakoyUser.headers, {
      lokasyonId: lokasyon["Karaköy Mağaza"],
      kind: "sayim",
      category: "Ferrit",
    });
    assert.deepEqual((await counts.getCount(karakoyUser.headers, ferrit.countId))?.lines.map((l) => l.productId), [core]);
  });

  test("a count is opened only at a Lokasyon the user has access to", async () => {
    const { Forbidden } = await import("./guard");
    await assert.rejects(
      counts.openCount(karakoyUser.headers, { lokasyonId: lokasyon["Çekmeköy İmalathane"], kind: "sayim" }),
      Forbidden,
    );
  });
});
