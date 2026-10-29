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
  analysis: ["Şubattan beri alım yok.", "Yeni bir üretim hattı kurdular."],
  steps: ["Yeni hattı e-postada an", "Numune isteyip istemediğini sor"],
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
    assert.deepEqual(s.analysis, draft.analysis);
    assert.deepEqual(
      s.steps.map((x) => [x.text, x.doneAt]),
      draft.steps.map((t) => [t, null]),
    );
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

    // The call note is read like a card note: a new phone number becomes a proposal on it.
    const reading = {
      beta: {
        messages: {
          create: async () => ({
            content: [{ type: "text", text: JSON.stringify({ changes: [{ field: "phone", value: "0212 999 99 99" }], related_firm: null, relation: null, explanation: "Yeni numara." }) }],
          }),
        },
      },
    } as unknown as Anthropic;
    await completeCall(editor.headers, { id: calls[1].id, note: "Yeni numaraları 0212 999 99 99.", nextFollowUpOn: "" }, reading);
    const [callNote] = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, calls[1].customerId));
    assert.deepEqual(callNote.proposal?.changes, [{ field: "phone", value: "0212 999 99 99" }]);
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

    describe("close reasons", () => {
      const noteClient = (reply: object) =>
        ({
          beta: { messages: { create: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(reply) }] }) } },
        }) as unknown as Anthropic;
      async function openOne() {
        const { prepareDay } = await import("./assistant");
        await prepareDay(at(day0), fakeClient());
        return (await suggestionsOf("3333333333"))[0];
      }

      test("a new reason with 'tekrar öner' brings the customer back that many days later", async () => {
        const { saveReason, listReasons } = await import("./reasons");
        const { closeUndone } = await import("./suggestions");
        const { pickCustomers } = await import("./assistant");
        const { Forbidden } = await import("./guard");
        const viewer = await adminWith("gorur");
        await assert.rejects(saveReason(viewer.headers, { id: "", label: "Tatilde", effect: "tekrar", days: "14" }), Forbidden);
        await assert.rejects(saveReason(editor.headers, { id: "", label: "Tatilde", effect: "tekrar", days: "0" }), /1 ile 365/);
        await saveReason(editor.headers, { id: "", label: "Tatilde", effect: "tekrar", days: "14" });
        const tatil = (await listReasons()).at(-1)!;
        assert.equal(tatil.label, "Tatilde");

        const s = await openOne();
        await closeUndone(editor.headers, { id: s.id, reason: tatil.id });
        assert.equal((await customerNamed("3333333333")).nextFollowUpOn, addDays(day0, 14));
        assert.equal((await pickCustomers(addDays(day0, 14))).find((p) => p.customerId === s.customerId)?.why, "takip");
      });

      test("a removed reason is no longer offered, and suggestions closed with it keep it", async () => {
        const { archiveReason, listReasons, moveReason } = await import("./reasons");
        const { closeUndone } = await import("./suggestions");
        const s = await openOne();
        await closeUndone(editor.headers, { id: s.id, reason: "rakip" });
        await archiveReason(editor.headers, "rakip");
        assert.ok(!(await listReasons()).some((r) => r.id === "rakip"));
        assert.ok((await listReasons({ archived: true })).some((r) => r.id === "rakip"));
        assert.equal((await suggestionsOf("3333333333"))[0].closeReason, "rakip");

        await moveReason(editor.headers, "kapandi", "up");
        assert.deepEqual((await listReasons()).slice(0, 2).map((r) => r.id), ["kapandi", "ulasilamadi"]);
      });

      test("a free note is read into a proposal, which changes nothing until someone applies it", async () => {
        const { closeUndone } = await import("./suggestions");
        const { acceptProposal, rejectProposal } = await import("./reasons");
        const s = await openOne();
        const reply = { effect: "kapandi", days: null, new_name: "FFF ELEKTRONİK", explanation: "Firma kapanmış, yerine başka firma gelmiş." };
        await closeUndone(editor.headers, { id: s.id, reason: "diger", note: "Firma kapanmış, yerine FFF Elektronik açılmış." }, noteClient(reply));
        const [closed] = await suggestionsOf("3333333333");
        assert.deepEqual(closed.proposal, { effect: "kapandi", days: null, newName: "FFF ELEKTRONİK", explanation: reply.explanation });
        assert.notEqual((await customerNamed("3333333333")).status, "kapandi");

        await acceptProposal(editor.headers, closed.id);
        assert.equal((await customerNamed("3333333333")).status, "kapandi");
        const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, s.customerId));
        assert.ok(notes.some((n) => /Yeni unvan: FFF ELEKTRONİK/.test(n.body)));
        assert.equal((await customerNamed("3333333333")).name, "FFF ELEKTRONİK");
        const [renamed] = await db.select().from(schema.customerChange).where(eq(schema.customerChange.customerId, s.customerId));
        assert.deepEqual([renamed.field, renamed.oldValue, renamed.newValue, renamed.source], ["name", "CCC TRAFO LİMİTED ŞİRKETİ", "FFF ELEKTRONİK", "oneri"]);
        await assert.rejects(rejectProposal(editor.headers, closed.id), /zaten değerlendirildi/);
      });

      test("a rejected proposal leaves the customer as it was; a note with nothing to do makes no proposal", async () => {
        const { closeUndone } = await import("./suggestions");
        const { rejectProposal } = await import("./reasons");
        const s = await openOne();
        await closeUndone(editor.headers, { id: s.id, reason: "diger", note: "Ay sonu arayın." }, noteClient({ effect: "tekrar", days: 20, new_name: null, explanation: "Ay sonu." }));
        const [closed] = await suggestionsOf("3333333333");
        assert.equal(closed.proposal?.days, 20);
        await rejectProposal(editor.headers, closed.id);
        assert.equal((await customerNamed("3333333333")).nextFollowUpOn, null);

        const [other] = await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.status, "bekliyor"));
        await closeUndone(editor.headers, { id: other.id, reason: "diger", note: "Telefonu meşgul." }, noteClient({ effect: "not", days: null, new_name: null, explanation: "-" }));
        assert.equal((await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.id, other.id)))[0].proposal, null);
      });
    });

    describe("steps and newer invoices", () => {
      const uploadFor = async (n: number, day: string) => {
        const { importInvoiceText } = await import("./invoices");
        const [y, m, d] = day.split("-");
        await importInvoiceText(editor.headers, { fileName: `${n}.pdf`, sha256: `s${n}`, text: invoiceText(n, "3333333333", "CCC TRAFO LİMİTED ŞİRKETİ", `${d}-${m}-${y}`) });
      };

      test("a ticked step keeps who and when; unticking clears it", async () => {
        const { prepareDay } = await import("./assistant");
        const { toggleStep } = await import("./suggestions");
        await prepareDay(at(day0), fakeClient());
        const [s] = await suggestionsOf("3333333333");
        await toggleStep(editor.headers, { id: s.id, index: 1, done: true });
        let [after] = await suggestionsOf("3333333333");
        assert.equal(after.steps[1].doneBy, editor.user.name);
        assert.ok(after.steps[1].doneAt);
        assert.equal(after.steps[0].doneAt, null);
        await toggleStep(editor.headers, { id: s.id, index: 1, done: false });
        [after] = await suggestionsOf("3333333333");
        assert.equal(after.steps[1].doneAt, null);
        await assert.rejects(toggleStep(editor.headers, { id: s.id, index: 9, done: true }), /Adım bulunamadı/);
      });

      test("an invoice uploaded after the suggestion is pointed out until it is rewritten, which keeps the findings", async () => {
        const { prepareDay } = await import("./assistant");
        const { newerInvoices, refreshSuggestion, toggleStep } = await import("./suggestions");
        await prepareDay(at(day0), fakeClient());
        const [s] = await suggestionsOf("3333333333");
        assert.equal((await newerInvoices([s])).size, 0);

        await uploadFor(20, day0);
        assert.equal((await newerInvoices([s])).get(s.id)?.issuedOn, day0);

        await toggleStep(editor.headers, { id: s.id, index: 0, done: true });
        await refreshSuggestion(editor.headers, s.id, fakeClient());
        const [after] = await suggestionsOf("3333333333");
        assert.ok(after.refreshedAt);
        assert.deepEqual(after.findings, draft.findings);
        assert.equal(after.steps[0].doneAt, null);
        assert.match(after.reason, /^Takip günü geldi\. /);
        assert.equal((await newerInvoices([after])).size, 0);
      });

      test("'Artık gerek yok' closes it with the new invoice in the note", async () => {
        const { prepareDay } = await import("./assistant");
        const { closeNotNeeded } = await import("./suggestions");
        await prepareDay(at(day0), fakeClient());
        const [s] = await suggestionsOf("3333333333");
        await uploadFor(21, day0);
        await closeNotNeeded(editor.headers, s.id);
        const [after] = await suggestionsOf("3333333333");
        assert.equal(after.status, "atlandi");
        assert.match(after.closeNote ?? "", /Yeni fatura geldi: AAA2025000000021/);
        await assert.rejects(closeNotNeeded(editor.headers, s.id), /zaten kapatıldı/);
      });
    });

    describe("results", () => {
      // An email sent today and a call made today, each awaiting "Sonuç ne oldu?".
      async function doneBoth() {
        const { prepareDay } = await import("./assistant");
        const { sendSuggestionEmail, completeCall } = await import("./suggestions");
        await db.update(schema.customer).set({ email: null }).where(eq(schema.customer.taxId, "1111111111"));
        await db.update(schema.customer).set({ nextFollowUpOn: day0, followUpChannel: "telefon" }).where(eq(schema.customer.taxId, "1111111111"));
        await prepareDay(at(day0), fakeClient());
        const [mail] = await suggestionsOf("3333333333");
        const [call] = await suggestionsOf("1111111111");
        await sendSuggestionEmail(editor.headers, { id: mail.id, subject: "Konu", body: "Metin", nextFollowUpOn: "" }, async () => {});
        await completeCall(editor.headers, { id: call.id, note: "Konuştuk.", nextFollowUpOn: "" });
        return { mail, call };
      }

      test("asked 3 working days after the contact, not before, and it doesn't block new suggestions", async () => {
        const { resultsDue } = await import("./suggestions");
        const { openSuggestionCount } = await import("./assistant");
        const { addWorkingDays } = await import("./time");
        const { mail } = await doneBoth();
        const ask = addWorkingDays(day0, 3);
        assert.equal((await suggestionsOf("3333333333"))[0].resultAskOn, ask);
        assert.equal((await resultsDue(addDays(ask, -1))).length, 0);
        assert.ok((await resultsDue(ask)).some((r) => r.id === mail.id));
        assert.equal(await openSuggestionCount(ask), (await db.select().from(schema.assistantSuggestion).where(eq(schema.assistantSuggestion.status, "bekliyor"))).length);
      });

      test("each answer is recorded and moves the CRM status; 'Cevap yok' can schedule the next try", async () => {
        const { recordResult } = await import("./suggestions");
        const { mail, call } = await doneBoth();
        await recordResult(editor.headers, { id: mail.id, outcome: "siparis", note: "50 adet EE25." });
        assert.equal((await customerNamed("3333333333")).status, "siparis_geldi");
        assert.equal((await suggestionsOf("3333333333"))[0].outcome, "siparis");
        await assert.rejects(recordResult(editor.headers, { id: mail.id, outcome: "teklif" }), /zaten girildi/);

        const retry = addDays(day0, 10);
        await recordResult(editor.headers, { id: call.id, outcome: "cevap_yok", nextFollowUpOn: retry, followUpChannel: "eposta" });
        const c = await customerNamed("1111111111");
        assert.equal(c.nextFollowUpOn, retry);
        assert.equal(c.followUpChannel, "eposta");
        const notes = await db.select().from(schema.customerNote).where(eq(schema.customerNote.customerId, c.id));
        assert.ok(notes.some((n) => /Sonuç .*Cevap yok/.test(n.body)));
      });

      test("an invoice after the contact is pointed out", async () => {
        const { resultsDue } = await import("./suggestions");
        const { importInvoiceText } = await import("./invoices");
        const { addWorkingDays } = await import("./time");
        const { mail } = await doneBoth();
        const [y, m, d] = addDays(day0, 1).split("-");
        await importInvoiceText(editor.headers, { fileName: "9.pdf", sha256: "s9", text: invoiceText(9, "3333333333", "CCC TRAFO LİMİTED ŞİRKETİ", `${d}-${m}-${y}`) });
        const due = await resultsDue(addWorkingDays(day0, 3));
        assert.equal(due.find((r) => r.id === mail.id)?.invoiceAfter?.issuedOn, addDays(day0, 1));
        assert.equal(due.find((r) => r.customer.name.startsWith("AAA"))?.invoiceAfter, null);
      });

      test("'Sonra sor' asks again later, twice at most, then records 'girilmedi'", async () => {
        const { askResultLater } = await import("./suggestions");
        const { addWorkingDays } = await import("./time");
        const { mail } = await doneBoth();
        await askResultLater(editor.headers, mail.id);
        let [s] = await suggestionsOf("3333333333");
        assert.equal(s.resultAskOn, addWorkingDays(day0, 3));
        assert.equal(s.resultAsks, 1);
        await askResultLater(editor.headers, mail.id);
        await askResultLater(editor.headers, mail.id);
        [s] = await suggestionsOf("3333333333");
        assert.equal(s.outcome, "girilmedi");
        await assert.rejects(askResultLater(editor.headers, mail.id), /zaten girildi/);
      });
    });
  });
});

describe("working days", () => {
  test("weekends are skipped", async () => {
    const { addWorkingDays } = await import("./time");
    assert.equal(addWorkingDays("2026-10-26", 3), "2026-10-29"); // Monday → Thursday
    assert.equal(addWorkingDays("2026-10-30", 3), "2026-11-04"); // Friday → Wednesday
    assert.equal(addWorkingDays("2026-10-31", 3), "2026-11-04"); // Saturday → Wednesday
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
