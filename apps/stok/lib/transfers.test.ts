import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("transfer between Lokasyon", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let ledger: typeof import("./ledger");
  let transfers: typeof import("./transfers");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let cekmekoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  const key = () => crypto.randomUUID();

  const physicalAt = async (name: keyof typeof lokasyon) =>
    (await ledger.getBalances(muhendis.headers, core)).lokasyon.find((b) => b.name === name)?.physical;

  async function send(quantity: string, as = cekmekoyUser) {
    return transfers.sendTransfer(as.headers, {
      fromLokasyonId: lokasyon["Çekmeköy İmalathane"],
      toLokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [{ productId: core, quantity }],
      idempotencyKey: key(),
    });
  }

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    ledger = await import("./ledger");
    transfers = await import("./transfers");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    cekmekoyUser = await signedInAs(["depo_sorumlusu"], [lokasyon["Çekmeköy İmalathane"]]);
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    muhendis = await signedInAs(["muhendis"]);
    const [p] = await db
      .insert(schema.product)
      .values({ code: "T-CORE", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true })
      .returning();
    core = p.id;
    const { recordReceipt } = await import("./receipts");
    await recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Çekmeköy İmalathane"],
      supplier: "TDK",
      reference: "İrsaliye 1",
      lines: [{ productId: core, quantity: "30" }],
      idempotencyKey: key(),
    });
  });
  after(() => db.$client.end());

  test("send 10, receive 6 with 4 lost: Çekmeköy −10, Karaköy +6, a loss of 4; the company total changes only by the loss", async () => {
    const companyTotal = async () =>
      Number((await ledger.getBalances(muhendis.headers, core)).total.physical) + Number(await transfers.inTransit(core));
    assert.equal(await companyTotal(), 30);

    const { transferId } = await send("10");
    assert.equal(await physicalAt("Çekmeköy İmalathane"), "20");
    assert.equal(await physicalAt("Karaköy Mağaza"), "0");
    assert.equal(await transfers.inTransit(core), "10");
    assert.equal(await companyTotal(), 30);

    await transfers.receiveTransfer(karakoyUser.headers, transferId, {
      lines: [{ productId: core, received: "6", lossReason: "kayip" }],
      idempotencyKey: key(),
    });
    assert.equal(await physicalAt("Çekmeköy İmalathane"), "20");
    assert.equal(await physicalAt("Karaköy Mağaza"), "6");
    assert.equal(await transfers.inTransit(core), "0");
    assert.equal(await companyTotal(), 26);

    const loss = (await ledger.listMovements(muhendis.headers, { type: "transfer_kaybi" }))[0];
    assert.equal(loss.quantity, "-4");
    assert.equal(loss.reason, "Kayıp");
    assert.equal(loss.transferId, transferId);
    assert.equal((await transfers.getTransfer(muhendis.headers, transferId))?.status, "teslim_alindi");
    assert.deepEqual(await ledger.findBalanceMismatches(), []);
  });

  test("stock on the way can't be used at the target before it is received", async () => {
    await send("10");
    const { recordStockOut } = await import("./stock-out");
    await assert.rejects(
      recordStockOut(karakoyUser.headers, {
        type: "satis_teslimati",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        reason: "Satış",
        lines: [{ productId: core, quantity: "1" }],
        idempotencyKey: key(),
      }),
      /Yetersiz stok/,
    );
  });

  test("sending more than is available at the source is refused and records nothing", async () => {
    await assert.rejects(send("31"), /Yetersiz stok/);
    assert.equal((await db.select().from(schema.transfer)).length, 0);
    assert.equal(await physicalAt("Çekmeköy İmalathane"), "30");
  });

  test("only the source can send and only the target can receive", async () => {
    const { Forbidden } = await import("./guard");
    await assert.rejects(send("1", karakoyUser), Forbidden);
    const { transferId } = await send("5");
    await assert.rejects(
      transfers.receiveTransfer(cekmekoyUser.headers, transferId, {
        lines: [{ productId: core, received: "5" }],
        idempotencyKey: key(),
      }),
      Forbidden,
    );
  });

  test("a transfer is received once: a retry returns the first result, a second receipt is refused", async () => {
    const { transferId } = await send("5");
    const receipt = { lines: [{ productId: core, received: "5" }], idempotencyKey: key() };
    const [first, retry] = await Promise.all([
      transfers.receiveTransfer(karakoyUser.headers, transferId, receipt),
      transfers.receiveTransfer(karakoyUser.headers, transferId, receipt),
    ]);
    assert.equal(first.documentId, retry.documentId);
    await assert.rejects(
      transfers.receiveTransfer(karakoyUser.headers, transferId, {
        lines: [{ productId: core, received: "5" }],
        idempotencyKey: key(),
      }),
      /zaten teslim alındı/,
    );
    assert.equal(await physicalAt("Karaköy Mağaza"), "5");
  });

  test("a shortfall needs a reason, and more than was sent can't arrive", async () => {
    const { transferId } = await send("10");
    await assert.rejects(
      transfers.receiveTransfer(karakoyUser.headers, transferId, {
        lines: [{ productId: core, received: "6" }],
        idempotencyKey: key(),
      }),
      /eksik/,
    );
    await assert.rejects(
      transfers.receiveTransfer(karakoyUser.headers, transferId, {
        lines: [{ productId: core, received: "11" }],
        idempotencyKey: key(),
      }),
      /gönderilenden fazla/,
    );
    assert.equal(await transfers.inTransit(core), "10");
  });
});
