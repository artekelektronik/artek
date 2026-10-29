import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { filterCustomers, filterInvoices, invoiceRange, invoiceTotals, lastBuyRange, type CustomerFilter } from "./list-filters";

const today = "2026-10-29";

describe("invoice filters", () => {
  const rows = [
    { issuedOn: "2026-10-02", number: "AAA2026000000101", customer: "AAA ELEKTRONİK", type: "SATIS", netAmount: "1000.00" },
    { issuedOn: "2026-08-15", number: "AAA2026000000090", customer: "BBB MAKİNA", type: "SATIS", netAmount: "500.00" },
    { issuedOn: "2026-08-20", number: "AAA2026000000091", customer: "BBB MAKİNA", type: "IADE", netAmount: "100.00" },
    { issuedOn: "2025-12-30", number: "AAA2025000000300", customer: "CCC TRAFO", type: "SATIS", netAmount: "250.00" },
  ];
  const numbers = (r: typeof rows) => r.map((x) => x.number.slice(-3));

  test("date presets", () => {
    assert.deepEqual(invoiceRange("bu_ay", today, {}), { from: "2026-10-01", to: today });
    assert.deepEqual(invoiceRange("son_3_ay", today, {}), { from: "2026-07-29", to: today });
    assert.deepEqual(invoiceRange("gecen_yil", today, {}), { from: "2025-01-01", to: "2025-12-31" });
    assert.deepEqual(invoiceRange("ozel", today, { from: "2026-08-01" }), { from: "2026-08-01" });
    assert.deepEqual(invoiceRange("tumu", today, { from: "2026-08-01" }), {});
  });

  test("date, search and type together; totals keep returns apart", () => {
    const thisYear = invoiceRange("bu_yil", today, {});
    assert.deepEqual(numbers(filterInvoices(rows, { range: thisYear, q: "", type: "tumu" })), ["101", "090", "091"]);
    assert.deepEqual(numbers(filterInvoices(rows, { range: {}, q: "bbb", type: "satis" })), ["090"]);
    assert.deepEqual(numbers(filterInvoices(rows, { range: {}, q: "0300", type: "tumu" })), ["300"]);
    assert.deepEqual(numbers(filterInvoices(rows, { range: {}, q: "", type: "iade" })), ["091"]);
    assert.deepEqual(invoiceTotals(filterInvoices(rows, { range: thisYear, q: "", type: "tumu" })), { sales: 1500, returns: 100 });
  });
});

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
