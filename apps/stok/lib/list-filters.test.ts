import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { filterCustomers, lastBuyRange, type CustomerFilter } from "./list-filters";

const today = "2026-10-29";

describe("customer filters", () => {
  const base = { status: "aranacak", followUpChannel: "telefon", city: "İSTANBUL", groups: ["Ferrit"], phone: null, email: null };
  const rows = [
    { ...base, id: "a", lastOn: "2026-10-01", phone: "0212" },
    { ...base, id: "b", lastOn: "2026-02-10", city: "KOCAELİ", groups: ["Toroid"], email: "b@ornek.example", followUpChannel: "eposta" },
    { ...base, id: "c", lastOn: "2025-06-01", status: "kapandi" },
  ];
  const none: CustomerFilter = { lastBuy: {}, status: "", channel: "", city: "", group: "", contact: "tumu" };
  const ids = (f: Partial<CustomerFilter>) => filterCustomers(rows, { ...none, ...f }).map((r) => r.id);

  test("last purchase: recent buyers, and those who stopped buying", () => {
    assert.deepEqual(ids({ lastBuy: lastBuyRange("son_3_ay", today, {}) }), ["a"]);
    assert.deepEqual(ids({ lastBuy: lastBuyRange("6_ay_yok", today, {}) }), ["b", "c"]);
    assert.deepEqual(ids({ lastBuy: lastBuyRange("1_yil_yok", today, {}) }), ["c"]);
    assert.deepEqual(ids({ lastBuy: lastBuyRange("ozel", today, { from: "2026-01-01", to: "2026-03-01" }) }), ["b"]);
  });

  test("status, channel, city, product group and contact", () => {
    assert.deepEqual(ids({ status: "kapandi" }), ["c"]);
    assert.deepEqual(ids({ channel: "eposta" }), ["b"]);
    assert.deepEqual(ids({ city: "KOCAELİ" }), ["b"]);
    assert.deepEqual(ids({ group: "Ferrit" }), ["a", "c"]);
    assert.deepEqual(ids({ contact: "var" }), ["a", "b"]);
    assert.deepEqual(ids({ contact: "eposta" }), ["b"]);
    assert.deepEqual(ids({ contact: "yok" }), ["c"]);
  });
});
