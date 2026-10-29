import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { likelyCustomer, normFirm } from "./lead-match";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

type Report = Parameters<typeof import("./leads").importLeads>[0];

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

describe("lead names", () => {
  test("legal words and punctuation don't make a firm look new", () => {
    assert.equal(normFirm("XYZ Elektronik Ltd. Şti."), normFirm("XYZ ELEKTRONİK SAN. VE TİC. LİMİTED ŞİRKETİ"));
    assert.notEqual(normFirm("XYZ Elektronik"), normFirm("XYZ Enerji"));
  });
  test("a Müşteri is suggested only when exactly one name fits", () => {
    const customers = [
      { id: "1", name: "QQQ GÜÇ ELEKTRONİĞİ SANAYİ VE TİCARET A.Ş" },
      { id: "2", name: "WWW TRAFO LTD ŞTİ" },
      { id: "3", name: "WWW TRAFO MAKİNA LTD ŞTİ" },
    ];
    assert.equal(likelyCustomer("QQQ Güç Elektroniği", customers)?.id, "1");
    assert.equal(likelyCustomer("WWW Trafo", customers), null); // two fit: a person decides
    assert.equal(likelyCustomer("Başka Firma", customers), null);
  });
});

describe("Adaylar", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;
  const report = (rapor: string, adaylar: Report["adaylar"]): Report => ({ rapor, adaylar });
  const leads = async () => db.select().from(schema.lead);
  const eventsOf = async (id: string) => db.select().from(schema.leadEvent).where(eq(schema.leadEvent.leadId, id));

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
    const { importInvoiceText } = await import("./invoices");
    await importInvoiceText(editor.headers, { fileName: "1.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "MEVCUT MÜŞTERİ LİMİTED ŞİRKETİ") });
  });

  test("a report adds new Adaylar, marks repeats as seen, and skips firms that are already Müşteriler", async () => {
    const { importLeads } = await import("./leads");
    const first = await importLeads(
      report("2026-11-02 Haftalık Fırsat Radarı", [
        { firma: "XYZ Elektronik Ltd. Şti.", sehir: "Kocaeli", neden: "Yeni fabrika açtı.", kaynaklar: [{ baslik: "Haber", url: "https://ornek.example/a", tarih: "2026-10-30" }] },
        { firma: "Mevcut Müşteri Ltd", neden: "Zaten müşteri." },
      ]),
      { userId: null },
    );
    assert.deepEqual(first, { added: 1, seen: 0, customers: 1, skipped: 0 });

    const again = await importLeads(
      report("2026-11-05 Hedef Firma - XYZ", [
        { firma: "XYZ ELEKTRONİK SAN. VE TİC. LİMİTED ŞİRKETİ", web: "xyz.example", iletisim: { eposta: "info@xyz.example" }, neden: "Ar-Ge ekibi büyüyor." },
      ]),
      { userId: null },
    );
    assert.deepEqual(again, { added: 0, seen: 1, customers: 0, skipped: 0 });
    // The same report a second time changes nothing.
    await importLeads(report("2026-11-05 Hedef Firma - XYZ", [{ firma: "XYZ Elektronik" }]), { userId: null });

    const [l] = await leads();
    assert.equal(l.name, "XYZ Elektronik Ltd. Şti.");
    assert.equal(l.seenCount, 2);
    assert.equal(l.city, "Kocaeli");
    assert.equal(l.website, "xyz.example");
    assert.equal(l.contact.email, "info@xyz.example");
    assert.equal(l.why, "Ar-Ge ekibi büyüyor.");
    assert.deepEqual(
      l.sources.map((s) => s.report),
      ["2026-11-02 Haftalık Fırsat Radarı", "2026-11-05 Hedef Firma - XYZ"],
    );
    assert.deepEqual((await eventsOf(l.id)).map((e) => e.kind).sort(), ["eklendi", "gorundu"]);
  });

  test("status changes and notes are kept with who and when; Müşteri oldu only comes from a link", async () => {
    const { importLeads, updateLead } = await import("./leads");
    await importLeads(report("Radar", [{ firma: "ABC Enerji" }]), { userId: null });
    const [l] = await leads();
    await updateLead(editor.headers, { id: l.id, status: "ulasildi", note: "Genel e-postaya yazdım." });
    const events = await eventsOf(l.id);
    assert.ok(events.some((e) => e.kind === "durum" && e.text === "Yeni → Ulaşıldı" && e.userId === editor.user.id));
    assert.ok(events.some((e) => e.kind === "not" && e.text === "Genel e-postaya yazdım."));
    await assert.rejects(updateLead(editor.headers, { id: l.id, status: "musteri_oldu" }), /bağlanınca/);
  });

  test("the first invoice with an Aday's VKN links it; a name match waits for a person", async () => {
    const { importLeads, linkLeadToCustomer } = await import("./leads");
    const { importInvoiceText } = await import("./invoices");
    await importLeads(report("Radar", [{ firma: "VKN Bilinen Firma", vkn: "2222222222" }, { firma: "Adı Benzer Firma" }]), { userId: null });
    await importInvoiceText(editor.headers, { fileName: "2.pdf", sha256: "s2", text: invoiceText(2, "2222222222", "VKN BİLİNEN FİRMA A.Ş") });
    await importInvoiceText(editor.headers, { fileName: "3.pdf", sha256: "s3", text: invoiceText(3, "3333333333", "ADI BENZER FİRMA LTD ŞTİ") });

    const all = await leads();
    const known = all.find((l) => l.name === "VKN Bilinen Firma")!;
    const similar = all.find((l) => l.name === "Adı Benzer Firma")!;
    assert.equal(known.status, "musteri_oldu");
    assert.ok(known.customerId);
    assert.ok((await eventsOf(known.id)).some((e) => e.kind === "musteri" && e.userId === null));
    assert.equal(similar.customerId, null);

    const [c] = await db.select().from(schema.customer).where(eq(schema.customer.taxId, "3333333333"));
    await linkLeadToCustomer(editor.headers, similar.id, c.id);
    const [linked] = await db.select().from(schema.lead).where(eq(schema.lead.id, similar.id));
    assert.deepEqual([linked.status, linked.customerId], ["musteri_oldu", c.id]);
    await assert.rejects(linkLeadToCustomer(editor.headers, similar.id, c.id), /zaten/);
  });

  test("the routines' route needs the token", async () => {
    const { POST } = await import("../app/api/adaylar/route");
    const body = JSON.stringify(report("Radar", [{ firma: "Token Testi Firma" }]));
    process.env.ADAYLAR_TOKEN = "test-token";
    const denied = await POST(new Request("http://x/api/adaylar", { method: "POST", body, headers: { authorization: "Bearer yanlis" } }));
    assert.equal(denied.status, 401);
    const ok = await POST(new Request("http://x/api/adaylar", { method: "POST", body, headers: { authorization: "Bearer test-token" } }));
    assert.deepEqual(await ok.json(), { added: 1, seen: 0, customers: 0, skipped: 0 });
    const bad = await POST(new Request("http://x/api/adaylar", { method: "POST", body: "{", headers: { authorization: "Bearer test-token" } }));
    assert.equal(bad.status, 400);
    delete process.env.ADAYLAR_TOKEN;
  });
});
