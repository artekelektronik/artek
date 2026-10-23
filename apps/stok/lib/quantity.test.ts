import assert from "node:assert/strict";
import { test } from "node:test";
import { parseQuantity, parseQuantityOrZero } from "./quantity";

test("adet, takım and rulo accept whole numbers only", () => {
  for (const unit of ["adet", "takim", "rulo"] as const) {
    assert.deepEqual(parseQuantity("12", unit), { ok: true, value: "12" }, unit);
    assert.equal(parseQuantity("1.5", unit).ok, false, unit);
    assert.equal(parseQuantity("1,5", unit).ok, false, unit);
  }
});

test("kg and metre accept up to 3 decimals, with a comma or a dot", () => {
  for (const unit of ["kg", "metre"] as const) {
    assert.deepEqual(parseQuantity("1,5", unit), { ok: true, value: "1.5" }, unit);
    assert.deepEqual(parseQuantity("0.125", unit), { ok: true, value: "0.125" }, unit);
    assert.equal(parseQuantity("0,1234", unit).ok, false, unit);
  }
});

test("quantities must be positive numbers", () => {
  for (const raw of ["0", "-3", "", "abc", "1e3", "1.2.3"]) {
    assert.equal(parseQuantity(raw, "kg").ok, false, JSON.stringify(raw));
  }
});

test("zero is accepted where it means nothing there, in any spelling", () => {
  for (const raw of ["0", "0,0", "0.000", "00"]) assert.deepEqual(parseQuantityOrZero(raw, "adet"), { ok: true, value: "0" }, raw);
  assert.deepEqual(parseQuantityOrZero("2,5", "kg"), { ok: true, value: "2.5" });
  assert.equal(parseQuantityOrZero("-1", "kg").ok, false);
});

test("errors are in Turkish", () => {
  const result = parseQuantity("1,5", "adet");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /tam sayı/);
});
