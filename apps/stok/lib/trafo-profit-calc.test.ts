import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { businessSplit, trafoProfit, type BuiltLine } from "./trafo-profit-calc";

const line = (over: Partial<BuiltLine>): BuiltLine => ({
  invoiceId: "inv1",
  number: "AAA1",
  issuedOn: "2026-11-06",
  isReturn: false,
  description: "FERRİT NÜVE",
  productId: "core",
  quantity: "10",
  stockQuantity: "10",
  amount: "1000",
  components: null,
  productLabel: "Ferrit",
  customer: "Yıldız",
  ...over,
});
const trafo = (over: Partial<BuiltLine>) =>
  line({ description: "BAKIR SARGILI TRAFO", productId: "trafo", productLabel: "Trafo A", quantity: "300", stockQuantity: null, amount: "27000", components: [{ productId: "core", quantity: "600" }, { productId: "bobbin", quantity: "300" }], ...over });
const prices = new Map([
  ["core", { price: "40", currency: "TRY" as const }],
  ["bobbin", { price: "5", currency: "TRY" as const }],
]);
const rates = () => ({ USD: 30, EUR: 33 });

describe("Trafo and Ticari mal apart", () => {
  test("a line built from Malzeme is trafo, a line sold from stock is Ticari mal, and they add up", () => {
    const split = businessSplit([line({}), trafo({})], prices, rates);
    assert.deepEqual(split.ticari, { sales: 1000, costedSales: 1000, cost: 400, gross: 600, uncostedSales: 0 });
    assert.deepEqual(split.trafo, { sales: 27000, costedSales: 27000, cost: 600 * 40 + 300 * 5, gross: 1500, uncostedSales: 0 });
  });
});

describe("Trafo kârlılığı", () => {
  test("a trafo's kâr is its sale minus materials and İşçilik, summed per model and per Müşteri", () => {
    const labor = new Map([["trafo", 2]]);
    const result = trafoProfit([trafo({}), trafo({ invoiceId: "inv2", customer: "Demir", quantity: "100", amount: "10000", components: [{ productId: "core", quantity: "200" }, { productId: "bobbin", quantity: "100" }] }), line({})], prices, labor, rates);
    assert.deepEqual(result.byProduct, [{ key: "trafo", label: "Trafo A", quantity: 400, sales: 37000, material: 34000, labor: 800, profit: 2200 }]);
    assert.deepEqual(result.byCustomer.map((r) => [r.label, r.profit]), [["Demir", 1300], ["Yıldız", 900]]);
  });

  test("a trafo whose materials have no Alış fiyatı is counted apart, never as free", () => {
    const result = trafoProfit([trafo({ components: [{ productId: "unknown", quantity: "1" }] })], prices, new Map(), rates);
    assert.equal(result.uncosted, 1);
    assert.equal(result.byProduct.length, 0);
  });
});
