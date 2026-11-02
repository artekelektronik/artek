import assert from "node:assert/strict";
import { test } from "node:test";
import { sortRows } from "./sorting";

const byName = (names: string[], desc = false) => sortRows(names.map((name) => ({ name })), [{ id: "name", desc }], (r) => r.name).map((r) => r.name);

test("numbers inside text sort as numbers, not letter by letter", () => {
  assert.deepEqual(byName(["EE 14", "EE 9", "EE 12", "EE 13"]), ["EE 9", "EE 12", "EE 13", "EE 14"]);
});

test("Turkish letters sort in the Turkish alphabet, ignoring case", () => {
  assert.deepEqual(byName(["Zeta", "çekirdek", "Cam", "Dolap"]), ["Cam", "çekirdek", "Dolap", "Zeta"]);
});

test("empty values stay last in both directions", () => {
  assert.deepEqual(byName(["", "B", "A"]), ["A", "B", ""]);
  assert.deepEqual(byName(["", "B", "A"], true), ["B", "A", ""]);
});

test("a later level breaks ties of the one before it", () => {
  const rows = [
    { kind: "Toroid", stock: 5 },
    { kind: "EE", stock: 1 },
    { kind: "Toroid", stock: 9 },
  ];
  const sorted = sortRows(rows, [{ id: "kind", desc: false }, { id: "stock", desc: true }], (r, id) => r[id as "kind" | "stock"]);
  assert.deepEqual(sorted.map((r) => r.stock), [1, 9, 5]);
});
