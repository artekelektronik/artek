import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// Made-up firms only.
const invoiceText = (n: number, taxId: string, name: string) => `Vergi Hariç Tutar: 1.000,00 TL
Vergiler Dahil Toplam Tutar: 1.200,00 TL
SAYIN
${name}
DENEME MAH. ÖRNEK SOK.
NO:1 ÜMRANİYE/ İSTANBUL
VKN: ${taxId}
ETTN: 00000000-0000-4000-8000-${String(n).padStart(12, "0")}
Tarih: 02-01-2025
Fatura No: AAA2025${String(n).padStart(9, "0")}
Senaryo: TEMELFATURA
Fatura Tipi: SATIS
Sıra No Mal Hizmet Miktar Birim Fiyat Mal Hizmet Tutarı KDV Oranı KDV Tutarı
1 FERRİTNUVE(EE25) 10,0 Adet 100 TL 1.000,00 TL %20,00 200,00 TL
QNB FİNANSBANK`;

describe("İşlem geçmişi", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;
  const log = async () => db.select().from(schema.activityLog);

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
  });

  test("an uploaded invoice logs the invoice and, the first time, its new Müşteri; a repeat logs nothing", async () => {
    const { importInvoiceText } = await import("./invoices");
    await importInvoiceText(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importInvoiceText(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importInvoiceText(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    const rows = await log();
    assert.deepEqual(
      rows.map((r) => [r.entity, r.action, r.detail, r.userId]).sort(),
      [
        ["fatura", "eklendi", "a.pdf", editor.user.id],
        ["fatura", "eklendi", "b.pdf", editor.user.id],
        ["musteri", "eklendi", "İlk faturasıyla", editor.user.id],
      ],
    );
  });

  test("hand edits, firm links and Aday work are logged with who did them", async () => {
    const { importInvoiceText } = await import("./invoices");
    const { updateCustomer } = await import("./crm");
    const { addLink } = await import("./firm-links");
    const { importLeads, updateLead } = await import("./leads");
    await importInvoiceText(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importInvoiceText(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "2222222222", "BBB MAKİNA A.Ş") });
    const [a, b] = await db.select().from(schema.customer).orderBy(schema.customer.name);
    await db.delete(schema.activityLog);

    await updateCustomer(editor.headers, { id: a.id, phone: "0212 000 00 00", email: "", website: "", about: "", contactSource: "", status: "arandi", nextFollowUpOn: "", followUpChannel: "telefon" });
    await addLink(editor.headers, { fromId: a.id, toId: b.id, type: "birlikte_calisiyor" });
    await importLeads({ rapor: "Radar", adaylar: [{ firma: "CCC Enerji" }] }, { userId: null });
    const [l] = await db.select().from(schema.lead);
    await updateLead(editor.headers, { id: l.id, status: "ulasildi", note: "Yazdım." });

    const rows = await log();
    const find = (entity: string, detail: string) => rows.find((r) => r.entity === entity && r.detail === detail);
    assert.equal(find("musteri", "Elle: Telefon, Durum")?.userId, editor.user.id);
    assert.equal(rows.filter((r) => r.detail?.startsWith("Bağlantı eklendi")).length, 2);
    assert.equal(find("aday", "Radar")?.via, "rutin");
    assert.equal(find("aday", "Yeni → Ulaşıldı, not eklendi")?.userId, editor.user.id);
  });

  test("the page shows invoice rows only to people who may see Faturalar", async () => {
    const { importInvoiceText } = await import("./invoices");
    const { listActivity } = await import("./activity");
    await importInvoiceText(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    const crmOnly = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: crmOnly.user.id, panel: "musteri", level: "gorur" });
    assert.deepEqual((await listActivity(editor.headers)).map((r) => r.entity).sort(), ["fatura", "musteri"]);
    assert.deepEqual((await listActivity(crmOnly.headers)).map((r) => r.entity), ["musteri"]);
  });
});
