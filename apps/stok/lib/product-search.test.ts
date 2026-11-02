import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { categoriesOf, searchProducts } from "./product-search";

const p = (code: string, name: string, category = "Ferrit", manufacturerCode: string | null = null, productType: string | null = null) => ({
  id: code,
  code,
  name,
  category,
  manufacturerCode,
  productType,
});

const catalog = [
  p("ART-0040", "EE 110 / 56 / 36 -CF139"),
  p("ART-0026", "EE 13 9 / 6.5 - CF139"),
  p("ART-0030", "EE 25 / 13 / 7 - CF139", "Ferrit", "E25-7"),
  p("ART-0045", "T 18 / 11 / 8 - CF139"),
  p("ART-0046", "T 18 / 11 / 10 - CF139"),
  p("ART-0061", "T 80 - 26", "IRON-POWDER"),
  p("ART-0007", "Yuvarlak Plastik Kablo Çekirdekleri 10mm", "PEM"),
];
const codes = (result: { items: { code: string }[] }) => result.items.map((item) => item.code);

describe("product search", () => {
  test("an exact code is found whatever its case or punctuation, and comes first", () => {
    for (const query of ["ART-0040", "art0040", "art 0040"]) {
      const result = searchProducts(catalog, query);
      assert.equal(result.kind, "exact");
      assert.equal(result.items[0].code, "ART-0040");
    }
  });

  test("the number alone is enough for an exact code", () => {
    for (const query of ["40", "0040"]) {
      const result = searchProducts(catalog, query);
      assert.equal(result.kind, "exact");
      assert.equal(result.items[0].code, "ART-0040");
    }
  });

  test("an exact manufacturer code is found", () => {
    const result = searchProducts(catalog, "e25-7");
    assert.equal(result.kind, "exact");
    assert.equal(result.items[0].code, "ART-0030");
  });

  test("names match without their spaces and slashes", () => {
    assert.deepEqual(codes(searchProducts(catalog, "ee110")), ["ART-0040"]);
    assert.deepEqual(codes(searchProducts(catalog, "T 18/11")), ["ART-0045", "ART-0046"]);
    assert.deepEqual(codes(searchProducts(catalog, "t181110")), ["ART-0046"]);
  });

  test("the words may come in any order", () => {
    assert.equal(searchProducts(catalog, "cf139 ee 25").items[0].code, "ART-0030");
  });

  test("each word has to sit within one word of the name", () => {
    const uu = [p("ART-0089", "UU 101 / 76 / 30")];
    assert.equal(searchProducts(uu, "uu 17").kind, "similar");
    assert.equal(searchProducts(uu, "uu 76 30").kind, "matches");
  });

  test("the category and the product type can be typed too", () => {
    const core = [p("ART-0061", "T 80 - 26", "IRON-POWDER", null, "TOROID")];
    assert.deepEqual(codes(searchProducts(core, "iron")), ["ART-0061"]);
    assert.deepEqual(codes(searchProducts(core, "toroid 80")), ["ART-0061"]);
  });

  test("Turkish letters and plain letters match each other", () => {
    assert.deepEqual(codes(searchProducts(catalog, "cekirdek")), ["ART-0007"]);
    assert.deepEqual(codes(searchProducts(catalog, "ÇEKİRDEK")), ["ART-0007"]);
    const iron = [p("ART-0100", "IRON POWDER 10")];
    assert.deepEqual(codes(searchProducts(iron, "iron")), ["ART-0100"]);
  });

  test("odd spaces from imported names don't block a match", () => {
    const filter = [p("ART-0003", "6 A EMI Filter")];
    assert.deepEqual(codes(searchProducts(filter, "6 a emi")), ["ART-0003"]);
  });

  test("a code that doesn't exist offers the closest products", () => {
    const result = searchProducts(catalog, "EE 26");
    assert.equal(result.kind, "similar");
    assert.equal(result.items[0].code, "ART-0030");
    assert.ok(codes(result).every((code) => code !== "ART-0007"));
    assert.equal(searchProducts(catalog, "ART-0041").kind, "similar");
    assert.equal(searchProducts(catalog, "ART-0041").items[0].code.startsWith("ART-00"), true);
  });

  test("nothing close at all says so", () => {
    const result = searchProducts(catalog, "qqqqqq");
    assert.equal(result.kind, "none");
    assert.deepEqual(result.items, []);
  });

  test("a category narrows the list, also with nothing typed", () => {
    assert.deepEqual(codes(searchProducts(catalog, "", { category: "IRON-POWDER" })), ["ART-0061"]);
    assert.equal(searchProducts(catalog, "").items.length, catalog.length);
    assert.equal(searchProducts(catalog, "").kind, "all");
  });

  test("a product in another category is still found, and flagged as such", () => {
    const result = searchProducts(catalog, "T 80", { category: "PEM" });
    assert.equal(result.kind, "other-category");
    assert.deepEqual(codes(result), ["ART-0061"]);
  });

  test("products in stock come before empty ones, but never above an exact match", () => {
    const available = { "ART-0046": "5" };
    assert.deepEqual(codes(searchProducts(catalog, "t 18", { available })), ["ART-0046", "ART-0045"]);
    assert.equal(searchProducts(catalog, "", { available }).items[0].code, "ART-0046");
    assert.equal(searchProducts(catalog, "ART-0045", { available }).items[0].code, "ART-0045");
  });

  test("categories list with their counts", () => {
    assert.deepEqual(categoriesOf(catalog), [
      { name: "Ferrit", count: 5 },
      { name: "IRON-POWDER", count: 1 },
      { name: "PEM", count: 1 },
    ]);
  });
});
