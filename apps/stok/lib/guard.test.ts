import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, skipWithoutDatabase } from "./test-database";

describe("requirePermission", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let guard: typeof import("./guard");
  let schema: typeof import("../db/schema");
  const lokasyon: Record<string, string> = {};
  let depoSorumlusu: { id: string; email: string };
  let muhendis: { id: string; email: string };

  // Signs in through the real auth API and returns headers carrying that session's cookie.
  async function signedIn(email: string) {
    const { auth } = await import("./auth");
    const { headers } = await auth.api.signInEmail({
      body: { email, password: "a-long-password" },
      returnHeaders: true,
    });
    const cookie = headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    return new Headers({ cookie });
  }

  before(async () => {
    db = await openTestDatabase();
    guard = await import("./guard");
    schema = await import("../db/schema");
    const { createUser } = await import("./users");
    for (const row of await db.select().from(schema.lokasyon)) lokasyon[row.name] = row.id;

    const suffix = crypto.randomUUID();
    depoSorumlusu = await createUser({
      email: `depo-${suffix}@example.com`,
      name: "Depo Sorumlusu",
      password: "a-long-password",
      roles: ["depo_sorumlusu"],
      lokasyonIds: [lokasyon["Karaköy Mağaza"]],
    });
    muhendis = await createUser({
      email: `muhendis-${suffix}@example.com`,
      name: "Mühendis",
      password: "a-long-password",
      roles: ["muhendis"],
    });
  });
  after(async () => {
    const { inArray } = await import("drizzle-orm");
    await db.delete(schema.user).where(inArray(schema.user.id, [depoSorumlusu.id, muhendis.id]));
    await db.$client.end();
  });

  test("Lokasyon are rows in the database", () => {
    assert.ok(lokasyon["Çekmeköy İmalathane"]);
    assert.ok(lokasyon["Karaköy Mağaza"]);
  });

  test("a user acts in their own Lokasyon", async () => {
    const actor = await guard.requirePermission(await signedIn(depoSorumlusu.email), "stock.receive", lokasyon["Karaköy Mağaza"]);
    assert.equal(actor.userId, depoSorumlusu.id);
  });

  test("a crafted request for another Lokasyon is refused", async () => {
    const headers = await signedIn(depoSorumlusu.email);
    await assert.rejects(guard.requirePermission(headers, "stock.receive", lokasyon["Çekmeköy İmalathane"]), guard.Forbidden);
    await assert.rejects(guard.requirePermission(headers, "stock.out", crypto.randomUUID()), guard.Forbidden);
    await assert.rejects(guard.requirePermission(headers, "count.perform"), guard.Forbidden);
  });

  test("an action the role doesn't allow is refused even in the user's own Lokasyon", async () => {
    await assert.rejects(
      guard.requirePermission(await signedIn(depoSorumlusu.email), "count.approve", lokasyon["Karaköy Mağaza"]),
      guard.Forbidden,
    );
  });

  test("mühendis acts in every Lokasyon", async () => {
    const headers = await signedIn(muhendis.email);
    await guard.requirePermission(headers, "stock.receive", lokasyon["Çekmeköy İmalathane"]);
    await guard.requirePermission(headers, "count.approve", lokasyon["Karaköy Mağaza"]);
  });

  test("a request without a valid session is refused", async () => {
    await assert.rejects(guard.requirePermission(new Headers(), "products.view"), guard.NotSignedIn);
    await assert.rejects(
      guard.requirePermission(new Headers({ cookie: "better-auth.session_token=forged.token" }), "products.view"),
      guard.NotSignedIn,
    );
  });
});
