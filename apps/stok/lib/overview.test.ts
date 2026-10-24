import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";
import { toCsv } from "./overview-csv";

describe("stock overview", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let overview: typeof import("./overview");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let karakoyUser: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  let copper: string;
  const key = () => crypto.randomUUID();

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    overview = await import("./overview");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    karakoyUser = await signedInAs(["magaza_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    muhendis = await signedInAs(["muhendis"]);
    const [a, b] = await db
      .insert(schema.product)
      .values([
        { code: "T-CORE", name: "EE 25 çekirdek", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: true },
        { code: "T-CU", name: "Bakır tel; 0,5 mm", category: "Malzeme", isTradeGoods: false, isMaterial: true, unit: "kg", showOnSite: false },
      ])
      .returning();
    core = a.id;
    copper = b.id;
    const { recordReceipt } = await import("./receipts");
    for (const [name, productId, quantity] of [
      ["Karaköy Mağaza", core, "40"],
      ["Çekmeköy İmalathane", core, "100"],
      ["Çekmeköy İmalathane", copper, "12,5"],
      ["Karaköy Mağaza", copper, "0,75"],
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
      lines: [{ productId: core, quantity: "10" }],
      idempotencyKey: key(),
    });
  });
  after(() => db.$client.end());

  test("stock per Lokasyon, with stock on the way shown separately", async () => {
    const result = await overview.getOverview(muhendis.headers, {});
    assert.deepEqual(result.lokasyon.map((l) => l.name), ["Çekmeköy İmalathane", "Karaköy Mağaza"]);
    const row = result.rows.find((r) => r.code === "T-CORE")!;
    assert.equal(row.stock[lokasyon["Çekmeköy İmalathane"]].physical, "90");
    assert.equal(row.stock[lokasyon["Karaköy Mağaza"]].available, "40");
    assert.equal(row.inTransit, "10");
    assert.equal(row.total, "140");
  });

  test("totals equal the sum of the lines shown, per unit", async () => {
    for (const filters of [{}, { category: "Ferrit" }, { q: "bakır" }]) {
      const result = await overview.getOverview(muhendis.headers, filters);
      for (const [unit, totals] of Object.entries(result.totals)) {
        const lines = result.rows.filter((r) => r.unit === unit);
        for (const l of result.lokasyon) {
          const { addQuantities } = await import("./quantity");
          assert.equal(totals.stock[l.id].physical, addQuantities(...lines.map((r) => r.stock[l.id].physical)), `${unit} ${l.name}`);
        }
        const { addQuantities } = await import("./quantity");
        assert.equal(totals.total, addQuantities(...lines.map((r) => r.total)));
      }
    }
    const kg = (await overview.getOverview(muhendis.headers, {})).totals.kg!;
    assert.equal(kg.total, "13.25");
  });

  test("users see only their Lokasyon, even when they ask for another one", async () => {
    const own = await overview.getOverview(karakoyUser.headers, {});
    assert.deepEqual(own.lokasyon.map((l) => l.name), ["Karaköy Mağaza"]);
    assert.equal(own.rows.find((r) => r.code === "T-CORE")?.total, "50");

    const crafted = await overview.getOverview(karakoyUser.headers, { lokasyonId: lokasyon["Çekmeköy İmalathane"] });
    assert.deepEqual(crafted.lokasyon, []);
    assert.equal(crafted.rows.every((r) => r.total === "0"), true);
    assert.equal(toCsv(crafted).includes("100"), false);
  });

  test("the CSV route applies the same visibility to a crafted request, and refuses users without a role", async () => {
    const { GET } = await import("../app/(app)/stok-durumu/csv/route");
    const crafted = await GET(
      new Request(`http://localhost/stok-durumu/csv?lokasyon=${lokasyon["Çekmeköy İmalathane"]}`, { headers: karakoyUser.headers }),
    );
    assert.equal(crafted.status, 200);
    const csv = await crafted.text();
    assert.equal(csv.includes("Çekmeköy"), false);
    assert.equal(csv.includes("100"), false);

    const noRole = await signedInAs([]);
    assert.equal((await GET(new Request("http://localhost/stok-durumu/csv", { headers: noRole.headers }))).status, 403);
    assert.equal((await GET(new Request("http://localhost/stok-durumu/csv"))).status, 401);
  });

  test("the below-Kritik-seviye filter is ignored for users who don't see every Lokasyon", async () => {
    const { eq } = await import("drizzle-orm");
    await db.update(schema.product).set({ minLevel: "1000" }).where(eq(schema.product.id, core));
    assert.deepEqual((await overview.getOverview(muhendis.headers, { belowMinimum: true })).rows.map((r) => r.code), ["T-CORE"]);
    const restricted = await overview.getOverview(karakoyUser.headers, { belowMinimum: true });
    assert.equal(restricted.canFilterBelowMinimum, false);
    assert.equal(restricted.rows.length, 2);
  });

  test("filters by product, category and Lokasyon", async () => {
    assert.deepEqual((await overview.getOverview(muhendis.headers, { q: "t-cu" })).rows.map((r) => r.code), ["T-CU"]);
    assert.deepEqual((await overview.getOverview(muhendis.headers, { category: "Ferrit" })).rows.map((r) => r.code), ["T-CORE"]);
    assert.deepEqual(
      (await overview.getOverview(muhendis.headers, { category: ["Ferrit", "Malzeme"] })).rows.map((r) => r.code).sort(),
      ["T-CORE", "T-CU"],
    );
    const karakoyOnly = await overview.getOverview(muhendis.headers, { lokasyonId: lokasyon["Karaköy Mağaza"] });
    assert.deepEqual(karakoyOnly.lokasyon.map((l) => l.name), ["Karaköy Mağaza"]);
  });

  test("the CSV opens in Excel with Turkish characters and decimal quantities", async () => {
    const csv = toCsv(await overview.getOverview(muhendis.headers, {}));
    assert.equal(csv.charCodeAt(0), 0xfeff, "UTF-8 BOM so Excel reads Turkish characters");
    const [header, ...lines] = csv.slice(1).trimEnd().split("\r\n");
    assert.match(header, /^Kod;Ürün;Kategori;Birim;/);
    assert.match(header, /Çekmeköy İmalathane fiziksel/);
    const copperLine = lines.find((l) => l.startsWith("T-CU;"))!;
    assert.match(copperLine, /^T-CU;"Bakır tel; 0,5 mm";Malzeme;kg;/);
    assert.match(copperLine, /;12,5;/);
    assert.match(copperLine, /;13,25$/);
  });
});
