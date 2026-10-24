import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  lokasyonIdsByName,
  openTestDatabase,
  resetTestDatabase,
  signedInAs,
  skipWithoutDatabase,
} from "./test-database";

describe("Kritik seviye warnings", { skip: skipWithoutDatabase }, () => {
  let db: Awaited<ReturnType<typeof openTestDatabase>>;
  let schema: typeof import("../db/schema");
  let outbox: typeof import("./outbox");
  let lokasyon: Awaited<ReturnType<typeof lokasyonIdsByName>>;
  let admin: Awaited<ReturnType<typeof signedInAs>>;
  let muhendis: Awaited<ReturnType<typeof signedInAs>>;
  let depoSorumlusu: Awaited<ReturnType<typeof signedInAs>>;
  let core: string;
  const key = () => crypto.randomUUID();

  const ferrit = {
    code: "T-CORE",
    name: "EE 25",
    category: "Ferrit",
    isTradeGoods: true,
    isMaterial: false,
    unit: "adet" as const,
    showOnSite: true,
  };

  async function move(direction: "in" | "out", quantity: string) {
    if (direction === "in") {
      const { recordReceipt } = await import("./receipts");
      return recordReceipt(muhendis.headers, {
        lokasyonId: lokasyon["Karaköy Mağaza"],
        supplier: "TDK",
        reference: "İrsaliye",
        lines: [{ productId: core, quantity }],
        idempotencyKey: key(),
      });
    }
    const { recordStockOut } = await import("./stock-out");
    return recordStockOut(muhendis.headers, {
      type: "satis_teslimati",
      lokasyonId: lokasyon["Karaköy Mağaza"],
      reason: "Satış",
      lines: [{ productId: core, quantity }],
      idempotencyKey: key(),
    });
  }
  const notifications = () => db.select().from(schema.notification);

  before(async () => {
    db = await openTestDatabase();
    schema = await import("../db/schema");
    outbox = await import("./outbox");
  });
  beforeEach(async () => {
    await resetTestDatabase();
    // The migration's default recipients, restored after truncation.
    await db.insert(schema.notificationSetting).values({ key: "kritik_seviye", roles: ["admin", "muhendis"] });
    lokasyon = await lokasyonIdsByName();
    admin = await signedInAs(["admin"]);
    muhendis = await signedInAs(["muhendis"]);
    depoSorumlusu = await signedInAs(["depo_sorumlusu"], [lokasyon["Karaköy Mağaza"]]);
    const { createProduct } = await import("./products");
    core = (await createProduct(muhendis.headers, { ...ferrit, minLevel: "10" })).id;
    await move("in", "12");
  });
  after(() => db.$client.end());

  test("only admin and mühendis set or change a Kritik seviye", async () => {
    const { updateProduct } = await import("./products");
    const { Forbidden } = await import("./guard");
    await assert.rejects(updateProduct(depoSorumlusu.headers, core, { ...ferrit, minLevel: "5" }), Forbidden);
    await updateProduct(admin.headers, core, { ...ferrit, minLevel: "8" });
    await assert.rejects(updateProduct(admin.headers, core, { ...ferrit, minLevel: "1,5" }), /tam sayı/);
  });

  test("crossing below the level sends one email; staying below sends nothing; going back above and below sends one more", async () => {
    await move("out", "3"); // 12 → 9: crosses
    assert.equal((await notifications()).length, 1);
    await move("out", "1"); // 9 → 8: still below
    assert.equal((await notifications()).length, 1);
    await move("in", "5"); // 8 → 13: back above
    assert.equal((await notifications()).length, 1);
    await move("out", "4"); // 13 → 9: crosses again
    const all = await notifications();
    assert.equal(all.length, 2);
    assert.match(all[0].subject, /T-CORE/);
    assert.match(all[0].body, /Kritik seviye: 10 adet/);
  });

  test("recipients come from roles: admin and mühendis by default, changeable by an admin", async () => {
    await move("out", "3");
    const [first] = await notifications();
    assert.deepEqual([...first.recipients].sort(), [admin.user.email, muhendis.user.email].sort());

    const { Forbidden } = await import("./guard");
    await assert.rejects(outbox.setRecipientRoles(muhendis.headers, ["muhendis"]), Forbidden);
    await outbox.setRecipientRoles(admin.headers, ["admin"]);
    await move("in", "5");
    await move("out", "5");
    const latest = (await notifications()).at(-1)!;
    assert.deepEqual(latest.recipients, [admin.user.email]);
  });

  test("if Resend fails the movement still commits; a retry sends once with the same idempotency key", async () => {
    await move("out", "3");
    assert.equal((await notifications())[0].status, "pending");

    const calls: string[] = [];
    const failing: import("./outbox").EmailSender = async (email) => {
      calls.push(email.idempotencyKey);
      throw new Error("Resend 500");
    };
    await outbox.processOutbox(failing, { now: new Date() });
    const [failed] = await notifications();
    assert.equal(failed.status, "failed");
    assert.equal(failed.attempts, 1);
    assert.match(failed.lastError ?? "", /Resend 500/);
    // The stock movement that caused it is untouched.
    const { getBalances } = await import("./ledger");
    assert.equal((await getBalances(muhendis.headers, core)).total.physical, "9");

    const working: import("./outbox").EmailSender = async (email) => {
      calls.push(email.idempotencyKey);
    };
    await outbox.processOutbox(working, { now: new Date(Date.now() + 60 * 60_000) });
    await outbox.processOutbox(working, { now: new Date(Date.now() + 120 * 60_000) });
    const [sent] = await notifications();
    assert.equal(sent.status, "sent");
    assert.deepEqual(calls, [sent.id, sent.id], "both attempts used the notification id, and nothing was sent after success");
  });

  test("a failed email waits before it is retried", async () => {
    await move("out", "3");
    await outbox.processOutbox(async () => {
      throw new Error("down");
    }, { now: new Date() });
    let called = false;
    await outbox.processOutbox(async () => {
      called = true;
    }, { now: new Date() });
    assert.equal(called, false);
  });

  test("two simultaneous stock-outs at different Lokasyon crossing the level send one email", async () => {
    // 6 at each Lokasyon (company total 12, level 10). The two stock-outs touch different balance
    // rows, so only the product lock makes the second see the first: 12 → 10 → 8, one crossing.
    await move("out", "6");
    const { recordReceipt } = await import("./receipts");
    await recordReceipt(muhendis.headers, {
      lokasyonId: lokasyon["Çekmeköy İmalathane"],
      supplier: "TDK",
      reference: "İrsaliye",
      lines: [{ productId: core, quantity: "6" }],
      idempotencyKey: key(),
    });
    await db.delete(schema.notification);
    const { recordStockOut } = await import("./stock-out");
    const out = (name: keyof typeof lokasyon) =>
      recordStockOut(muhendis.headers, {
        type: "satis_teslimati",
        lokasyonId: lokasyon[name],
        reason: "Satış",
        lines: [{ productId: core, quantity: "2" }],
        idempotencyKey: key(),
      });
    await Promise.all([out("Karaköy Mağaza"), out("Çekmeköy İmalathane")]);
    assert.equal((await notifications()).length, 1);
  });

  test("a Kritik seviye of 0 is refused, since it could never warn", async () => {
    const { updateProduct } = await import("./products");
    await assert.rejects(updateProduct(admin.headers, core, { ...ferrit, minLevel: "0" }), /sıfırdan büyük/);
  });

  test("with nobody in the chosen roles the email is marked undeliverable, not retried", async () => {
    await outbox.setRecipientRoles(admin.headers, ["depo_sorumlusu"]);
    const { eq } = await import("drizzle-orm");
    await db.delete(schema.userRole).where(eq(schema.userRole.role, "depo_sorumlusu"));
    await move("out", "3");
    const [n] = await notifications();
    assert.equal(n.status, "failed");
    assert.match(n.lastError ?? "", /Alıcı yok/);
    let called = false;
    await outbox.processOutbox(async () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(outbox.gaveUp(n), true);
  });

  test("retries stop inside Resend's 24-hour idempotency window", async () => {
    await move("out", "3");
    await outbox.processOutbox(async () => {
      throw new Error("down");
    });
    let called = false;
    const nextDay = new Date(Date.now() + 23.5 * 60 * 60_000);
    await outbox.processOutbox(async () => {
      called = true;
    }, { now: nextDay });
    assert.equal(called, false);
    assert.equal(outbox.gaveUp((await notifications())[0], nextDay), true);
  });

  test("sent, failed and pending notifications are visible to admins only", async () => {
    await move("out", "3");
    assert.equal((await outbox.listNotifications(admin.headers)).length, 1);
    const { Forbidden } = await import("./guard");
    await assert.rejects(outbox.listNotifications(muhendis.headers), Forbidden);
  });

  test("the overview can show only products below their Kritik seviye", async () => {
    const { getOverview } = await import("./overview");
    assert.deepEqual((await getOverview(muhendis.headers, { belowMinimum: true })).rows, []);
    await move("out", "3");
    assert.deepEqual((await getOverview(muhendis.headers, { belowMinimum: true })).rows.map((r) => r.code), ["T-CORE"]);
  });
});
