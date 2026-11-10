import assert from "node:assert/strict";
import { test } from "node:test";
import { kdvRateLabel } from "./finance-calc";

test("an invoice's KDV rate is read from its totals; mixed rates are called karma", () => {
  assert.equal(kdvRateLabel(1000, 1200), "%20");
  assert.equal(kdvRateLabel(1000, 1000), "%0");
  assert.equal(kdvRateLabel(452.5, 457.03), "%1");
  assert.equal(kdvRateLabel(1000, 1150), "karma");
  assert.equal(kdvRateLabel(0, 0), "—");
});
