import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { openTestDatabase, skipWithoutDatabase } from "./test-database";

describe("auth", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let auth: typeof import("./auth").auth;

  before(async () => {
    db = await openTestDatabase();
    ({ auth } = await import("./auth"));
  });
  after(() => db.$client.end());

  test("nobody can sign up through the auth API", async () => {
    const email = `signup-${crypto.randomUUID()}@example.com`;
    const response = await auth.handler(
      new Request("http://localhost:3001/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3001" },
        body: JSON.stringify({ email, password: "a-long-password", name: "Kayıt denemesi" }),
      }),
    );

    assert.equal(response.status, 400);
    const created = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.email, email) });
    assert.equal(created, undefined);
  });
});
