import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// A made-up invoice in the QNB Dijital Köprü layout; no real customer.
const invoiceText = (n: number, name: string, date: string, taxId = "1111111111") => `Vergi Hariç Tutar: 1.000,00 TL
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

// Stands in for the Anthropic client: answers every note with the same reading.
const reading = (answer: unknown) =>
  ({ beta: { messages: { create: async () => ({ content: [{ type: "text", text: JSON.stringify(answer) }] }) } } }) as unknown as Anthropic;

describe("change history and smart card notes", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;

  const theCustomer = async () => (await db.select().from(schema.customer))[0];
  const history = async () => db.select().from(schema.customerChange);
  const upload = async (n: number, name: string, date: string, taxId?: string) => {
    const { importInvoiceText } = await import("./invoices");
    await importInvoiceText(editor.headers, { fileName: `${n}.pdf`, sha256: `s${n}`, text: invoiceText(n, name, date, taxId) });
  };
  const byName = async (prefix: string) => (await db.select().from(schema.customer)).find((c) => c.name.startsWith(prefix))!;

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
    await upload(1, "AAA ELEKTRONİK LİMİTED ŞİRKETİ", "02-01-2025");
  });

  test("a note is read into a proposal; Uygula changes the card and records each change with the note", async () => {
    const { addCustomerNote } = await import("./crm");
    const { applyNoteProposal } = await import("./customer-changes");
    const c = await theCustomer();
    const answer = {
      changes: [
        { field: "name", value: "XYZ ELEKTRONİK LTD" },
        { field: "phone", value: "0212 000 00 00" },
        { field: "status", value: "uydurma" }, // not a status: dropped
        { field: "website", value: "" }, // empty: dropped
      ],
      related_firm: null,
      explanation: "Unvan ve telefon değişmiş.",
    };
    await addCustomerNote(editor.headers, { customerId: c.id, body: "Unvanı XYZ ELEKTRONİK LTD oldu, yeni telefon 0212 000 00 00" }, reading(answer));
    const [note] = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
    assert.deepEqual(
      note.proposal?.changes.map((ch) => ch.field),
      ["name", "phone"],
    );
    assert.equal((await theCustomer()).name, c.name);

    await applyNoteProposal(editor.headers, note.id);
    const after = await theCustomer();
    assert.equal(after.name, "XYZ ELEKTRONİK LTD");
    assert.equal(after.phone, "0212 000 00 00");
    const rows = await history();
    assert.deepEqual(
      rows.map((r) => [r.field, r.oldValue, r.newValue, r.source, r.noteId]).sort(),
      [
        ["name", c.name, "XYZ ELEKTRONİK LTD", "not", note.id],
        ["phone", null, "0212 000 00 00", "not", note.id],
      ],
    );
    await assert.rejects(applyNoteProposal(editor.headers, note.id), /zaten değerlendirildi/);
  });

  test("Reddet changes nothing, and a note with nothing to change makes no proposal", async () => {
    const { addCustomerNote } = await import("./crm");
    const { rejectNoteProposal } = await import("./customer-changes");
    const c = await theCustomer();
    await addCustomerNote(editor.headers, { customerId: c.id, body: "Mayısta yeni proje var." }, reading({ changes: [], related_firm: null, explanation: "" }));
    await addCustomerNote(
      editor.headers,
      { customerId: c.id, body: "Kapanmışlar." },
      reading({ changes: [{ field: "status", value: "kapandi" }], related_firm: null, explanation: "Firma kapanmış." }),
    );
    const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
    assert.equal(notes.find((n) => n.body.startsWith("Mayıs"))?.proposal, null);
    const closing = notes.find((n) => n.body === "Kapanmışlar.")!;
    await rejectNoteProposal(editor.headers, closing.id);
    assert.equal((await theCustomer()).status, c.status);
    assert.equal((await history()).length, 0);
  });

  test("a note about another firm is kept as a proposal even without changes", async () => {
    const { addCustomerNote } = await import("./crm");
    const c = await theCustomer();
    await addCustomerNote(editor.headers, { customerId: c.id, body: "BBB'ye satılmış." }, reading({ changes: [], related_firm: "BBB MAKİNA", explanation: "Satılmış." }));
    const [note] = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
    assert.equal(note.proposal?.relatedFirm, "BBB MAKİNA");
  });

  test("a newer invoice with a new name records the rename, and the old name still finds the firm", async () => {
    const { formerNames } = await import("./customer-changes");
    const c = await theCustomer();
    await upload(2, "AAA YENİ UNVAN A.Ş", "03-02-2025");
    await upload(3, "AAA ESKİ BİR UNVAN", "01-01-2025"); // older invoice: name stays
    assert.equal((await theCustomer()).name, "AAA YENİ UNVAN A.Ş");
    const rows = await history();
    assert.deepEqual(
      rows.map((r) => [r.field, r.oldValue, r.newValue, r.source, r.userId]),
      [["name", c.name, "AAA YENİ UNVAN A.Ş", "fatura", null]],
    );
    assert.deepEqual((await formerNames()).get(c.id), [c.name]);
  });

  test("editing the card by hand records only what changed", async () => {
    const { updateCustomer } = await import("./crm");
    const c = await theCustomer();
    const edit = { id: c.id, phone: "0212 111 11 11", email: "", website: "", about: "", contactSource: "", status: "arandi" as const, nextFollowUpOn: "", followUpChannel: "telefon" as const };
    await updateCustomer(editor.headers, edit);
    await updateCustomer(editor.headers, edit); // the same again: nothing new
    const rows = await history();
    assert.deepEqual(rows.map((r) => [r.field, r.newValue, r.source]).sort(), [
      ["phone", "0212 111 11 11", "elle"],
      ["status", "arandi", "elle"],
    ]);
  });

  describe("firm links", () => {
    beforeEach(async () => {
      await upload(10, "BBB MAKİNA A.Ş", "05-01-2025", "2222222222");
    });

    test("a link reads right on both cards and goes into both histories", async () => {
      const { addLink, linksFor, linkFacts } = await import("./firm-links");
      const a = await byName("AAA");
      const b = await byName("BBB");
      await addLink(editor.headers, { fromId: a.id, toId: b.id, type: "satildi", note: "2025'te devraldılar" });
      const [fromSide] = await linksFor(a.id);
      const [toSide] = await linksFor(b.id);
      assert.deepEqual([fromSide.label, fromSide.other.id, fromSide.note], ["Satıldı / devredildi", b.id, "2025'te devraldılar"]);
      assert.deepEqual([toSide.label, toSide.other.id], ["Devraldı", a.id]);
      assert.deepEqual(await linkFacts(b.id), [{ firma: a.name, iliski: "Devraldı", not: "2025'te devraldılar" }]);
      const rows = await history();
      assert.deepEqual(rows.map((r) => [r.customerId, r.field, r.newValue]).sort(), [
        [a.id, "link", `Satıldı / devredildi: ${b.name}`],
        [b.id, "link", `Devraldı: ${a.name}`],
      ].sort());
    });

    test("the same link twice, its two-way mirror, or a firm to itself is refused", async () => {
      const { addLink } = await import("./firm-links");
      const a = await byName("AAA");
      const b = await byName("BBB");
      await addLink(editor.headers, { fromId: a.id, toId: b.id, type: "birlikte_calisiyor" });
      await assert.rejects(addLink(editor.headers, { fromId: a.id, toId: b.id, type: "birlikte_calisiyor" }), /zaten var/);
      await assert.rejects(addLink(editor.headers, { fromId: b.id, toId: a.id, type: "birlikte_calisiyor" }), /zaten var/);
      await assert.rejects(addLink(editor.headers, { fromId: a.id, toId: a.id, type: "diger" }), /kendisine/);
      // A one-way type the other way round is a different link.
      await addLink(editor.headers, { fromId: b.id, toId: a.id, type: "musterimizin_musterisi" });
    });

    test("removing a link takes it off both cards and is recorded", async () => {
      const { addLink, linksFor, removeLink } = await import("./firm-links");
      const a = await byName("AAA");
      const b = await byName("BBB");
      await addLink(editor.headers, { fromId: a.id, toId: b.id, type: "ayni_sahip" });
      const [link] = await linksFor(a.id);
      await removeLink(editor.headers, link.id);
      assert.equal((await linksFor(a.id)).length + (await linksFor(b.id)).length, 0);
      const removed = (await history()).filter((r) => r.oldValue);
      assert.deepEqual(removed.map((r) => r.customerId).sort(), [a.id, b.id].sort());
    });

    test("a note naming a firm we know proposes the link, and Uygula creates it; an unknown firm stays a note", async () => {
      const { addCustomerNote } = await import("./crm");
      const { applyNoteProposal } = await import("./customer-changes");
      const { linksFor } = await import("./firm-links");
      const a = await byName("AAA");
      const b = await byName("BBB");
      await addCustomerNote(
        editor.headers,
        { customerId: a.id, body: "Bbb Makina'ya satılmış." },
        reading({ changes: [], related_firm: "Bbb Makina", relation: "satildi", explanation: "Satılmış." }),
      );
      await addCustomerNote(
        editor.headers,
        { customerId: a.id, body: "ZZZ ile çalışıyorlar." },
        reading({ changes: [], related_firm: "ZZZ ENDÜSTRİ", relation: "birlikte_calisiyor", explanation: "Ortak çalışıyorlar." }),
      );
      const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, a.id));
      const known = notes.find((n) => n.body.startsWith("Bbb"))!;
      const unknown = notes.find((n) => n.body.startsWith("ZZZ"))!;
      assert.deepEqual([known.proposal?.relatedFirmId, known.proposal?.relation], [b.id, "satildi"]);
      assert.equal(unknown.proposal?.relatedFirmId, null);

      await applyNoteProposal(editor.headers, known.id);
      const [link] = await linksFor(b.id);
      assert.deepEqual([link.label, link.other.id], ["Devraldı", a.id]);
      const fromNote = (await history()).filter((r) => r.noteId === known.id);
      assert.equal(fromNote.length, 2);
    });
  });
});
