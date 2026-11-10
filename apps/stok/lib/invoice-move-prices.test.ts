import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { priceInvoiceMoves, type InvoiceLineSold, type InvoiceMove } from "./invoice-move-prices";

const line = (over: Partial<InvoiceLineSold>): InvoiceLineSold => ({
  invoiceId: "inv1",
  documentId: "doc1",
  seq: 1,
  issuedOn: "2026-11-06",
  productId: "core",
  quantity: "20",
  stockQuantity: "20",
  amount: "2000",
  components: null,
  ...over,
});
const move = (over: Partial<InvoiceMove>): InvoiceMove => ({ id: "m1", documentId: "doc1", type: "satis_teslimati", productId: "core", quantity: "-20", ...over });

describe("stock-outs priced from their invoice", () => {
  test("a sold line's stock-out shows what one unit and the whole line sold for", () => {
    const prices = priceInvoiceMoves([move({})], [line({})]);
    assert.deepEqual(prices.get("m1"), { key: "inv1:1", unit: 100, total: 2000, on: "2026-11-06" });
  });

  test("two lines of the same product are told apart by quantity", () => {
    const prices = priceInvoiceMoves(
      [move({ id: "a", quantity: "-5" }), move({ id: "b", quantity: "-20" })],
      [line({ seq: 1, quantity: "20", stockQuantity: "20", amount: "2000" }), line({ seq: 2, quantity: "5", stockQuantity: "5", amount: "600" })],
    );
    assert.equal(prices.get("a")?.total, 600);
    assert.equal(prices.get("b")?.total, 2000);
  });

  test("materials used for a built line show that line's price, under one key so it is counted once", () => {
    const built = line({ seq: 3, productId: "trafo", quantity: "300", stockQuantity: null, amount: "45000", components: [{ productId: "core", quantity: "600" }, { productId: "bobbin", quantity: "300" }] });
    const prices = priceInvoiceMoves([move({ id: "c", type: "uretim_tuketimi", quantity: "-600" }), move({ id: "d", type: "uretim_tuketimi", productId: "bobbin", quantity: "-300" })], [built]);
    assert.deepEqual(prices.get("c"), { key: "inv1:3", unit: 150, total: 45000, on: "2026-11-06" });
    assert.equal(prices.get("d")?.key, "inv1:3");
  });

  test("a movement of another document, or with no matching line, gets no price", () => {
    const prices = priceInvoiceMoves([move({ id: "x", documentId: "other" }), move({ id: "y", quantity: "-7" })], [line({})]);
    assert.equal(prices.size, 0);
  });
});
