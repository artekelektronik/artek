import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// Stands in for the Anthropic client: no network, no cost. Records what it was asked.
function stub(answer: unknown, calls: unknown[] = []) {
  return {
    beta: {
      messages: {
        create: async (params: unknown) => {
          calls.push(params);
          return { stop_reason: "end_turn", model: "stub", content: [{ type: "text", text: JSON.stringify(answer) }] };
        },
      },
    },
  } as unknown as Anthropic;
}
const failing = { beta: { messages: { create: async () => ({ stop_reason: "refusal", model: "stub", content: [] }) } } } as unknown as Anthropic;

// Made-up firm only.
const reading = {
  firma: "Örnek Güç Sistemleri A.Ş.",
  sehir: "Kocaeli",
  sektor: "UPS / redresör",
  ozet: "Endüstriyel UPS ve redresör üretiyor.",
  neden: "Yeni bir ürün ailesi duyurdu.",
  maddeler: ["Kendi tesisinde üretiyor.", "İhracat yapıyor."],
  urun_hatlari: ["özel trafo", "ferrit nüve"],
  iletisim: { telefon: "", eposta: "info@ornekguc.example", form: "https://ornekguc.example/iletisim", linkedin: "" },
  kaynaklar: [{ baslik: "Ana sayfa", url: "https://ornekguc.example/" }],
  okunamadi: false,
};

describe("Aday from a link", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let editor: Awaited<ReturnType<typeof signedInAs>>;

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    editor = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: editor.user.id, panel: "musteri", level: "duzenler" });
  });

  test("a link fills a new Aday from that site only; the same site again opens the existing one", async () => {
    const { addLeadFromLink } = await import("./lead-research");
    const calls: unknown[] = [];
    const first = await addLeadFromLink(editor.headers, { link: "https://www.ornekguc.example/urunler" }, stub(reading, calls));
    assert.equal(first.existed, false);
    const tools = (calls[0] as { tools: { allowed_domains?: string[] }[] }).tools;
    assert.deepEqual(tools[0].allowed_domains, ["ornekguc.example"]);

    const [l] = await db.select().from(schema.lead);
    assert.deepEqual([l.name, l.website, l.city, l.sector, l.why], ["Örnek Güç Sistemleri A.Ş.", "ornekguc.example", "Kocaeli", "UPS / redresör", "Yeni bir ürün ailesi duyurdu."]);
    assert.equal(l.contact.email, "info@ornekguc.example");
    assert.deepEqual(l.siteResearch?.productLines, ["özel trafo", "ferrit nüve"]);

    const again = await addLeadFromLink(editor.headers, { link: "ornekguc.example" }, stub(reading));
    assert.deepEqual(again, { id: first.id, existed: true });
    assert.equal((await db.select().from(schema.lead)).length, 1);
  });

  test("a site that can't be read still makes a card from the link, saying so", async () => {
    const { addLeadFromLink } = await import("./lead-research");
    await addLeadFromLink(editor.headers, { link: "okunmayan.example" }, failing);
    const [l] = await db.select().from(schema.lead);
    assert.deepEqual([l.name, l.siteResearch], ["okunmayan.example", null]);
    assert.match(l.why ?? "", /Site okunamadı/);
  });

  test("a firm that is already a Müşteri is refused", async () => {
    const { addLeadFromLink } = await import("./lead-research");
    const { addCustomer } = await import("./crm");
    await addCustomer(editor.headers, { name: "ÖRNEK GÜÇ SİSTEMLERİ A.Ş.", taxId: "1111111111", city: "", phone: "", email: "", website: "" });
    await assert.rejects(addLeadFromLink(editor.headers, { link: "ornekguc.example" }, stub(reading)), /zaten müşterimiz/);
    assert.equal((await db.select().from(schema.lead)).length, 0);
  });

  test("the deeper run keeps its findings, when it ran and how long it took, and logs it", async () => {
    const { addLeadFromLink, deepResearchLead } = await import("./lead-research");
    const { id } = await addLeadFromLink(editor.headers, { link: "ornekguc.example" }, stub(reading));
    const deep = {
      ozet: "Büyüyor.",
      maddeler: ["Yeni tesis açtı."],
      urun_hatlari: ["özel trafo"],
      bulgular: [{ baslik: "Haber", url: "https://haber.example/a", tarih: "2026-10-20", ozet: "Yeni tesis." }],
    };
    await deepResearchLead(editor.headers, id, stub(deep));
    const [l] = await db.select().from(schema.lead);
    assert.deepEqual(l.deepResearch?.sources, [{ title: "Haber", url: "https://haber.example/a", date: "2026-10-20", summary: "Yeni tesis." }]);
    assert.ok(l.deepResearch?.at);
    assert.ok((await db.select().from(schema.activityLog)).some((r) => r.detail?.startsWith("Site + haber taraması: 1 kaynak")));

    await deepResearchLead(editor.headers, id, stub({ ...deep, bulgular: [] }));
    assert.deepEqual((await db.select().from(schema.lead))[0].deepResearch?.sources, []);
  });
});
