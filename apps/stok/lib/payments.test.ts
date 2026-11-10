import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("Tahsilat", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let payments: typeof import("./payments");
  let invoices: typeof import("./invoices");
  let admin: Awaited<ReturnType<typeof signedInAs>>;
  const sale = (over: Partial<Parameters<typeof import("./invoices").createManualInvoice>[1]> = {}) => ({
    number: "",
    issuedOn: "2026-11-05",
    type: "SATIS" as const,
    scenario: "TEMELFATURA" as const,
    kdvRate: 20,
    proforma: true,
    customerId: null,
    buyer: { name: "ÖRNEK FİRMA", taxId: "5555555555" },
    lines: [{ description: "KARGO", quantity: "1", unit: "Adet", unitPrice: "1000", productId: null }],
    ...over,
  });

  before(async () => {
    db = await openTestDatabase();
    payments = await import("./payments");
    invoices = await import("./invoices");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    admin = await signedInAs(["admin"]);
    const schema = await import("../db/schema");
    await db.insert(schema.userPanel).values({ userId: admin.user.id, panel: "finans", level: "duzenler" });
  });
  after(() => db.$client.end());

  const stateOf = async (id: string) => (await payments.listCollections(admin.headers)).find((r) => r.id === id)?.state;

  test("payments add up to the KDV-dahil total; more than what is owed is refused", async () => {
    const id = await invoices.createManualInvoice(admin.headers, sale());
    assert.equal(await stateOf(id), "bekliyor");
    await payments.addPayment(admin.headers, id, { paidOn: "2026-11-06", amount: "500", method: "nakit", note: "" });
    assert.equal(await stateOf(id), "kismi");
    await assert.rejects(payments.addPayment(admin.headers, id, { paidOn: "2026-11-07", amount: "800", method: "havale", note: "" }), /fazla/);
    await payments.addPayment(admin.headers, id, { paidOn: "2026-11-07", amount: "700", method: "havale", note: "" });
    assert.equal(await stateOf(id), "odendi");
  });

  test("a sale before payment tracking began counts as paid", async () => {
    const id = await invoices.createManualInvoice(admin.headers, sale({ issuedOn: "2026-10-20" }));
    assert.equal(await stateOf(id), "odendi");
  });

  test("a deleted payment is owed again", async () => {
    const id = await invoices.createManualInvoice(admin.headers, sale());
    const paymentId = await payments.addPayment(admin.headers, id, { paidOn: "2026-11-06", amount: "1200", method: "nakit", note: "" });
    await payments.deletePayment(admin.headers, paymentId);
    assert.equal(await stateOf(id), "bekliyor");
  });

  test("a delivered proforma that was never invoiced counts as a faturasız sale of its year", async () => {
    const id = await invoices.createManualInvoice(admin.headers, sale({ kdvRate: 0 }));
    await invoices.createManualInvoice(admin.headers, sale({ kdvRate: 0 }));
    assert.equal(await payments.unInvoicedSales(admin.headers, "2026"), 0, "not delivered yet");
    await invoices.confirmInvoice(admin.headers, { id, customerId: "yeni", lokasyonId: null, lines: [{ seq: 1, productId: null, stockQuantity: null }] });
    assert.equal(await payments.unInvoicedSales(admin.headers, "2026"), 1000);
  });

  test("only the Finans paneli sees or records payments", async () => {
    const id = await invoices.createManualInvoice(admin.headers, sale());
    const plain = await signedInAs(["admin"]);
    await assert.rejects(payments.addPayment(plain.headers, id, { paidOn: "2026-11-06", amount: "1", method: "nakit", note: "" }));
    await assert.rejects(payments.listCollections(plain.headers));
  });
});
