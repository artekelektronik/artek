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

  test("an invoice is logged when uploaded and when confirmed, the first confirmation adds its Müşteri, and a repeat logs nothing", async () => {
    const { importAndConfirm } = await import("./test-database");
    await importAndConfirm(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importAndConfirm(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importAndConfirm(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    const rows = await log();
    assert.deepEqual(
      rows.map((r) => [r.entity, r.action, r.detail, r.userId]).sort(),
      [
        ["fatura", "eklendi", "a.pdf", editor.user.id],
        ["fatura", "eklendi", "b.pdf", editor.user.id],
        ["fatura", "onaylandi", "Stok değişmedi", editor.user.id],
        ["fatura", "onaylandi", "Stok değişmedi", editor.user.id],
        ["musteri", "eklendi", "İlk faturasıyla", editor.user.id],
      ],
    );
  });

  test("hand edits, firm links and Aday work are logged with who did them", async () => {
    const { importAndConfirm } = await import("./test-database");
    const { updateCustomer } = await import("./crm");
    const { addLink } = await import("./firm-links");
    const { importLeads, updateLead } = await import("./leads");
    await importAndConfirm(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    await importAndConfirm(editor.headers, { fileName: "b.pdf", sha256: "s2", text: invoiceText(2, "2222222222", "BBB MAKİNA A.Ş") });
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
    const { importAndConfirm } = await import("./test-database");
    const { listActivity } = await import("./activity");
    await importAndConfirm(editor.headers, { fileName: "a.pdf", sha256: "s1", text: invoiceText(1, "1111111111", "AAA ELEKTRONİK LTD ŞTİ") });
    const crmOnly = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: crmOnly.user.id, panel: "musteri", level: "gorur" });
    assert.deepEqual((await listActivity(editor.headers)).map((r) => r.entity).sort(), ["fatura", "fatura", "musteri"]);
    assert.deepEqual((await listActivity(crmOnly.headers)).map((r) => r.entity), ["musteri"]);
  });

  describe("products, prices and reports", () => {
    const ferrit = { code: "ART-1", name: "EE 25", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet" as const, showOnSite: false };

    test("a product edit logs what changed, and a save with no change logs nothing", async () => {
      const { createProduct, updateProduct, archiveProduct, restoreProduct, setShowOnSite } = await import("./products");
      const created = await createProduct(editor.headers, ferrit);
      await updateProduct(editor.headers, created.id, ferrit);
      await updateProduct(editor.headers, created.id, { ...ferrit, name: "EE 25/13", minLevel: "5", shelves: {} });
      await setShowOnSite(editor.headers, created.id, true);
      await archiveProduct(editor.headers, created.id);
      await restoreProduct(editor.headers, created.id);
      const rows = (await log()).filter((r) => r.entity === "urun");
      assert.deepEqual(rows.map((r) => r.action).sort(), ["arsivlendi", "duzenlendi", "duzenlendi", "eklendi", "geri_alindi"]);
      assert.ok(rows.some((r) => r.detail === "Ad: EE 25 → EE 25/13; Kritik seviye: — → 5"));
      assert.ok(rows.every((r) => r.userId === editor.user.id));
    });

    test("a price save logs old and new for the rows that changed, and 100 stays 100", async () => {
      const { createProduct } = await import("./products");
      const { savePrices } = await import("./prices");
      const created = await createProduct(editor.headers, ferrit);
      const line = { productId: created.id, purchasePrice: "100", purchaseCurrency: "USD" as const, salePrice: "", saleCurrency: "TRY" as const };
      await savePrices(editor.headers, [line]);
      await savePrices(editor.headers, [line]);
      await savePrices(editor.headers, [{ ...line, salePrice: "12,5" }]);
      await savePrices(editor.headers, [{ ...line, salePrice: "12,5", salePriceA: "10", salePriceC: "15" }]);
      const rows = (await log()).filter((r) => r.entity === "fiyat").map((r) => [r.action, r.detail]);
      assert.deepEqual(rows.sort(), [
        ["duzenlendi", "Satış A: — → 10 TL; Satış C: — → 15 TL"],
        ["duzenlendi", "Satış B: — → 12,5 TL"],
        ["eklendi", "Alış: — → 100 USD"],
      ]);
    });

    test("stock movements and user changes show too, but prices only with the Finans paneli", async () => {
      const { createProduct } = await import("./products");
      const { savePrices } = await import("./prices");
      const { loadActivity, listActivity } = await import("./activity");
      const created = await createProduct(editor.headers, ferrit);
      await savePrices(editor.headers, [{ productId: created.id, purchasePrice: "1", purchaseCurrency: "USD", salePrice: "", saleCurrency: "TRY" }]);
      const plainAdmin = await signedInAs(["admin"]);
      const seen = (await listActivity(plainAdmin.headers)).map((r) => r.entity);
      assert.ok(seen.includes("urun"));
      assert.ok(!seen.includes("fiyat"));
      assert.ok((await loadActivity({ finance: true, crm: true })).some((r) => r.entity === "fiyat"));
      const muhendis = await signedInAs(["muhendis"]);
      await assert.rejects(listActivity(muhendis.headers));
    });

    test("the morning reports go out once, with prices only to Finans holders, and a quiet day sends nothing", async () => {
      const { createProduct } = await import("./products");
      const { savePrices } = await import("./prices");
      const { queueActivityReports } = await import("./activity-report");
      const plainAdmin = await signedInAs(["admin"]);
      const created = await createProduct(editor.headers, ferrit);
      await savePrices(editor.headers, [{ productId: created.id, purchasePrice: "7", purchaseCurrency: "USD", salePrice: "", saleCurrency: "TRY" }]);

      const reports = async () => (await db.select().from(schema.notification)).filter((n) => n.kind.startsWith("islem_"));
      const tomorrow = new Date(Date.now() + 86_400_000);
      const inSevenDays = new Date(Date.now() + 7 * 86_400_000);
      const monday = [tomorrow, ...Array.from({ length: 6 }, (_, i) => new Date(Date.now() + (i + 2) * 86_400_000))].find((d) => d.getUTCDay() === 1) ?? inSevenDays;

      assert.ok((await queueActivityReports(tomorrow)).includes("islem_gunluk"));
      const daily = (await reports()).filter((r) => r.kind === "islem_gunluk");
      assert.ok(daily.some((r) => r.body.includes("Alış: — → 7 USD") && r.recipients.includes(editor.user.email)));
      assert.ok(daily.every((r) => !(r.body.includes("Alış: — → 7 USD") && r.recipients.includes(plainAdmin.user.email))));

      assert.ok((await queueActivityReports(monday)).includes("islem_haftalik"));
      const weekly = (await reports()).filter((r) => r.kind === "islem_haftalik");
      assert.ok(weekly.some((r) => r.body.includes("Fiyat 1") && r.recipients.includes(editor.user.email)));
      assert.ok(weekly.every((r) => !(r.body.includes("Fiyat 1") && r.recipients.includes(plainAdmin.user.email))));

      const count = (await reports()).length;
      await queueActivityReports(monday);
      assert.equal((await reports()).length, count);

      const farAway = new Date(monday.getTime() + 30 * 86_400_000);
      assert.deepEqual(await queueActivityReports(farAway), []);
    });
  });
});
