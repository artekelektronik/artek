import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { priceAt, profitPctOf, unitCost } from "./quote-calc";

const rates = { USD: 40, EUR: 44, date: "15.11.2026" };

describe("Fiyat hesapla", () => {
  test("one unit costs its materials at today's rate plus işçilik", () => {
    const cost = unitCost(
      [
        { quantity: "2", price: "0.5", currency: "USD" }, // 2 ferrit × 0,5 USD × 40
        { quantity: "0.015", price: "600", currency: "TRY" }, // 15 g bakır at 600 TL/kg
      ],
      11,
      rates,
    );
    assert.equal(cost.material, 49);
    assert.equal(cost.total, 60);
    assert.equal(cost.missing, 0);
  });

  test("a material with no Alış fiyatı is reported, not counted as free", () => {
    const cost = unitCost([{ quantity: "1", price: null, currency: null }, { quantity: "1", price: "10", currency: "TRY" }], 0, rates);
    assert.equal(cost.missing, 1);
    assert.equal(cost.total, 10);
  });

  test("a foreign price without a rate is missing", () => {
    assert.equal(unitCost([{ quantity: "1", price: "1", currency: "USD" }], 0, null).missing, 1);
  });

  test("kâr is on top of cost, both ways", () => {
    assert.equal(priceAt(60, 40), 84);
    assert.equal(Math.round(profitPctOf(60, 84)!), 40);
    assert.equal(profitPctOf(0, 84), null);
  });
});
