import { and, desc, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { notification, notificationSetting, role } from "../db/schema";
import { UserError } from "./errors";
import { requirePermission } from "./guard";
import { recipientRoles } from "./kritik-seviye";

export type Email = { to: string[]; subject: string; text: string; idempotencyKey: string };
export type EmailSender = (email: Email) => Promise<void>;

// Sends through Resend's HTTP API. Resend drops a repeat with the same Idempotency-Key, so a
// retry after a lost response never reaches anyone twice.
export const resendSender: EmailSender = async (email) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY veya RESEND_FROM tanımlı değil.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": email.idempotencyKey,
    },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text }),
    // The outbox row stays locked while this runs, so a hung request must not hold it.
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
};

const maxAttempts = 10;
// Resend remembers an idempotency key for 24 hours. Retrying later could repeat an email whose
// first send went through but whose response was lost, so retries stop well inside that window.
const retryWindowMs = 23 * 60 * 60_000;
// 5 min, 10 min, 20 min, 40 min, then hourly.
const retryDelay = (attempts: number) => Math.min(5 * 60_000 * 2 ** (attempts - 1), 60 * 60_000);

// A failed notification that will not be retried any more.
export function gaveUp(n: { status: string; attempts: number; createdAt: Date; recipients: string[] }, now = new Date()) {
  return (
    n.status === "failed" &&
    (n.attempts >= maxAttempts || n.recipients.length === 0 || now.getTime() - n.createdAt.getTime() > retryWindowMs)
  );
}

// Sends due notifications one by one. Rows are claimed with SKIP LOCKED, so two runs never send
// the same notification at the same time.
export async function processOutbox(send: EmailSender = resendSender, { now = new Date(), limit = 20 } = {}) {
  let processed = 0;
  while (processed < limit) {
    const handled = await db.transaction(async (tx) => {
      const [due] = await tx
        .select()
        .from(notification)
        .where(
          and(
            inArray(notification.status, ["pending", "failed"]),
            lte(notification.nextAttemptAt, now),
            lt(notification.attempts, maxAttempts),
            gt(notification.createdAt, new Date(now.getTime() - retryWindowMs)),
            sql`cardinality(${notification.recipients}) > 0`,
          ),
        )
        .orderBy(notification.createdAt)
        .limit(1)
        .for("update", { skipLocked: true });
      if (!due) return false;

      try {
        await send({ to: due.recipients, subject: due.subject, text: due.body, idempotencyKey: due.id });
        await tx
          .update(notification)
          .set({ status: "sent", sentAt: now, attempts: due.attempts + 1, lastError: null })
          .where(eq(notification.id, due.id));
      } catch (error) {
        const attempts = due.attempts + 1;
        await tx
          .update(notification)
          .set({
            status: "failed",
            attempts,
            lastError: error instanceof Error ? error.message : String(error),
            nextAttemptAt: new Date(now.getTime() + retryDelay(attempts)),
          })
          .where(eq(notification.id, due.id));
      }
      return true;
    });
    if (!handled) break;
    processed++;
  }
  return processed;
}

export async function listNotifications(headers: Headers) {
  await requirePermission(headers, "notifications.manage");
  return db.select().from(notification).orderBy(desc(notification.createdAt)).limit(200);
}

export async function getRecipientRoles(headers: Headers) {
  await requirePermission(headers, "notifications.manage");
  return recipientRoles(db);
}

const rolesInput = z.array(z.enum(role.enumValues)).min(1, { error: "En az bir rol seçin." });

export async function setRecipientRoles(headers: Headers, roles: string[]) {
  await requirePermission(headers, "notifications.manage");
  const parsed = rolesInput.safeParse(roles);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  await db
    .insert(notificationSetting)
    .values({ key: "kritik_seviye", roles: parsed.data })
    .onConflictDoUpdate({ target: notificationSetting.key, set: { roles: parsed.data } });
}
