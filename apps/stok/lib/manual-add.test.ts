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

describe("Adding by hand", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;
  const base = { city: "", phone: "", email: "", website: "" };

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

  test("a Müşteri needs a valid, new VKN; its invoices join it later and an Aday with that VKN is linked", async () => {
    const { addCustomer } = await import("./crm");
    const { importLeads } = await import("./leads");
    const { importInvoiceText } = await import("./invoices");
    await importLeads({ rapor: "Radar", adaylar: [{ firma: "Bambaşka Ad", vkn: "1111111111" }] }, { userId: null });

    await assert.rejects(addCustomer(editor.headers, { ...base, name: "AAA ELEKTRONİK", taxId: "123" }), /10, TCKN 11/);
    const id = await addCustomer(editor.headers, { ...base, name: "AAA ELEKTRONİK", taxId: "1111111111", city: "İstanbul" });
    await assert.rejects(addCustomer(editor.headers, { ...base, name: "Başka", taxId: "1111111111" }), /zaten bir müşteri var: AAA ELEKTRONİK/);

    const [l] = await db.select().from(schema.lead);
    assert.deepEqual([l.customerId, l.status], [id, "musteri_oldu"]);

    await importInvoiceText(editor.headers, { fileName: "1.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    const customers = await db.select().from(schema.customer);
    assert.equal(customers.length, 1);
    const [inv] = await db.select().from(schema.invoice);
    assert.equal(inv.customerId, id);
    assert.ok((await db.select().from(schema.activityLog)).some((r) => r.entity === "musteri" && r.action === "eklendi" && r.detail === "Elle"));
  });

  test("an Aday added by hand is refused when it is already a Müşteri or an Aday", async () => {
    const { addLead } = await import("./leads");
    const { importInvoiceText } = await import("./invoices");
    await importInvoiceText(editor.headers, { fileName: "1.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });

    await assert.rejects(addLead(editor.headers, { name: "Aaa Elektronik Ltd." }), /zaten müşterimiz: AAA ELEKTRONİK LTD ŞTİ/);
    const id = await addLead(editor.headers, { name: "Yeni Güç Sistemleri", website: "yeniguc.example", why: "Fabrika açtı.", email: "info@yeniguc.example" });
    await assert.rejects(addLead(editor.headers, { name: "YENİ GÜÇ SİSTEMLERİ A.Ş." }), /zaten Adaylar'da/);

    const [l] = await db.select().from(schema.lead);
    assert.equal(l.id, id);
    assert.deepEqual([l.website, l.why, l.contact.email, l.sources[0].report], ["yeniguc.example", "Fabrika açtı.", "info@yeniguc.example", "Elle eklendi"]);
    assert.ok((await db.select().from(schema.activityLog)).some((r) => r.entity === "aday" && r.detail === "Elle" && r.userId === editor.user.id));
  });
});
