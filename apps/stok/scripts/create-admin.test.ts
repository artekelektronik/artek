import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, resetTestDatabase, skipWithoutDatabase } from "../lib/test-database";

describe("first-admin script", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let auth: typeof import("../lib/auth").auth;
  let createFirstAdmin: typeof import("./create-admin").createFirstAdmin;

  before(async () => {
    db = await openTestDatabase();
    ({ auth } = await import("../lib/auth"));
    ({ createFirstAdmin } = await import("./create-admin"));
    // The script only runs while no admin exists.
    await resetTestDatabase();
  });
  after(async () => {
    await resetTestDatabase();
    await db.$client.end();
  });

  test("creates an admin who can sign in", async () => {
    await createFirstAdmin({ email: "Yonetici@Example.com", name: "İlk Yönetici", password: "a-long-password" });

    const { user } = await auth.api.signInEmail({
      body: { email: "yonetici@example.com", password: "a-long-password" },
    });
    const roles = await db.query.userRole.findMany({ where: (r, { eq }) => eq(r.userId, user.id) });
    assert.deepEqual(roles.map((r) => r.role), ["admin"]);
  });

  test("refuses to run once an admin exists", async () => {
    await assert.rejects(
      createFirstAdmin({ email: "ikinci@example.com", name: "İkinci", password: "a-long-password" }),
      /zaten bir yönetici var/,
    );
  });

  test("refuses a password shorter than 8 characters", async () => {
    await resetTestDatabase();
    await assert.rejects(
      createFirstAdmin({ email: "kisa@example.com", name: "Kısa", password: "short" }),
      /en az 8 karakter/,
    );
  });
});
