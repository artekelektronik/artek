import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// Made-up firms only.
const invoiceText = (n: number, taxId: string, name: string, date = "02-01-2025") => `Vergi Hariç Tutar: 1.000,00 TL
Vergiler Dahil Toplam Tutar: 1.200,00 TL
SAYIN
${name}
DENEME MAH. ÖRNEK SOK.
NO:1 ÜMRANİYE/ İSTANBUL
VKN: ${taxId}
ETTN: 00000000-0000-4000-8000-${String(n).padStart(12, "0")}
Tarih: ${date}
Fatura No: AAA2025${String(n).padStart(9, "0")}
Senaryo: TEMELFATURA
Fatura Tipi: SATIS
Sıra No Mal Hizmet Miktar Birim Fiyat Mal Hizmet Tutarı KDV Oranı KDV Tutarı
1 FERRİTNUVE(EE25) 10,0 Adet 100 TL 1.000,00 TL %20,00 200,00 TL
QNB FİNANSBANK`;

describe("Arşiv", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;
  const upload = async (n: number, taxId: string, name: string, date?: string) => {
    const { importInvoiceText } = await import("./invoices");
    return importInvoiceText(editor.headers, { fileName: `${n}.pdf`, sha256: `s${n}`, text: invoiceText(n, taxId, name, date) });
  };
  const invoiceNo = async (n: number) =>
    (await db.select().from(schema.invoice).where(eq(schema.invoice.number, `AAA2025${String(n).padStart(9, "0")}`)))[0];
  const actions = async () => (await db.select().from(schema.activityLog)).map((r) => [r.entity, r.action, r.detail]);

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    editor = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values([
      { userId: editor.user.id, panel: "musteri", level: "duzenler" },
      { userId: editor.user.id, panel: "finans", level: "duzenler" },
    ]);
    await upload(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ");
    await upload(2, "1111111111", "AAA ELEKTRONİK LTD ŞTİ");
    await upload(3, "1111111111", "AAA ELEKTRONİK LTD ŞTİ");
  });

  test("an archived invoice leaves the totals but not the number sequence; restoring brings it back", async () => {
    const { loadSalesSummary } = await import("./finance");
    const { archiveInvoice, restoreInvoice } = await import("./archive");
    const middle = await invoiceNo(2);
    assert.equal((await loadSalesSummary()).total, 3000);
    await assert.rejects(archiveInvoice(editor.headers, { id: middle.id, reason: "" }), /sebep/);
    await archiveInvoice(editor.headers, { id: middle.id, reason: "Yanlış yüklendi" });
    const after = await loadSalesSummary();
    assert.equal(after.total, 2000);
    assert.deepEqual(after.gaps, []);
    await restoreInvoice(editor.headers, middle.id);
    assert.equal((await loadSalesSummary()).total, 3000);
    assert.ok((await actions()).some(([e, a, d]) => e === "fatura" && a === "arsivlendi" && d === "Yanlış yüklendi"));
  });

  test("uploading an archived invoice again restores it", async () => {
    const { archiveInvoice } = await import("./archive");
    const first = await invoiceNo(1);
    await archiveInvoice(editor.headers, { id: first.id, reason: "Deneme" });
    const result = await upload(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ");
    assert.equal(result.status, "eklendi");
    assert.equal((await invoiceNo(1)).archivedAt, null);
    assert.ok((await actions()).some(([e, a, d]) => e === "fatura" && a === "geri_alindi" && d === "Aynı fatura tekrar yüklendi"));
  });

  test("an archived Müşteri is not picked, its open suggestions close, and a new invoice brings it back", async () => {
    const { archiveCustomer } = await import("./archive");
    const { pickCustomers } = await import("./assistant");
    const { followUpsDue } = await import("./crm");
    const [c] = await db.select().from(schema.customer);
    await db.update(schema.customer).set({ nextFollowUpOn: "2025-06-02", followUpChannel: "telefon", phone: "0212" });
    await db.insert(schema.assistantSuggestion).values({ customerId: c.id, forDay: "2025-06-01", kind: "arama", reason: "Deneme" });

    await archiveCustomer(editor.headers, { id: c.id, reason: "Firma kapandı" });
    assert.equal((await pickCustomers("2025-06-02")).length, 0);
    assert.equal((await followUpsDue("2025-06-02")).length, 0);
    const [s] = await db.select().from(schema.assistantSuggestion);
    assert.equal(s.status, "atlandi");

    await upload(4, "1111111111", "AAA ELEKTRONİK LTD ŞTİ", "05-02-2025");
    const [back] = await db.select().from(schema.customer);
    assert.equal(back.archivedAt, null);
    assert.ok((await actions()).some(([e, a, d]) => e === "musteri" && a === "geri_alindi" && d === "Yeni fatura geldi: AAA2025000000004"));
  });

  test("an archived Aday named again by a routine is marked seen but stays archived", async () => {
    const { archiveLead, restoreLead } = await import("./archive");
    const { importLeads } = await import("./leads");
    await importLeads({ rapor: "Radar 1", adaylar: [{ firma: "ZZZ Enerji" }] }, { userId: null });
    const [l] = await db.select().from(schema.lead);
    await archiveLead(editor.headers, { id: l.id, reason: "Uygun değil" });
    await importLeads({ rapor: "Radar 2", adaylar: [{ firma: "ZZZ Enerji" }] }, { userId: null });
    const [again] = await db.select().from(schema.lead);
    assert.equal(again.seenCount, 2);
    assert.ok(again.archivedAt);
    await restoreLead(editor.headers, l.id);
    assert.equal((await db.select().from(schema.lead))[0].archivedAt, null);
  });
});
