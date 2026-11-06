import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { after, before, beforeEach, describe, test } from "node:test";
import { missingNumbers, priorityOf, summarize } from "./finance-calc";
import { matchCustomer, matchProduct } from "./invoice-match";
import { importAndConfirm, lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// Made-up invoices in the QNB Dijital Köprü layout; no real customer.
function invoiceText({
  ettn,
  number,
  date,
  taxId = "1234567890",
  name = "ÖRNEK ELEKTRONİK LİMİTED ŞİRKETİ",
  net = "1.000,00",
  type = "SATIS",
}: {
  ettn: string;
  number: string;
  date: string;
  taxId?: string;
  name?: string;
  net?: string;
  type?: string;
}) {
  return `Vergi Hariç Tutar: ${net} TL
Vergiler Dahil Toplam Tutar: ${net} TL
SAYIN
${name}
DENEME MAH. ÖRNEK SOK.
NO:1 ÜMRANİYE/ İSTANBUL
Vergi Dairesi: ÜMRANİYE
VKN: ${taxId}
ETTN: ${ettn}
Tarih: ${date}
Fatura No: ${number}
Senaryo: TEMELFATURA
Fatura Tipi: ${type}
Sıra No Mal Hizmet Miktar Birim Fiyat Mal Hizmet Tutarı KDV Oranı KDV Tutarı
1 FERRİTNUVE(EE25) 10,0 Adet 100 TL ${net} TL %20,00 200,00 TL
QNB FİNANSBANK`;
}
const ettn = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("missing invoice numbers", () => {
  test("gaps are found per series, e-Fatura and e-Arşiv apart", () => {
    const gaps = missingNumbers([
      { number: "AAA2025000000001", scenario: "TEMELFATURA", issuedOn: "2025-01-02" },
      { number: "AAA2025000000005", scenario: "TEMELFATURA", issuedOn: "2025-01-09" },
      { number: "AAA2025000000002", scenario: "EARSIVFATURA", issuedOn: "2025-01-03" },
      { number: "AAA2025000000003", scenario: "EARSIVFATURA", issuedOn: "2025-01-04" },
    ]);
    assert.deepEqual(gaps, [{ series: "e-Fatura 2025", from: 2, to: 4, after: "2025-01-02", before: "2025-01-09" }]);
  });
});

describe("priorities", () => {
  const base = { sales: 1000, invoices: 1, orderDays: 1, firstOn: "2025-01-01", lastOn: "2025-01-01", groups: ["Ferrit nüve ve toroid"] };
  test("a regular who stopped buying comes first", () => {
    assert.equal(priorityOf({ ...base, orderDays: 3, invoices: 3 }, 50, "2025-06-01").no, 1);
  });
  test("a big one-off buyer is asked back; a small old one waits", () => {
    assert.equal(priorityOf(base, 12, "2025-06-01").no, 2);
    assert.equal(priorityOf(base, 90, "2025-06-01").no, 5);
  });
  test("an active top-10 customer is offered what it doesn't buy yet", () => {
    const p = priorityOf({ ...base, lastOn: "2025-05-20" }, 3, "2025-06-01");
    assert.equal(p.no, 3);
    assert.match(p.talk, /trafo/);
  });
  test("summaries leave IADE to the caller and count one order per day", () => {
    const s = summarize(
      [
        { id: "a", customerId: "c1", issuedOn: "2025-01-01", netAmount: 100 },
        { id: "b", customerId: "c1", issuedOn: "2025-01-01", netAmount: 50 },
        { id: "c", customerId: "c2", issuedOn: "2025-02-01", netAmount: 50 },
      ],
      [],
      [{ id: "c1", city: "İSTANBUL" }, { id: "c2", city: "ANKARA" }],
    );
    assert.equal(s.total, 200);
    assert.equal(s.customers[0].orderDays, 1);
    assert.equal(s.repeatCount, 0);
    assert.deepEqual(s.monthly.map((m) => m.month), ["2025-01", "2025-02"]);
  });
});

describe("invoice import, CRM and reminders", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let invoices: typeof import("./invoices");
  let admin: Awaited<ReturnType<typeof signedInAs>>;

  const file = (n: number, extra: Partial<Parameters<typeof invoiceText>[0]> = {}) => ({
    fileName: `fatura-${n}.pdf`,
    sha256: `sha-${n}`,
    text: invoiceText({ ettn: ettn(n), number: `AAA2025${String(n).padStart(9, "0")}`, date: "07-04-2025", ...extra }),
  });
  const upload = (headers: Headers, n: number, extra: Partial<Parameters<typeof invoiceText>[0]> = {}) =>
    invoices.importInvoiceText(headers, file(n, extra));
  // Uploaded and confirmed with its own Müşteri and no line from stock.
  const confirmed = (headers: Headers, n: number, extra: Partial<Parameters<typeof invoiceText>[0]> = {}) => importAndConfirm(headers, file(n, extra));

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    invoices = await import("./invoices");
  });
  // An admin given both panels by name, as Merve gives them on the user page.
  async function adminWithPanels(panels: { musteri?: "gorur" | "duzenler"; finans?: "gorur" | "duzenler" }) {
    const signed = await signedInAs(["admin"]);
    const grants = Object.entries(panels).map(([panel, level]) => ({ userId: signed.user.id, panel: panel as "musteri" | "finans", level: level! }));
    if (grants.length) await db.insert(schema.userPanel).values(grants);
    return signed;
  }

  beforeEach(async () => {
    await resetTestDatabase();
    admin = await adminWithPanels({ musteri: "duzenler", finans: "duzenler" });
  });
  after(async () => {
    await resetTestDatabase();
  });

  test("the same invoice uploaded twice is added once", async () => {
    assert.equal((await upload(admin.headers, 1)).status, "eklendi");
    const again = await upload(admin.headers, 1);
    assert.equal(again.status, "tekrar");
    assert.equal((await db.select().from(schema.invoice)).length, 1);
    assert.equal((await db.select().from(schema.invoiceLine)).length, 1);
  });

  test("invoices of one buyer share a customer; another tax id is another customer", async () => {
    await confirmed(admin.headers, 1);
    await confirmed(admin.headers, 2);
    await confirmed(admin.headers, 3, { taxId: "9999999999", name: "BAŞKA FİRMA A.Ş." });
    const customers = await db.select().from(schema.customer);
    assert.equal(customers.length, 2);
    assert.equal(customers.find((c) => c.taxId === "1234567890")?.city, "İSTANBUL");
  });

  test("uploading needs the Finans paneli with edit rights, not just the admin role", async () => {
    const { Forbidden } = await import("./guard");
    const muhendis = await signedInAs(["muhendis"]);
    await assert.rejects(upload(muhendis.headers, 1), Forbidden);
    const plainAdmin = await adminWithPanels({});
    await assert.rejects(upload(plainAdmin.headers, 1), Forbidden);
    const viewer = await adminWithPanels({ finans: "gorur" });
    await assert.rejects(upload(viewer.headers, 1), Forbidden);
  });

  test("a Müşteri paneli viewer can read a card but not change it", async () => {
    const { Forbidden } = await import("./guard");
    await confirmed(admin.headers, 1);
    const [c] = await db.select().from(schema.customer);
    const crm = await import("./crm");
    const viewer = await adminWithPanels({ musteri: "gorur" });
    assert.equal((await crm.customerCard(viewer.headers, c.id))?.id, c.id);
    await assert.rejects(crm.addCustomerNote(viewer.headers, { customerId: c.id, body: "x" }), Forbidden);
  });

  test("panels are given only to active admins, and every change is audited", async () => {
    const { updatePanels } = await import("./user-admin");
    const target = await signedInAs(["admin"]);
    await updatePanels(admin.headers, target.user.id, { musteri: "gorur", finans: "yok" });
    const grants = await db.select().from(schema.userPanel).where(eq(schema.userPanel.userId, target.user.id));
    assert.deepEqual(grants.map((g) => [g.panel, g.level]), [["musteri", "gorur"]]);
    const [log] = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "user.panels"));
    assert.deepEqual(log.after, { panels: { musteri: "gorur" } });

    const muhendis = await signedInAs(["muhendis"]);
    await assert.rejects(updatePanels(admin.headers, muhendis.user.id, { musteri: "gorur", finans: "yok" }), /yöneticilere/);
  });

  test("an unreadable file is reported, not stored", async () => {
    const r = await invoices.importInvoiceText(admin.headers, { fileName: "bos.pdf", sha256: "x", text: "" });
    assert.equal(r.status, "okunamadi");
    assert.equal((await db.select().from(schema.invoice)).length, 0);
  });

  test("CRM edits and notes are kept on the customer", async () => {
    await confirmed(admin.headers, 1);
    const [c] = await db.select().from(schema.customer);
    const crm = await import("./crm");
    await crm.updateCustomer(admin.headers, {
      id: c.id,
      phone: "0212 000 00 00",
      email: "info@ornek.example",
      website: "",
      about: "",
      contactSource: "",
      status: "arandi",
      nextFollowUpOn: "2025-04-10",
      followUpChannel: "eposta",
    });
    await crm.addCustomerNote(admin.headers, { customerId: c.id, body: "Mayısta yeni proje var." });
    const card = await crm.customerCard(admin.headers, c.id);
    assert.equal(card?.status, "arandi");
    assert.equal(card?.followUpChannel, "eposta");
    assert.equal(card?.notes[0].body, "Mayısta yeni proje var.");
    await assert.rejects(
      crm.updateCustomer(admin.headers, { id: c.id, phone: "", email: "yanlis", website: "", about: "", contactSource: "", status: "arandi", nextFollowUpOn: "", followUpChannel: "telefon" }),
      /E-posta/,
    );
  });

  test("a quiet week queues one invoice reminder; follow-ups due go to admins once a day", async () => {
    const { queueFinanceReminders, invoiceReminderTo } = await import("./finance-reminders");
    await adminWithPanels({ finans: "duzenler" }); // no Müşteri paneli: not a recipient
    const now = new Date("2025-05-01T06:00:00Z");
    await confirmed(admin.headers, 1);
    await db.update(schema.invoice).set({ uploadedAt: new Date("2025-04-20T10:00:00Z") });
    const [c] = await db.select().from(schema.customer);
    await db.update(schema.customer).set({ nextFollowUpOn: "2025-05-01" });

    assert.deepEqual((await queueFinanceReminders(now)).sort(), ["crm_takip", "fatura_hatirlatma"]);
    assert.deepEqual(await queueFinanceReminders(new Date(now.getTime() + 60 * 60_000)), []);

    const sent = await db.select().from(schema.notification);
    assert.deepEqual(sent.find((n) => n.kind === "fatura_hatirlatma")?.recipients, [invoiceReminderTo]);
    // Only admins holding the Müşteri paneli get the follow-up list.
    const takip = sent.find((n) => n.kind === "crm_takip");
    assert.deepEqual(takip?.recipients, [admin.user.email]);
    assert.match(takip!.body, new RegExp(c.id));

    // A week later, still nothing uploaded: one more reminder.
    assert.ok((await queueFinanceReminders(new Date(now.getTime() + 7 * 86_400_000))).includes("fatura_hatirlatma"));
  });

  test("a recent upload means no reminder", async () => {
    const { queueFinanceReminders } = await import("./finance-reminders");
    await upload(admin.headers, 1);
    assert.deepEqual(await queueFinanceReminders(new Date()), []);
  });

  describe("review and confirmation", () => {
    let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
    let core: string;
    const lines = (productId: string | null, quantity: string | null = null) => [{ seq: 1, productId, quantity }];
    const stockOf = async (productId: string) =>
      (await db.select().from(schema.stock)).find((s) => s.productId === productId && s.lokasyonId === lokasyon["Karaköy Mağaza"])?.physical;

    beforeEach(async () => {
      lokasyon = await lokasyonIdsByName();
      const [p] = await db
        .insert(schema.product)
        .values({ code: "T-EE25", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: false, manufacturerCode: "EE25" })
        .returning();
      core = p.id;
      const { recordReceipt } = await import("./receipts");
      await recordReceipt(admin.headers, {
        supplier: "Test",
        reference: "T-1",
        lokasyonId: lokasyon["Karaköy Mağaza"],
        lines: [{ productId: core, quantity: "25" }],
        idempotencyKey: crypto.randomUUID(),
      });
    });

    test("an upload is a draft: the PDF is kept, no Müşteri is made and nothing counts until it is confirmed", async () => {
      const { loadSalesSummary } = await import("./finance");
      const r = await invoices.importInvoiceText(admin.headers, { ...file(1), bytes: new Uint8Array([37, 80, 68, 70]) });
      assert.equal(r.status, "eklendi");
      const [row] = await db.select().from(schema.invoice);
      assert.equal(row.status, "taslak");
      assert.equal(row.customerId, null);
      assert.equal(row.buyer.taxId, "1234567890");
      assert.equal((await db.select().from(schema.customer)).length, 0);
      assert.equal((await loadSalesSummary()).total, 0);
      assert.deepEqual([...(await invoices.invoicePdf(admin.headers, row.id))!.bytes], [37, 80, 68, 70]);
      assert.equal(await stockOf(core), "25.000");
    });

    test("confirming takes the matched lines from the chosen Lokasyon and adds the invoice to Finans", async () => {
      const { loadSalesSummary } = await import("./finance");
      const r = await upload(admin.headers, 1);
      assert.ok("id" in r);
      const review = await invoices.invoiceReview(admin.headers, r.id);
      assert.equal(review?.lines[0].productId, core, "EE25 on the line matches the product's manufacturer code");
      assert.equal(review?.customerMatch.customerId, null);

      await invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "10") });
      assert.equal(await stockOf(core), "15.000");
      const [inv] = await db.select().from(schema.invoice);
      assert.equal(inv.status, "onaylandi");
      assert.ok(inv.stockDocumentId);
      const moves = await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.documentId, inv.stockDocumentId!));
      assert.deepEqual(moves.map((m) => [m.type, m.quantity]), [["satis_teslimati", "-10.000"]]);
      const [line] = await db.select().from(schema.invoiceLine);
      assert.deepEqual([line.productId, line.stockQuantity], [core, "10.000"]);
      const [c] = await db.select().from(schema.customer);
      assert.equal(inv.customerId, c.id);
      assert.equal((await loadSalesSummary()).total, 1000);

      await assert.rejects(
        invoices.confirmInvoice(admin.headers, { id: r.id, customerId: c.id, lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "10") }),
        /zaten onaylandı/,
      );
      assert.equal(await stockOf(core), "15.000");
    });

    test("not enough stock refuses the whole confirmation; the invoice stays a draft", async () => {
      const r = await upload(admin.headers, 1);
      assert.ok("id" in r);
      await assert.rejects(
        invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "30") }),
        /Yetersiz stok/,
      );
      const [inv] = await db.select().from(schema.invoice);
      assert.equal(inv.status, "taslak");
      assert.equal((await db.select().from(schema.customer)).length, 0);
      assert.equal(await stockOf(core), "25.000");
    });

    test("every line needs a choice, and a stocked line needs a Lokasyon", async () => {
      const r = await upload(admin.headers, 1);
      assert.ok("id" in r);
      await assert.rejects(invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: null, lines: [] }), /her satırı/);
      await assert.rejects(invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: null, lines: lines(core, "1") }), /Lokasyon/);
    });

    test("an İade puts its lines back into stock and is still not a sale", async () => {
      const { loadSalesSummary } = await import("./finance");
      const r = await upload(admin.headers, 1, { type: "IADE" });
      assert.ok("id" in r);
      await invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "2") });
      assert.equal(await stockOf(core), "27.000");
      const [move] = await db.select().from(schema.stockMovement).where(eq(schema.stockMovement.type, "satis_iadesi"));
      assert.equal(move.quantity, "2.000");
      assert.equal((await loadSalesSummary()).total, 0);
    });

    test("a known VKN is matched on upload; another firm can be picked instead, and no Müşteri is added", async () => {
      await confirmed(admin.headers, 1);
      const [known] = await db.select().from(schema.customer);
      const second = await upload(admin.headers, 2);
      assert.ok("id" in second);
      assert.equal((await invoices.invoiceReview(admin.headers, second.id))?.customerMatch.customerId, known.id);

      const other = await upload(admin.headers, 3, { taxId: "5555555555", name: "ÖRNEK ELEKTRONİK SANAYİ A.Ş." });
      assert.ok("id" in other);
      const review = await invoices.invoiceReview(admin.headers, other.id);
      assert.equal(review?.customerMatch.customerId, null);
      assert.deepEqual(review?.customerMatch.suggestions, [known.id], "the similar name is suggested");
      await invoices.confirmInvoice(admin.headers, { id: other.id, customerId: known.id, lokasyonId: null, lines: lines(null) });
      assert.equal((await db.select().from(schema.customer)).length, 1);
      const [inv] = await db.select().from(schema.invoice).where(eq(schema.invoice.id, other.id));
      assert.deepEqual([inv.customerId, inv.stockDocumentId], [known.id, null]);
    });

    test("a line confirmed as a product is matched to it next time", async () => {
      const [other] = await db
        .insert(schema.product)
        .values({ code: "T-X", name: "Özel ürün", category: "Diğer", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: false })
        .returning();
      const first = await upload(admin.headers, 1);
      assert.ok("id" in first);
      await invoices.confirmInvoice(admin.headers, { id: first.id, customerId: "yeni", lokasyonId: null, lines: lines(other.id) });
      const second = await upload(admin.headers, 2);
      assert.ok("id" in second);
      assert.equal((await invoices.invoiceReview(admin.headers, second.id))?.lines[0].productId, other.id);
    });

    test("a confirmed invoice that moved stock can't be archived; a draft can", async () => {
      const { archiveInvoice } = await import("./archive");
      const r = await upload(admin.headers, 1);
      const draft = await upload(admin.headers, 2);
      assert.ok("id" in r && "id" in draft);
      await invoices.confirmInvoice(admin.headers, { id: r.id, customerId: "yeni", lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "1") });
      await assert.rejects(archiveInvoice(admin.headers, { id: r.id, reason: "yanlış" }), /arşivlenemez/);
      await archiveInvoice(admin.headers, { id: draft.id, reason: "iptal edildi" });
    });

    test("uploading an older invoice again keeps its PDF", async () => {
      const r = await upload(admin.headers, 1);
      assert.ok("id" in r);
      assert.equal(await invoices.invoicePdf(admin.headers, r.id), null);
      const again = await invoices.importInvoiceText(admin.headers, { ...file(1), bytes: new Uint8Array([1, 2]) });
      assert.equal(again.status, "tekrar");
      assert.deepEqual([...(await invoices.invoicePdf(admin.headers, r.id))!.bytes], [1, 2]);
    });

    test("confirming needs the Finans paneli with edit rights", async () => {
      const { Forbidden } = await import("./guard");
      const r = await upload(admin.headers, 1);
      assert.ok("id" in r);
      const viewer = await signedInAs(["admin"]);
      await db.insert(schema.userPanel).values({ userId: viewer.user.id, panel: "finans", level: "gorur" });
      await assert.rejects(
        invoices.confirmInvoice(viewer.headers, { id: r.id, customerId: "yeni", lokasyonId: lokasyon["Karaköy Mağaza"], lines: lines(core, "1") }),
        Forbidden,
      );
    });
  });
});

