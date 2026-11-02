import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";
import { addDays, istanbulDate, istanbulTimeOn, weekStart } from "./time";

describe("stock-out report", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let report: typeof import("./stock-out-report");
  let stockOut: typeof import("./stock-out");
  let ledger: typeof import("./ledger");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let owner: Awaited<ReturnType<typeof signedInAs>>;
  let plainAdmin: Awaited<ReturnType<typeof signedInAs>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  let copper: string;
  const key = () => crypto.randomUUID();
  const out = (type: "satis_teslimati" | "uretim_tuketimi" | "fire", productId: string, quantity: string, reason = "Neden", headers = karakoyUser.headers) =>
    stockOut.recordStockOut(headers, {
      type,
      lokasyonId: lokasyon["Karaköy Mağaza"],
      reason,
      lines: [{ productId, quantity }],
      idempotencyKey: key(),
    });
  const nextMonday = () => istanbulTimeOn(addDays(weekStart(istanbulDate(new Date())), 7), "09:00:00");

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    report = await import("./stock-out-report");
    stockOut = await import("./stock-out");
    ledger = await import("./ledger");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    owner = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: owner.user.id, panel: "finans", level: "duzenler" });
    plainAdmin = await signedInAs(["admin"]);
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    const [a, b] = await db
      .insert(schema.product)
      .values([
        { code: "T-CORE", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
        { code: "T-CU", name: "Bakır tel", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
      ])
      .returning();
    core = a.id;
    copper = b.id;
    const { recordReceipt } = await import("./receipts");
    await recordReceipt(owner.headers, {
      supplier: "Test",
      reference: "T-1",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      lines: [
        { productId: core, quantity: "50" },
        { productId: copper, quantity: "10" },
      ],
      idempotencyKey: key(),
    });
    const { savePrices } = await import("./prices");
    await savePrices(owner.headers, [
      { productId: core, purchasePrice: "2", purchaseCurrency: "TRY", salePrice: "5", saleCurrency: "TRY" },
      { productId: copper, purchasePrice: "100", purchaseCurrency: "TRY", salePrice: "", saleCurrency: "TRY" },
    ]);
  });
  after(() => db.$client.end());

  test("saving a stock-out tells the balance before and after", async () => {
    const result = await out("satis_teslimati", core, "7");
    assert.deepEqual(result.lines, [
      { code: "T-CORE", name: "EE 25", unit: "adet", lokasyonName: "Karaköy Mağaza", before: "50", after: "43" },
    ]);
  });

  test("a sale is valued at the sale price, material used in production at the purchase price, fire at nothing", async () => {
    await out("satis_teslimati", core, "7", "Müşteri teslimatı");
    await out("uretim_tuketimi", copper, "1,5", "Bobin sarımı");
    await out("fire", core, "1", "Kırık");

    const week = await report.getWeekStockOuts(owner.headers);
    const value = (type: string) => week.summary.byType.find((t) => t.type === type)?.value;
    assert.equal(value("satis_teslimati"), 35, "7 × 5");
    assert.equal(value("uretim_tuketimi"), 150, "1,5 × 100");
    assert.equal(value("fire"), null);
    const sale = week.rows.find((r) => r.type === "satis_teslimati");
    assert.equal(sale?.reason, "Müşteri teslimatı");
    assert.equal(sale?.userName, karakoyUser.user.name);
    assert.equal(sale?.value, 35);
  });

  test("without the Finans paneli the exits are visible but carry no amounts", async () => {
    await out("satis_teslimati", core, "7");
    const week = await report.getWeekStockOuts(karakoyUser.headers);
    assert.equal(week.rows.length, 1);
    assert.equal(week.rows[0].value, null);
    assert.equal(week.summary.byType.find((t) => t.type === "satis_teslimati")?.value, null);
    assert.equal(week.finance, false);
  });

  test("a sale of a product with no sale price is counted as unpriced, not as zero", async () => {
    await out("satis_teslimati", copper, "1");
    const week = await report.getWeekStockOuts(owner.headers);
    const sale = week.summary.byType.find((t) => t.type === "satis_teslimati");
    assert.equal(sale?.value, null);
    assert.equal(sale?.unpriced, 1);
  });

  test("a reversed stock-out is left out; a correction is reported apart", async () => {
    await out("fire", core, "2");
    const [movement] = await ledger.listMovements(owner.headers, { type: "fire" });
    await ledger.reverseMovement(owner.headers, movement.id, { reason: "Yanlış giriş", idempotencyKey: key() });
    const { correctStock } = await import("./stock-entry");
    await correctStock(owner.headers, { productId: core, lokasyonId: lokasyon["Karaköy Mağaza"], quantity: "45", idempotencyKey: key() });

    const week = await report.getWeekStockOuts(owner.headers);
    assert.equal(week.summary.exits.length, 0);
    assert.deepEqual(week.summary.corrections.map((c) => c.quantity), ["5"]);
  });

  test("the Monday email goes once to active admins; only Finans paneli holders get amounts", async () => {
    await out("satis_teslimati", core, "7", "Müşteri teslimatı");
    const monday = nextMonday();

    assert.deepEqual(await report.queueWeeklyStockOutReport(new Date(monday.getTime() + 86_400_000)), [], "only on a Monday");
    assert.deepEqual(await report.queueWeeklyStockOutReport(monday), ["stok_cikis_haftalik"]);
    assert.deepEqual(await report.queueWeeklyStockOutReport(monday), [], "once a week");

    const sent = await db.select().from(schema.notification).where(eq(schema.notification.kind, "stok_cikis_haftalik"));
    assert.equal(sent.length, 2);
    const withAmounts = sent.find((n) => n.recipients.includes(owner.user.email));
    const without = sent.find((n) => n.recipients.includes(plainAdmin.user.email));
    assert.match(withAmounts!.body, /Müşteri teslimatı/);
    assert.match(withAmounts!.body, /35/);
    assert.match(without!.body, /Müşteri teslimatı/);
    assert.doesNotMatch(without!.body, /TL/);
    assert.ok(!sent.some((n) => n.recipients.includes(karakoyUser.user.email)));
  });
});
