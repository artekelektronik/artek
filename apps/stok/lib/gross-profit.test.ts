import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { monthlyGrossProfit, monthlyNet, type MonthProfit, type SoldLine } from "./gross-profit-calc";
import { importAndConfirm, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

const line = (over: Partial<SoldLine>): SoldLine => ({
  invoiceId: "inv1",
  number: "AAA1",
  issuedOn: "2026-10-05",
  isReturn: false,
  description: "FERRİT NÜVE",
  productId: "core",
  quantity: "10",
  stockQuantity: "10",
  amount: "1000",
  components: null,
  ...over,
});
const prices = new Map([
  ["core", { price: "40", currency: "TRY" as const }],
  ["usdCore", { price: "2", currency: "USD" as const }],
  ["wire", { price: "100", currency: "TRY" as const }],
  ["bobbin", { price: "5", currency: "TRY" as const }],
]);
const rates = () => ({ USD: 30, EUR: 33 });

describe("monthly Brüt kâr", () => {
  test("a stocked line costs quantity × Alış fiyatı", () => {
    const [m] = monthlyGrossProfit([line({})], prices, rates).months;
    assert.deepEqual(m, { month: "2026-10", sales: 1000, costedSales: 1000, cost: 400, gross: 600, uncostedSales: 0 });
  });

  test("a foreign-currency price is converted at the invoice date's rate", () => {
    const [m] = monthlyGrossProfit([line({ productId: "usdCore" })], prices, rates).months;
    assert.equal(m.cost, 600, "10 × 2 USD × 30");
  });

  test("a line built from materials costs its materials, not the trafo", () => {
    const built = line({ productId: "trafo", stockQuantity: null, components: [{ productId: "wire", quantity: "2.5" }, { productId: "bobbin", quantity: "10" }] });
    const [m] = monthlyGrossProfit([built], prices, rates).months;
    assert.equal(m.cost, 300, "2,5 × 100 + 10 × 5");
  });

  test("an İade lowers both sales and cost", () => {
    const { months } = monthlyGrossProfit([line({}), line({ number: "AAA2", isReturn: true, amount: "200", quantity: "2", stockQuantity: "2" })], prices, rates);
    assert.deepEqual([months[0].sales, months[0].cost, months[0].gross], [800, 320, 480]);
  });

  test("a line without a product or a price is left out of cost and listed, never counted as free", () => {
    const { months, uncosted } = monthlyGrossProfit(
      [line({}), line({ number: "AAA3", productId: null, amount: "150", description: "KARGO" }), line({ number: "AAA4", productId: "noPrice", amount: "250" })],
      prices,
      rates,
    );
    assert.deepEqual(months[0], { month: "2026-10", sales: 1400, costedSales: 1000, cost: 400, gross: 600, uncostedSales: 400 });
    assert.deepEqual(
      uncosted.map((u) => [u.number, u.reason]),
      [
        ["AAA3", "Katalogda yok"],
        ["AAA4", "Alış fiyatı yok"],
      ],
    );
  });

  test("months are kept apart and in order", () => {
    const { months } = monthlyGrossProfit([line({ issuedOn: "2026-11-02" }), line({})], prices, rates);
    assert.deepEqual(months.map((m) => m.month), ["2026-10", "2026-11"]);
  });
});

describe("Brüt kâr from confirmed invoices", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(() => resetTestDatabase());

  test("only Finans holders get it, built from confirmed invoices and the products' Alış fiyatı", async () => {
    const { Forbidden } = await import("./guard");
    const { grossProfit } = await import("./gross-profit");
    const admin = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: admin.user.id, panel: "finans", level: "duzenler" });
    await importAndConfirm(admin.headers, {
      fileName: "a.pdf",
      sha256: "s",
      text: `Vergi Hariç Tutar: 1.000,00 TL
Vergiler Dahil Toplam Tutar: 1.200,00 TL
SAYIN
ÖRNEK ELEKTRONİK LİMİTED ŞİRKETİ
NO:1 ÜMRANİYE/ İSTANBUL
VKN: 1234567890
ETTN: 00000000-0000-4000-8000-000000000001
Tarih: 05-10-2026
Fatura No: AAA2026000000001
Senaryo: TEMELFATURA
Fatura Tipi: SATIS
Sıra No Mal Hizmet Miktar Birim Fiyat Mal Hizmet Tutarı KDV Oranı KDV Tutarı
1 KARGO 10,0 Adet 100 TL 1.000,00 TL %20,00 200,00 TL
QNB FİNANSBANK`,
    });
    const result = await grossProfit(admin.headers);
    assert.deepEqual(result.months.map((m) => [m.month, m.sales, m.uncostedSales]), [["2026-10", 1000, 1000]], "a line with no Ürün has no cost");
    const crmOnly = await signedInAs(["admin"]);
    await assert.rejects(grossProfit(crmOnly.headers), Forbidden);
  });
});

describe("monthly Net", () => {
  const month = (over: Partial<MonthProfit>): MonthProfit => ({ month: "2026-10", sales: 10000, costedSales: 10000, cost: 6000, gross: 4000, uncostedSales: 0, ...over });
  const spent = (spentOn: string, category: string, netAmount: string, totalAmount = String(Number(netAmount) * 1.2)) => ({ spentOn, category, netAmount, totalAmount });

  test("Net is Brüt kâr minus the month's Giderler, broken down by category", () => {
    const { months } = monthlyNet([month({})], [spent("2026-10-01", "Kira", "1500"), spent("2026-10-05", "Maaş", "2000"), spent("2026-10-20", "Kira", "500")]);
    assert.deepEqual(months[0], {
      ...month({}),
      expenses: 4000,
      expensesWithKdv: 4800,
      byCategory: { Kira: 2000, Maaş: 2000 },
      net: 0,
      incomplete: false,
    });
  });

  test("a month with only expenses still appears, and months are in order", () => {
    const { months } = monthlyNet([month({ month: "2026-10" })], [spent("2026-09-01", "Kira", "1000")]);
    assert.deepEqual(
      months.map((m) => [m.month, m.sales, m.expenses, m.net]),
      [
        ["2026-09", 0, 1000, -1000],
        ["2026-10", 10000, 0, 4000],
      ],
    );
  });

  test("a month with sales of unknown cost is flagged as incomplete", () => {
    const { months } = monthlyNet([month({ uncostedSales: 300 })], []);
    assert.equal(months[0].incomplete, true);
  });

  test("a year sums its months", () => {
    const { years } = monthlyNet([month({}), month({ month: "2026-11", gross: 1000, sales: 2000, costedSales: 2000, cost: 1000 })], [spent("2026-11-01", "Kira", "1500")]);
    assert.deepEqual(years, [{ year: "2026", sales: 12000, costedSales: 12000, gross: 5000, uncostedSales: 0, expenses: 1500, expensesWithKdv: 1800, net: 3500, byCategory: { Kira: 1500 } }]);
  });
});
