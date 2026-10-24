import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Email } from "./outbox";
import { lokasyonIdsByName, openTestDatabase, resetTestDatabase, signedInAs, skipWithoutDatabase } from "./test-database";

describe("user management", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let admin: typeof import("./user-admin");
  let auth: typeof import("./auth")["auth"];
  let guard: typeof import("./guard");
  let schema: typeof import("../db/schema");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let sent: Email[];
  const send = async (email: Email) => {
    sent.push(email);
  };

  const tokenFrom = (email: Email) => new URL(email.text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;

  async function signIn(email: string, password: string) {
    const { headers } = await auth.api.signInEmail({ body: { email, password }, returnHeaders: true });
    return new Headers({ cookie: headers.getSetCookie().map((c) => c.split(";")[0]).join("; ") });
  }

  async function auditFor(userId: string) {
    const { eq, asc } = await import("drizzle-orm");
    return db.select().from(schema.auditLog).where(eq(schema.auditLog.targetUserId, userId)).orderBy(asc(schema.auditLog.createdAt));
  }

  before(async () => {
    db = await openTestDatabase();
    admin = await import("./user-admin");
    auth = (await import("./auth")).auth;
    guard = await import("./guard");
    schema = await import("../db/schema");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    lokasyon = await lokasyonIdsByName();
    sent = [];
  });
  after(() => db.$client.end());

  test("an invited user gets the email, sets a password and signs in with exactly the access assigned", async () => {
    const yonetici = await signedInAs(["admin"]);
    const karakoy = lokasyon["Karaköy Mağaza"];

    const invited = await admin.inviteUser(
      yonetici.headers,
      { email: " Ayse@Example.com ", name: "Ayşe Yılmaz", roles: ["magaza_sorumlusu"], lokasyonIds: [karakoy] },
      send,
    );

    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, ["ayse@example.com"]);
    assert.match(sent[0].subject, /hesabınız açıldı/);
    await assert.rejects(signIn("ayse@example.com", "anything-at-all"), "no password yet, so no sign-in");

    await auth.api.resetPassword({ body: { token: tokenFrom(sent[0]), newPassword: "ayse-secret-1" } });
    const actor = await guard.loadActor(await signIn("ayse@example.com", "ayse-secret-1"));

    assert.deepEqual(actor, { userId: invited.id, roles: ["magaza_sorumlusu"], lokasyonIds: [karakoy] });
    const history = (await auditFor(invited.id)).map((a) => a.action);
    assert.deepEqual(history, ["user.invite", "user.password_link", "user.password_set"]);
  });

  test("an invite link works once", async () => {
    const yonetici = await signedInAs(["admin"]);
    await admin.inviteUser(yonetici.headers, { email: "a@example.com", name: "A", roles: ["muhendis"], lokasyonIds: [] }, send);
    const token = tokenFrom(sent[0]);
    await auth.api.resetPassword({ body: { token, newPassword: "first-password" } });
    await assert.rejects(auth.api.resetPassword({ body: { token, newPassword: "second-password" } }));
  });

  test("a failed invite email keeps the user and can be sent again", async () => {
    const yonetici = await signedInAs(["admin"]);
    const failing = async () => {
      throw new Error("Resend 500");
    };
    await assert.rejects(
      admin.inviteUser(yonetici.headers, { email: "b@example.com", name: "B", roles: ["muhendis"], lokasyonIds: [] }, failing),
      /davet e-postası gönderilemedi.*Resend 500/,
    );
    const [user] = (await admin.listUsers(yonetici.headers)).filter((u) => u.email === "b@example.com");
    assert.equal(user.invited, true);

    await admin.sendPasswordLinkTo(yonetici.headers, user.id, send);
    assert.match(sent[0].subject, /hesabınız açıldı/, "still an invite until a password is set");
  });

  test("an existing email can't be invited twice", async () => {
    const yonetici = await signedInAs(["admin"]);
    await admin.inviteUser(yonetici.headers, { email: "c@example.com", name: "C", roles: ["muhendis"], lokasyonIds: [] }, send);
    await assert.rejects(
      admin.inviteUser(yonetici.headers, { email: "C@example.com", name: "C2", roles: ["muhendis"], lokasyonIds: [] }, send),
      /zaten var/,
    );
  });

  test("deactivating ends sessions and blocks sign-in; past movements keep the name", async () => {
    const yonetici = await signedInAs(["admin"]);
    const depo = await signedInAs(["depo_sorumlusu"], [lokasyon["Çekmeköy İmalathane"]]);
    const [product] = await db
      .insert(schema.product)
      .values({ code: "ART-U1", name: "Toroid", category: "Ferrit", isTradeGoods: true, isMaterial: false, unit: "adet", showOnSite: false })
      .returning();
    const { recordReceipt } = await import("./receipts");
    await recordReceipt(depo.headers, {
      lokasyonId: lokasyon["Çekmeköy İmalathane"],
      supplier: "TDK",
      reference: "İ-1",
      lines: [{ productId: product.id, quantity: "5" }],
      idempotencyKey: crypto.randomUUID(),
    });

    await admin.deactivateUser(yonetici.headers, depo.user.id);

    assert.equal(await auth.api.getSession({ headers: depo.headers }), null);
    await assert.rejects(guard.loadActor(depo.headers), guard.NotSignedIn);
    await assert.rejects(signIn(depo.user.email, "a-long-password"));
    const { listMovements } = await import("./ledger");
    const [movement] = await listMovements(yonetici.headers, { productId: product.id });
    assert.equal(movement.userName, depo.user.name);

    await admin.reactivateUser(yonetici.headers, depo.user.id);
    await signIn(depo.user.email, "a-long-password");
  });

  test("deactivating voids unused password links, and none can be sent while deactivated", async () => {
    const yonetici = await signedInAs(["admin"]);
    const invited = await admin.inviteUser(yonetici.headers, { email: "d@example.com", name: "D", roles: ["muhendis"], lokasyonIds: [] }, send);
    await admin.deactivateUser(yonetici.headers, invited.id);

    await assert.rejects(auth.api.resetPassword({ body: { token: tokenFrom(sent[0]), newPassword: "too-late-now" } }));
    await assert.rejects(admin.sendPasswordLinkTo(yonetici.headers, invited.id, send), /Etkin olmayan/);
  });

  test("the last active admin can't be deactivated or lose the admin role", async () => {
    const yonetici = await signedInAs(["admin"]);

    await assert.rejects(admin.deactivateUser(yonetici.headers, yonetici.user.id), /Son aktif yönetici/);
    await assert.rejects(
      admin.updateAccess(yonetici.headers, yonetici.user.id, { roles: ["muhendis"], lokasyonIds: [] }),
      /Son aktif yönetici/,
    );

    const ikinci = await signedInAs(["admin"]);
    await admin.deactivateUser(ikinci.headers, yonetici.user.id);
    await assert.rejects(admin.deactivateUser(ikinci.headers, ikinci.user.id), /Son aktif yönetici/, "a deactivated admin doesn't count");
  });

  test("two admins removing each other at once: exactly one succeeds", async () => {
    const a = await signedInAs(["admin"]);
    const b = await signedInAs(["admin"]);

    const results = await Promise.allSettled([admin.deactivateUser(a.headers, b.user.id), admin.deactivateUser(b.headers, a.user.id)]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const { eq, isNull, and } = await import("drizzle-orm");
    const active = await db
      .select()
      .from(schema.userRole)
      .innerJoin(schema.user, eq(schema.user.id, schema.userRole.userId))
      .where(and(eq(schema.userRole.role, "admin"), isNull(schema.user.deactivatedAt)));
    assert.equal(active.length, 1);
  });

  test("every access change is audited with who, when, before and after", async () => {
    const yonetici = await signedInAs(["admin"]);
    const target = await signedInAs(["depo_sorumlusu"], [lokasyon["Çekmeköy İmalathane"]]);

    await admin.updateAccess(yonetici.headers, target.user.id, {
      roles: ["depo_sorumlusu", "magaza_sorumlusu"],
      lokasyonIds: [lokasyon["Karaköy Mağaza"]],
    });
    await admin.updateAccess(yonetici.headers, target.user.id, {
      roles: ["magaza_sorumlusu", "depo_sorumlusu"],
      lokasyonIds: [lokasyon["Karaköy Mağaza"]],
    });
    await admin.deactivateUser(yonetici.headers, target.user.id);

    const entries = await auditFor(target.user.id);
    assert.deepEqual(
      entries.map((e) => e.action),
      ["user.access", "user.deactivate"],
      "an unchanged save writes nothing",
    );
    const [change] = entries;
    assert.equal(change.actorId, yonetici.user.id);
    assert.ok(change.createdAt instanceof Date);
    assert.deepEqual(change.before, { roles: ["depo_sorumlusu"], lokasyonIds: [lokasyon["Çekmeköy İmalathane"]], active: true });
    assert.deepEqual(change.after, {
      roles: ["depo_sorumlusu", "magaza_sorumlusu"],
      lokasyonIds: [lokasyon["Karaköy Mağaza"]],
      active: true,
    });

    const { sql } = await import("drizzle-orm");
    await assert.rejects(
      db.execute(sql`delete from audit_log`),
      (error: { cause?: Error }) => /değiştirilemez/.test(error.cause?.message ?? ""),
      "the audit log is append-only",
    );
  });

  test("only admins can reach user management", async () => {
    const yonetici = await signedInAs(["admin"]);
    const muhendis = await signedInAs(["muhendis"]);
    const id = yonetici.user.id;
    const access = { roles: ["muhendis" as const], lokasyonIds: [] };

    for (const attempt of [
      () => admin.listUsers(muhendis.headers),
      () => admin.getUserDetail(muhendis.headers, id),
      () => admin.inviteUser(muhendis.headers, { email: "x@example.com", name: "X", ...access }, send),
      () => admin.updateAccess(muhendis.headers, muhendis.user.id, { roles: ["admin"], lokasyonIds: [] }),
      () => admin.deactivateUser(muhendis.headers, id),
      () => admin.reactivateUser(muhendis.headers, id),
      () => admin.sendPasswordLinkTo(muhendis.headers, id, send),
      () => admin.endSessions(muhendis.headers, id),
    ]) {
      await assert.rejects(attempt(), guard.Forbidden);
    }
    assert.equal(sent.length, 0);
  });

  test("user management never returns a password or its hash", async () => {
    const yonetici = await signedInAs(["admin"]);
    const { eq } = await import("drizzle-orm");
    const [credential] = await db.select().from(schema.account).where(eq(schema.account.userId, yonetici.user.id));

    const shown = JSON.stringify([await admin.listUsers(yonetici.headers), await admin.getUserDetail(yonetici.headers, yonetici.user.id)]);

    assert.ok(credential.password);
    assert.equal(shown.includes(credential.password!), false);
    assert.equal(shown.includes("a-long-password"), false);
    assert.equal(/"password"/.test(shown), false);
  });

  test("forgot password: an active user gets a working link; deactivated and unknown emails get nothing", async () => {
    const yonetici = await signedInAs(["admin"]);
    const aktif = await signedInAs(["muhendis"]);
    const pasif = await signedInAs(["muhendis"]);
    await admin.deactivateUser(yonetici.headers, pasif.user.id);

    // Stand in for Resend's API; Better Auth sends through it.
    const resend: { to: string[]; text: string }[] = [];
    const realFetch = globalThis.fetch;
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM = "Artek Stok <stok@example.com>";
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith("https://api.resend.com/")) {
        resend.push(JSON.parse(String(init?.body)));
        return new Response("{}", { status: 200 });
      }
      return realFetch(input, init);
    }) as typeof fetch;
    try {
      for (const email of [aktif.user.email, pasif.user.email, "kimse@example.com"]) {
        const reply = await auth.api.requestPasswordReset({ body: { email, redirectTo: "/sifre-belirle" } });
        assert.equal(reply.status, true, "the same answer for every email");
      }
    } finally {
      globalThis.fetch = realFetch;
      delete process.env.RESEND_API_KEY;
      delete process.env.RESEND_FROM;
    }

    assert.deepEqual(resend.map((e) => e.to), [[aktif.user.email]]);
    const token = new URL(resend[0].text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;
    await auth.api.resetPassword({ body: { token, newPassword: "a-new-password" } });
    await signIn(aktif.user.email, "a-new-password");
    assert.equal(await auth.api.getSession({ headers: aktif.headers }), null, "old sessions end");
  });

  test("ending sessions signs the user out everywhere", async () => {
    const yonetici = await signedInAs(["admin"]);
    const muhendis = await signedInAs(["muhendis"]);
    await admin.endSessions(yonetici.headers, muhendis.user.id);
    assert.equal(await auth.api.getSession({ headers: muhendis.headers }), null);
  });
});
