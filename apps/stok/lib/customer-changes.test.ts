import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// A made-up invoice in the QNB Dijital Köprü layout; no real customer.
const invoiceText = (n: number, name: string, date: string) => `Vergi Hariç Tutar: 1.000,00 TL
Vergiler Dahil Toplam Tutar: 1.200,00 TL
SAYIN
${name}
DENEME MAH. ÖRNEK SOK.
NO:1 ÜMRANİYE/ İSTANBUL
VKN: 1111111111
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
  const upload = async (n: number, name: string, date: string) => {
    const { importInvoiceText } = await import("./invoices");
    await importInvoiceText(editor.headers, { fileName: `${n}.pdf`, sha256: `s${n}`, text: invoiceText(n, name, date) });
  };

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
});
