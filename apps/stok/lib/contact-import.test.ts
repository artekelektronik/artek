import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("contact file upload", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");

  async function adminWith(level: "gorur" | "duzenler") {
    const signed = await signedInAs(["admin"]);
    await db.insert(schema.userPanel).values({ userId: signed.user.id, panel: "musteri", level });
    return signed;
  }

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    // Made-up customers; no real company.
    await db.insert(schema.customer).values([
      { taxId: "1111111111", taxIdType: "VKN", name: "ÖRNEK A.Ş", phone: "0212 999 99 99" },
      { taxId: "2222222222", taxIdType: "VKN", name: "DENEME LTD. ŞTİ" },
    ]);
  });

  test("fills empty fields only, skips weak matches, and needs edit rights", async () => {
    const { importContactsFile } = await import("./contact-import");
    const { Forbidden } = await import("./guard");
    const records = [
      { id: "1111111111", telefon: "0212 000 00 00", eposta: "info@ornek.example", guven: "yuksek", not: "ek alan yok sayılır" },
      { id: 2222222222, telefon: "0216 000 00 00", guven: "dusuk" },
    ];
    const viewer = await adminWith("gorur");
    await assert.rejects(importContactsFile(viewer.headers, records), Forbidden);

    const editor = await adminWith("duzenler");
    assert.deepEqual(await importContactsFile(editor.headers, records), { updated: 1, skipped: 1 });
    const [a] = await db.select().from(schema.customer).where(eq(schema.customer.taxId, "1111111111"));
    assert.equal(a.phone, "0212 999 99 99", "a phone typed on the card is kept");
    assert.equal(a.email, "info@ornek.example");
    const [b] = await db.select().from(schema.customer).where(eq(schema.customer.taxId, "2222222222"));
    assert.equal(b.phone, null);

    await assert.rejects(importContactsFile(editor.headers, { not: "a list" }), /beklenen biçimde/);
  });
});
