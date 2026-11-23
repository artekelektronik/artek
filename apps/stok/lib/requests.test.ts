import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

// Made-up people only.
describe("Talepler", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
  });
  beforeEach(resetTestDatabase);

  test("a site request is saved, logged and emailed with everything needed to answer", async () => {
    const { createRequest, listRequests } = await import("./requests");
    await createRequest({ name: "Deneme Kişi", contact: "0555 000 00 00", message: "ETD39 nüve ve karkas, 200 adet.", subject: "ETD39", productCode: "X-1", pageUrl: "https://www.ferritnuve.com/products/etd39", photoUrl: "https://blob.example/p.jpg" });
    await createRequest({ name: "Deneme Kişi", contact: "0555 000 00 00", message: "İkinci talep, toroid." });

    const rows = await listRequests();
    assert.equal(rows.length, 2); // the same person twice is two requests
    assert.ok(rows.every((r) => r.status === "yeni"));

    const emails = await db.select().from(schema.notification);
    assert.equal(emails.length, 2);
    const first = emails.find((e) => e.subject.includes("ETD39"))!;
    assert.deepEqual(first.recipients, ["merve@ferritnuve.com"]);
    for (const part of ["Deneme Kişi", "0555 000 00 00", "200 adet", "Kod: X-1", "https://blob.example/p.jpg", "/products/etd39", "/musteriler/talepler"]) assert.ok(first.body.includes(part), part);

    const log = await db.select().from(schema.activityLog);
    assert.deepEqual(log.map((l) => [l.entity, l.action, l.via]), [["talep", "eklendi", "site"], ["talep", "eklendi", "site"]]);
  });

  test("a request without a name, a contact or a need is refused and nothing is emailed", async () => {
    const { createRequest } = await import("./requests");
    const { UserError } = await import("./errors");
    await assert.rejects(createRequest({ name: "A", contact: "0555 000 00 00", message: "ETD39 lazım." }), UserError);
    await assert.rejects(createRequest({ name: "Deneme", contact: "", message: "ETD39 lazım." }), UserError);
    await assert.rejects(createRequest({ name: "Deneme", contact: "a@ornek.example", message: "" }), UserError);
    assert.equal((await db.select().from(schema.notification)).length, 0);
  });

  test("the site endpoint needs its token, and a broken form is refused with a readable reason", async () => {
    process.env.TALEPLER_TOKEN = "test-token";
    const { POST } = await import("../app/api/talepler/route");
    const form = () => {
      const body = new FormData();
      body.set("name", "Deneme Kişi");
      return body;
    };
    const denied = await POST(new Request("http://x/api/talepler", { method: "POST", body: form(), headers: { authorization: "Bearer yanlis" } }));
    assert.equal(denied.status, 401);
    const bad = await POST(new Request("http://x/api/talepler", { method: "POST", body: form(), headers: { authorization: "Bearer test-token" } }));
    assert.equal(bad.status, 400);
    assert.match((await bad.json()).error, /E-posta veya telefon/);
    const photo = form();
    photo.set("photo", new File(["x"], "a.pdf", { type: "application/pdf" }));
    const wrongFile = await POST(new Request("http://x/api/talepler", { method: "POST", body: photo, headers: { authorization: "Bearer test-token" } }));
    assert.match((await wrongFile.json()).error, /JPEG, PNG veya WebP/);
    assert.equal((await db.select().from(schema.quoteRequest)).length, 0);
  });

  test("only the Müşteri paneli can mark a request, and each change is logged with who did it", async () => {
    const { createRequest, listRequests, setRequestStatus } = await import("./requests");
    const { Forbidden } = await import("./guard");
    const id = await createRequest({ name: "Deneme Kişi", contact: "a@ornek.example", message: "Toroid nüve arıyorum." });
    const admin = await signedInAs(["admin"]);
    await assert.rejects(setRequestStatus(admin.headers, { id, status: "yanitlandi" }), Forbidden);

    await db.insert(schema.userPanel).values({ userId: admin.user.id, panel: "musteri", level: "duzenler" });
    await setRequestStatus(admin.headers, { id, status: "yanitlandi" });
    const [row] = await listRequests();
    assert.equal(row.status, "yanitlandi");
    assert.equal(row.statusBy, admin.user.name);
    const log = await db.select().from(schema.activityLog);
    assert.ok(log.some((l) => l.action === "duzenlendi" && l.detail === "Yeni → Yanıtlandı" && l.userId === admin.user.id));
  });
});
