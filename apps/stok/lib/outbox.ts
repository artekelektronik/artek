import { and, desc, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { notification, notificationSetting, role } from "../db/schema";
import { parseInput } from "./errors";
import { requirePermission } from "./guard";
import { recipientRoles } from "./kritik-seviye";

import { resendSender, type EmailSender } from "./email";

const maxAttempts = 10;
// Resend keeps idempotency keys 24 hours; retries stop before that so a lost response can't double-send.
const retryWindowMs = 23 * 60 * 60_000;
// 5 min, 10 min, 20 min, 40 min, then hourly.
const retryDelay = (attempts: number) => Math.min(5 * 60_000 * 2 ** (attempts - 1), 60 * 60_000);

export function gaveUp(n: { status: string; attempts: number; createdAt: Date; recipients: string[] }, now = new Date()) {
  return (
    n.status === "failed" &&
    (n.attempts >= maxAttempts || n.recipients.length === 0 || now.getTime() - n.createdAt.getTime() > retryWindowMs)
  );
}

// SKIP LOCKED: two runs never send the same notification.
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
  const data = parseInput(rolesInput, roles);
  await db
    .insert(notificationSetting)
    .values({ key: "kritik_seviye", roles: data })
    .onConflictDoUpdate({ target: notificationSetting.key, set: { roles: data } });
}
