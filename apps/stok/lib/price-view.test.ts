import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeSorts, encodeSorts, viewPrices, type PriceFacts, type PriceFilter } from "./price-view";

const row = (code: string, over: Partial<PriceFacts> = {}): PriceFacts => ({
  code,
  name: `Ürün ${code}`,
  category: "Ferrit",
  productType: "EE",
  search: code.toLocaleLowerCase("tr"),
  total: 0,
  quantities: {},
  hasPurchase: false,
  hasSale: false,
  ...over,
});
const all: PriceFilter = { price: "tumu", stock: "tumu", categories: [], types: [], lokasyon: [], q: "" };
const codes = (rows: PriceFacts[]) => rows.map((r) => r.code);

test("the first view: in stock, a price missing, most stock first", () => {
  const rows = [
    row("A", { total: 5, quantities: { k: 5 } }),
    row("B", { total: 50, quantities: { k: 50 }, hasPurchase: true }),
    row("C", { total: 500, quantities: { k: 500 }, hasPurchase: true, hasSale: true }),
    row("D"),
  ];
  assert.deepEqual(codes(viewPrices(rows, { ...all, price: "eksik", stock: "stokta" }, [{ id: "stok", desc: true }])), ["B", "A"]);
});

test("each price state picks its own rows", () => {
  const rows = [row("none"), row("buy", { hasPurchase: true }), row("sell", { hasSale: true }), row("both", { hasPurchase: true, hasSale: true })];
  assert.deepEqual(codes(viewPrices(rows, { ...all, price: "alis_eksik" }, [])), ["none", "sell"]);
  assert.deepEqual(codes(viewPrices(rows, { ...all, price: "satis_eksik" }, [])), ["none", "buy"]);
  assert.deepEqual(codes(viewPrices(rows, { ...all, price: "tamam" }, [])), ["both"]);
});

test("a picked Lokasyon narrows the list and is what stock sorts by", () => {
  const rows = [row("A", { total: 100, quantities: { k: 90, c: 10 } }), row("B", { total: 30, quantities: { k: 0, c: 30 } }), row("C", { total: 7, quantities: { k: 7 } })];
  assert.deepEqual(codes(viewPrices(rows, { ...all, lokasyon: ["c"] }, [{ id: "stok", desc: true }])), ["B", "A"]);
  assert.deepEqual(codes(viewPrices(rows, { ...all, lokasyon: ["c"], stock: "yok" }, [])), ["C"]);
});

test("category, type and search combine, and a product with no type can be picked", () => {
  const rows = [row("A", { category: "Karkas" }), row("B", { category: "Karkas", productType: null }), row("C")];
  assert.deepEqual(codes(viewPrices(rows, { ...all, categories: ["Karkas"], types: ["Tipsiz"] }, [])), ["B"]);
  assert.deepEqual(codes(viewPrices(rows, { ...all, q: " c " }, [])), ["C"]);
});

test("codes sort 9, 12, 13 rather than 12, 13, 9", () => {
  const rows = [row("EE13"), row("EE9"), row("EE12")];
  assert.deepEqual(codes(viewPrices(rows, all, [{ id: "kod", desc: false }])), ["EE9", "EE12", "EE13"]);
});

test("sorts survive the address bar", () => {
  const sorts = [{ id: "stok", desc: true }, { id: "ad", desc: false }];
  assert.equal(encodeSorts(sorts), "stok.azalan,ad.artan");
  assert.deepEqual(decodeSorts(encodeSorts(sorts)), sorts);
  assert.deepEqual(decodeSorts(""), []);
});
