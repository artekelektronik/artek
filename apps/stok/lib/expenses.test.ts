import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("Giderler", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let expenses: typeof import("./expenses");
  let editor: Awaited<ReturnType<typeof signedInAs>>;

  async function adminWith(finans?: "gorur" | "duzenler") {
    const signed = await signedInAs(["admin"]);
    if (finans) await db.insert(schema.userPanel).values({ userId: signed.user.id, panel: "finans", level: finans });
    return signed;
  }
  const rent = { spentOn: "2026-10-01", category: "Kira", description: "Ekim kirası", party: "Mal sahibi", netAmount: "20000", kdvRate: "20" };

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    expenses = await import("./expenses");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    editor = await adminWith("duzenler");
  });

  test("a Finans editor records an expense; KDV dahil follows the rate", async () => {
    await expenses.createExpense(editor.headers, rent);
    const [row] = await expenses.listExpenses(editor.headers);
    assert.deepEqual([row.spentOn, row.category, row.party, row.netAmount, row.totalAmount], ["2026-10-01", "Kira", "Mal sahibi", "20000.00", "24000.00"]);
  });

  test("a viewer can read but not change; without the Finans paneli nothing", async () => {
    const { Forbidden } = await import("./guard");
    const { id } = await expenses.createExpense(editor.headers, rent);
    const viewer = await adminWith("gorur");
    assert.equal((await expenses.listExpenses(viewer.headers)).length, 1);
    await assert.rejects(expenses.createExpense(viewer.headers, rent), Forbidden);
    await assert.rejects(expenses.deleteExpense(viewer.headers, id), Forbidden);
    const plain = await adminWith();
    await assert.rejects(expenses.listExpenses(plain.headers), Forbidden);
  });

  test("editing and deleting work and every change is in İşlem geçmişi", async () => {
    const { id } = await expenses.createExpense(editor.headers, rent);
    await expenses.updateExpense(editor.headers, id, { ...rent, netAmount: "21000,50", kdvRate: "0" });
    const [edited] = await expenses.listExpenses(editor.headers);
    assert.deepEqual([edited.netAmount, edited.totalAmount], ["21000.50", "21000.50"]);
    await expenses.deleteExpense(editor.headers, id);
    assert.equal((await expenses.listExpenses(editor.headers)).length, 0);
    const log = await db.select().from(schema.activityLog);
    assert.deepEqual(log.map((l) => [l.entity, l.action, l.userId]).sort(), [
      ["gider", "duzenlendi", editor.user.id],
      ["gider", "eklendi", editor.user.id],
      ["gider", "silindi", editor.user.id],
    ]);
  });

  test("a receipt is kept with the expense and served only to Finans holders", async () => {
    const { Forbidden } = await import("./guard");
    const { id } = await expenses.createExpense(editor.headers, rent);
    await expenses.attachExpenseFile(editor.headers, id, { fileName: "kira.pdf", contentType: "application/pdf", bytes: new Uint8Array([1, 2, 3]) });
    const [row] = await expenses.listExpenses(editor.headers);
    assert.equal(row.fileName, "kira.pdf");
    assert.deepEqual([...(await expenses.expenseFile(editor.headers, id))!.bytes], [1, 2, 3]);
    await assert.rejects(expenses.expenseFile((await adminWith()).headers, id), Forbidden);
  });

  test("a bad amount or missing category is refused with a message", async () => {
    await assert.rejects(expenses.createExpense(editor.headers, { ...rent, netAmount: "0" }), /Tutar/);
    await assert.rejects(expenses.createExpense(editor.headers, { ...rent, category: " " }), /Kategori/);
  });

  test("Gider rows in İşlem geçmişi are only for Finans holders; a receipt is logged too", async () => {
    const { listActivity } = await import("./activity");
    const { id } = await expenses.createExpense(editor.headers, rent);
    await expenses.attachExpenseFile(editor.headers, id, { fileName: "kira.pdf", contentType: "application/pdf", bytes: new Uint8Array([1]) });
    const seen = (await listActivity(editor.headers)).filter((r) => r.entity === "gider");
    assert.deepEqual(seen.map((r) => r.detail).sort(), ["2026-10-01", "Fiş eklendi: kira.pdf"]);
    const crmOnly = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: crmOnly.user.id, panel: "musteri", level: "gorur" });
    assert.equal((await listActivity(crmOnly.headers)).filter((r) => r.entity === "gider").length, 0);
  });

  test("the KDV rate is kept as typed and amounts in Turkish format are read right", async () => {
    await expenses.createExpense(editor.headers, { ...rent, netAmount: "20.000,50", kdvRate: "18" });
    const [row] = await expenses.listExpenses(editor.headers);
    assert.deepEqual([row.netAmount, row.kdvRate, row.totalAmount], ["20000.50", "18.00", "23600.59"]);
    await assert.rejects(expenses.createExpense(editor.headers, { ...rent, netAmount: "1234567890123" }), /çok büyük/);
  });
});
