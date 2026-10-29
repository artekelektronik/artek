import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";
import { addDays, istanbulDate } from "./time";

// A made-up invoice in the QNB Dijital Köprü layout; no real customer.
const invoiceText = (n: number, taxId: string, name: string, date: string) => `Vergi Hariç Tutar: 1.000,00 TL
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

const draft = {
  reason: "Son haberlerinde yeni bir üretim hattı var.",
  findings: [{ title: "Yeni hat", url: "https://ornek.example/haber", summary: "Yeni bir hat kurdular." }],
  talking_points: ["Yeni hatta hangi nüveleri kullanacaklar?"],
  email_subject: "Yeni hattınız için nüve",
  email_body: "Merhaba, yeni hattınız için nüve ihtiyacınız var mı?",
};
// Stands in for the Anthropic client: no network, no cost.
const fakeClient = (fail = false) =>
  ({
    beta: {
      messages: {
        create: async () =>
          fail
            ? { stop_reason: "refusal", model: "claude-opus-5-5", content: [] }
            : { stop_reason: "end_turn", model: "claude-opus-5-5", content: [{ type: "text", text: JSON.stringify(draft) }] },
      },
    },
  }) as unknown as Anthropic;

describe("morning assistant", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;
  const today = "2025-06-02";
  const now = new Date(`${today}T05:00:00Z`);

  async function adminWith(level: "gorur" | "duzenler") {
    const signed = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: signed.user.id, panel: "musteri", level });
    return signed;
  }
  async function customerNamed(taxId: string) {
    const [c] = await db.select().from(schema.customer).where(eq(schema.customer.taxId, taxId));
    return c;
  }

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    editor = await adminWith("duzenler");
    await db.insert(schema.userPanel).values({ userId: editor.user.id, panel: "finans", level: "duzenler" });
    const { importInvoiceText } = await import("./invoices");
    // A: a regular who stopped (two orders, long ago). B: a one-off. C: scheduled for today by email.
    const rows: [number, string, string, string][] = [
      [1, "1111111111", "AAA ELEKTRONİK LİMİTED ŞİRKETİ", "02-01-2025"],
      [2, "1111111111", "AAA ELEKTRONİK LİMİTED ŞİRKETİ", "03-02-2025"],
      [3, "2222222222", "BBB MAKİNA A.Ş", "04-01-2025"],
      [4, "3333333333", "CCC TRAFO LİMİTED ŞİRKETİ", "30-05-2025"],
    ];
    for (const [n, tax, name, date] of rows) {
      await importInvoiceText(editor.headers, { fileName: `${n}.pdf`, sha256: `s${n}`, text: invoiceText(n, tax, name, date) });
    }
    await db.update(schema.customer).set({ phone: "0212 000 00 00", email: "info@ornek.example" });
    await db
      .update(schema.customer)
      .set({ nextFollowUpOn: today, followUpChannel: "eposta" })
      .where(eq(schema.customer.taxId, "3333333333"));
  });

  test("scheduled follow-ups come first, then lapsed customers it picks itself", async () => {
    const { pickCustomers } = await import("./assistant");
    const picks = await pickCustomers(today);
    const c = await customerNamed("3333333333");
    assert.deepEqual(picks[0], { customerId: c.id, kind: "eposta", why: "takip" });
    assert.ok(picks.slice(1).every((p) => p.why === "oneri"));
  });

  test("a customer who said 'istemiyorum' gets a call suggestion, never an email", async () => {
    await db.update(schema.customer).set({ emailOptOutAt: new Date() }).where(eq(schema.customer.taxId, "3333333333"));
    const { pickCustomers } = await import("./assistant");
    const c = await customerNamed("3333333333");
    assert.equal((await pickCustomers(today)).find((p) => p.customerId === c.id)?.kind, "arama");
  });

  test("preparing the day stores one suggestion per customer, and running it again adds none", async () => {
    const { prepareDay } = await import("./assistant");
    const first = await prepareDay(now, fakeClient());
    assert.ok(first.prepared >= 1);
    const second = await prepareDay(now, fakeClient());
    assert.equal(second.prepared, 0);
    const c = await customerNamed("3333333333");
    const [s] = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.customerId, c.id));
    assert.equal(s.subject, draft.email_subject);
    assert.deepEqual(s.findings, draft.findings);
  });

  test("a refused draft is kept as failed with the reason", async () => {
    const { prepareDay } = await import("./assistant");
    const result = await prepareDay(now, fakeClient(true));
    assert.equal(result.prepared, 0);
    const failed = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.status, "basarisiz"));
    assert.ok(failed.length >= 1 && failed[0].error);
  });

  test("an email goes out only when a person sends it, once, and lands on the customer card", async () => {
    const { prepareDay } = await import("./assistant");
    const { sendSuggestionEmail, emailSignature } = await import("./suggestions");
    const { Forbidden } = await import("./guard");
    await prepareDay(now, fakeClient());
    const c = await customerNamed("3333333333");
    const [s] = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.customerId, c.id));
    const sent: { to: string[]; text: string; replyTo?: string; idempotencyKey: string }[] = [];
    const send = async (email: (typeof sent)[number]) => {
      sent.push(email);
    };

    const viewer = await adminWith("gorur");
    await assert.rejects(sendSuggestionEmail(viewer.headers, { id: s.id, subject: "x", body: "y", nextFollowUpOn: "" }, send), Forbidden);

    await sendSuggestionEmail(editor.headers, { id: s.id, subject: "Düzenlenmiş konu", body: "Düzenlenmiş metin", nextFollowUpOn: "2025-06-20" }, send);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, ["info@ornek.example"]);
    assert.equal(sent[0].replyTo, "artek@ferritnuve.com");
    assert.equal(sent[0].idempotencyKey, s.id);
    assert.ok(sent[0].text.endsWith(emailSignature));
    await assert.rejects(sendSuggestionEmail(editor.headers, { id: s.id, subject: "a", body: "b", nextFollowUpOn: "" }, send), /zaten işlendi/);

    const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
    assert.match(notes[0].body, /Düzenlenmiş konu/);
    assert.equal((await customerNamed("3333333333")).nextFollowUpOn, "2025-06-20");
  });

  test("a finished call writes the note, the day it was made, and marks the customer called", async () => {
    await db.update(schema.customer).set({ followUpChannel: "telefon", email: null }); // no address: every pick is a call
    const { prepareDay } = await import("./assistant");
    const { completeCall } = await import("./suggestions");
    await prepareDay(now, fakeClient());
    const calls = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.kind, "arama"));
    assert.ok(calls.length >= 2);

    await completeCall(editor.headers, { id: calls[0].id, note: "Teklif istediler.", calledOn: "2025-06-01", nextFollowUpOn: "" });
    const called = (await db.select().from(schema.customer).where(eq(schema.customer.id, calls[0].customerId)))[0];
    assert.equal(called.status, "arandi");
    const [s] = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.id, calls[0].id));
    assert.equal(s.doneOn, "2025-06-01");
    await assert.rejects(completeCall(editor.headers, { id: calls[1].id, note: "x", calledOn: "2999-01-01", nextFollowUpOn: "" }), /ileri bir tarih/);
  });

  // These run on the real calendar, since closing checks dates against today.
  describe("unfinished suggestions", () => {
    const day0 = istanbulDate(new Date());
    const at = (day: string) => new Date(`${day}T05:00:00Z`);
    const suggestionsOf = async (taxId: string) =>
      db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.customerId, (await customerNamed(taxId)).id));

    beforeEach(async () => {
      await db.update(schema.customer).set({ nextFollowUpOn: day0 }).where(eq(schema.customer.taxId, "3333333333"));
    });

    test("an open one blocks the assistant's own picks the next day, but a Takip date still comes, without doubling", async () => {
      const { prepareDay } = await import("./assistant");
      await prepareDay(at(day0), fakeClient());
      const day1 = addDays(day0, 1);
      // No invoices, so only its Takip date can bring it.
      await db.insert(schema.customer).values({ taxId: "5555555555", taxIdType: "VKN", name: "EEE", email: "e@ornek.example", nextFollowUpOn: day1 });

      const result = await prepareDay(at(day1), fakeClient());
      assert.ok(result.open >= 1);
      const day1Rows = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.forDay, day1));
      assert.deepEqual(
        day1Rows.map((s) => s.scheduled),
        [true],
      );
      assert.equal(day1Rows[0].customerId, (await customerNamed("5555555555")).id);
      // C was scheduled for day0 and is still open, so day1 doesn't prepare it again.
      assert.equal((await suggestionsOf("3333333333")).length, 1);
    });

    test("once every one is closed, more can be prepared the same day", async () => {
      const { prepareDay } = await import("./assistant");
      const { closeUndone } = await import("./suggestions");
      await prepareDay(at(day0), fakeClient());
      for (const s of await db.select().from(schema.assistantSuggestion)) {
        await closeUndone(editor.headers, { id: s.id, reason: "ulasilamadi" });
      }
      const { importInvoiceText } = await import("./invoices");
      const before = await prepareDay(at(day0), fakeClient()); // nothing open, but nobody new to pick yet
      assert.equal(before.open, 0);
      await importInvoiceText(editor.headers, { fileName: "5.pdf", sha256: "s5", text: invoiceText(5, "4444444444", "DDD MAKİNA A.Ş", "05-01-2025") });
      await db.update(schema.customer).set({ email: "d@ornek.example" }).where(eq(schema.customer.taxId, "4444444444"));
      const again = await prepareDay(at(day0), fakeClient());
      assert.equal(again.prepared, 1);
      assert.equal((await suggestionsOf("4444444444"))[0].forDay, day0);
    });

    test("couldn't be done: the reason is kept, and a closed business is never suggested again", async () => {
      const { prepareDay, pickCustomers } = await import("./assistant");
      const { closeUndone } = await import("./suggestions");
      await prepareDay(at(day0), fakeClient());
      const [s] = await suggestionsOf("3333333333");
      await assert.rejects(closeUndone(editor.headers, { id: s.id, reason: "diger" }), /Diğer/);
      await closeUndone(editor.headers, { id: s.id, reason: "kapandi", note: "Tabela inmiş." });
      const c = await customerNamed("3333333333");
      assert.equal(c.status, "kapandi");
      assert.equal(c.nextFollowUpOn, null);
      const [closed] = await suggestionsOf("3333333333");
      assert.equal(closed.status, "yapilamadi");
      assert.equal(closed.closeReason, "kapandi");
      await db.update(schema.customer).set({ nextFollowUpOn: addDays(day0, 2) }).where(eq(schema.customer.id, c.id));
      assert.ok(!(await pickCustomers(addDays(day0, 40))).some((p) => p.customerId === c.id));
      const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
      assert.match(notes[0].body, /Şirket kapanmış\. Tabela inmiş\./);
    });

    test("postponed: it comes back as a Takip on the chosen day", async () => {
      const { prepareDay, pickCustomers } = await import("./assistant");
      const { postponeSuggestion } = await import("./suggestions");
      await prepareDay(at(day0), fakeClient());
      const [s] = await suggestionsOf("3333333333");
      await assert.rejects(postponeSuggestion(editor.headers, { id: s.id, until: day0 }), /Bugünden sonraki/);
      const day7 = addDays(day0, 7);
      await postponeSuggestion(editor.headers, { id: s.id, until: day7 });
      assert.equal((await customerNamed("3333333333")).nextFollowUpOn, day7);
      const picks = await pickCustomers(day7);
      assert.equal(picks.find((p) => p.customerId === s.customerId)?.why, "takip");
    });

    test("waiting for approval: out of the way, then asked again every 3 days until it comes", async () => {
      const { prepareDay, openSuggestionCount } = await import("./assistant");
      const { waitForApproval, approvalArrived, sendSuggestionEmail } = await import("./suggestions");
      await prepareDay(at(day0), fakeClient());
      for (const s of await db.select().from(schema.assistantSuggestion)) {
        await waitForApproval(editor.headers, { id: s.id, waitingFor: "Fiyat onayı" });
      }
      assert.equal(await openSuggestionCount(day0), 0);
      const day3 = addDays(day0, 3);
      const back = await openSuggestionCount(day3);
      assert.ok(back >= 1);

      const [s] = await suggestionsOf("3333333333");
      assert.equal(s.askAgainOn, day3);
      await approvalArrived(editor.headers, s.id);
      const send = async () => {};
      await sendSuggestionEmail(editor.headers, { id: s.id, subject: "Konu", body: "Metin", nextFollowUpOn: "" }, send);
      const [sent] = await suggestionsOf("3333333333");
      assert.equal(sent.status, "gonderildi");
      assert.equal(sent.doneOn, day0);
      assert.equal(await openSuggestionCount(day3), back - 1);
    });
  });
});

describe("channel choice", () => {
  test("email only with an address and no opt-out; otherwise a call; nothing without any contact", async () => {
    const { channelFor } = await import("./contact-channel");
    const base = { id: "x", phone: "0212", email: "a@b.example", emailOptOutAt: null, followUpChannel: "eposta" as const };
    assert.equal(channelFor(base, "eposta"), "eposta");
    assert.equal(channelFor({ ...base, emailOptOutAt: new Date() }, "eposta"), "arama");
    assert.equal(channelFor({ ...base, phone: null }, "telefon"), "eposta");
    assert.equal(channelFor({ ...base, phone: null, email: null }, "telefon"), null);
  });
});
