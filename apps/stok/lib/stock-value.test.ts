import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRates } from "./exchange-rates";
import { displayPrice, parsePrice, stockSummary, type Price } from "./stock-value";

const rates = { USD: 50, EUR: 60, date: "02.11.2026" };
const row = (id: string, category: string, total: string, unit: "adet" | "kg" = "adet") => ({
  id,
  category,
  unit,
  stock: { a: { physical: total } },
  inTransit: "0",
  total,
});
const usd = (purchase: string | null, sale: string | null = null): Price => ({
  purchasePrice: purchase,
  purchaseCurrency: "USD",
  salePrice: sale,
  saleCurrency: "TRY",
});

test("prices are typed the Turkish or the plain way", () => {
  assert.equal(parsePrice("12,50"), "12.50");
  assert.equal(parsePrice("12.50"), "12.50");
  assert.equal(parsePrice("1.234,5"), "1234.5");
  assert.equal(parsePrice("  "), null);
  for (const bad of ["abc", "0", "-3", "1,23456"]) assert.throws(() => parsePrice(bad), bad);
});

test("a stored price shows without trailing zeros", () => {
  assert.equal(displayPrice("12.5000"), "12,5");
  assert.equal(displayPrice("100.0000"), "100");
  assert.equal(displayPrice("0.1250"), "0,125");
  assert.equal(displayPrice(null), "");
});

test("values convert to TL; products out of stock or without a price are not counted", () => {
  const prices = new Map([
    ["p1", usd("2", "150")],
    ["p2", usd("1")],
  ]);
  const { overall, categories } = stockSummary([row("p1", "Ferrit", "10"), row("p2", "Ferrit", "4", "kg"), row("p3", "Filtre", "7"), row("p4", "Filtre", "0")], ["a"], prices, rates);
  assert.equal(overall.products, 3);
  assert.equal(overall.purchase, 10 * 2 * 50 + 4 * 1 * 50);
  assert.equal(overall.sale, 1500);
  assert.equal(overall.purchaseCounted, 2);
  assert.equal(overall.saleCounted, 1);
  assert.equal(overall.margin, 1500 - 1000, "only the product with both prices");
  assert.deepEqual(overall.units.map((u) => [u.unit, u.total]), [["adet", "17"], ["kg", "4"]]);
  assert.deepEqual(categories.map((c) => [c.category, c.products]), [["Ferrit", 2], ["Filtre", 1]]);
});

test("stock is also valued at the A (Toptan) price, where one is set", () => {
  const prices = new Map<string, Price>([
    ["p1", { ...usd("2", "150"), salePriceA: "120" }],
    ["p2", usd("1", "30")],
  ]);
  const { overall } = stockSummary([row("p1", "Ferrit", "10"), row("p2", "Ferrit", "4")], ["a"], prices, rates);
  assert.deepEqual([overall.saleA, overall.saleACounted], [1200, 1]);
});

test("without rates only TL prices are counted", () => {
  const prices = new Map([["p1", usd("2", "150")]]);
  const { overall } = stockSummary([row("p1", "Ferrit", "10")], ["a"], prices, null);
  assert.equal(overall.purchase, 0);
  assert.equal(overall.purchaseCounted, 0);
  assert.equal(overall.sale, 1500);
});

test("the TCMB bulletin gives the döviz satış rate", () => {
  const xml = `<Tarih_Date Tarih="02.11.2026" Date="11/02/2026">
    <Currency Kod="USD" CurrencyCode="USD"><ForexBuying>49.88</ForexBuying><ForexSelling>49.97</ForexSelling></Currency>
    <Currency Kod="AUD" CurrencyCode="AUD"><ForexSelling>35.14</ForexSelling></Currency>
    <Currency Kod="EUR" CurrencyCode="EUR"><ForexSelling>58.10</ForexSelling></Currency></Tarih_Date>`;
  assert.deepEqual(parseRates(xml), { USD: 49.97, EUR: 58.1, date: "02.11.2026" });
  assert.equal(parseRates("<html>hata</html>"), null);
});