describe("invoice matching", () => {
  const buyer = { name: "ÖRNEK ELEKTRONİK SANAYİ A.Ş.", taxId: "1111111111", taxIdType: "VKN" as const, city: "", district: "", email: null };
  test("a Müşteri with the same VKN is the match; otherwise similar names are suggested, best first", () => {
    const customers = [
      { id: "a", name: "BAŞKA FİRMA LTD ŞTİ", taxId: "2" },
      { id: "b", name: "ÖRNEK ELEKTRONİK LİMİTED ŞİRKETİ", taxId: "3" },
      { id: "c", name: "ÖRNEK MAKİNA A.Ş.", taxId: "4" },
    ];
    assert.deepEqual(matchCustomer(buyer, [...customers, { id: "d", name: "Eski ad", taxId: "1111111111" }]), { customerId: "d", suggestions: [] });
    assert.deepEqual(matchCustomer(buyer, customers), { customerId: null, suggestions: ["b", "c"] });
  });

  const products = [
    { id: "ee25", code: "ART-1", name: "EE 25 Ferrit Nüve", manufacturerCode: "EE25" },
    { id: "ee30", code: "ART-2", name: "EE 30 Ferrit Nüve", manufacturerCode: "EE30" },
    { id: "rod", code: "ART-3", name: "ROD 5 x 20", manufacturerCode: null },
  ];
  test("a product is picked from a manufacturer code, a covering name or an earlier confirmation", () => {
    assert.equal(matchProduct("FERRİTNUVE(EE25)", products, new Map()).productId, "ee25");
    assert.equal(matchProduct("ROD 5X20 FERRİT", products, new Map()).productId, "rod");
    assert.equal(matchProduct("ÖZEL SARGI", products, new Map([["ÖZEL SARGI", "rod"]])).productId, "rod");
  });
  test("when unsure nothing is picked, but the closest products are listed first", () => {
    const m = matchProduct("FERRİT NÜVE", products, new Map());
    assert.equal(m.productId, null);
    assert.deepEqual(m.suggestions.slice(0, 2).sort(), ["ee25", "ee30"]);
  });
});
