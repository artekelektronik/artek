import assert from "node:assert/strict";
import { test } from "node:test";
import { kdvRateLabel, manualTotals } from "./finance-calc";

test("an invoice's KDV rate is read from its totals; mixed rates are called karma", () => {
  assert.equal(kdvRateLabel(1000, 1200), "%20");
  assert.equal(kdvRateLabel(1000, 1000), "%0");
  assert.equal(kdvRateLabel(452.5, 457.03), "%1");
  assert.equal(kdvRateLabel(1000, 1150), "karma");
  assert.equal(kdvRateLabel(0, 0), "—");
});

test("a manual invoice typed with or without KDV gives the same net lines and totals", () => {
  assert.deepEqual(manualTotals([{ quantity: 10, unitPrice: 120 }], 20, true), { amounts: [1000], net: 1000, total: 1200 });
  assert.deepEqual(manualTotals([{ quantity: 10, unitPrice: 100 }], 20, false), { amounts: [1000], net: 1000, total: 1200 });
  assert.deepEqual(manualTotals([{ quantity: 10, unitPrice: 100 }], 0, false), { amounts: [1000], net: 1000, total: 1000 });
});
